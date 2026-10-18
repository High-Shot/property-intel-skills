#!/usr/bin/env node
/**
 * Property Intel Report — compare mode
 *
 * Usage:
 *   node build_compare.js <facts_A.json> <facts_B.json> [facts_C.json] [facts_D.json]
 *        -o compare.html [--today YYYY-MM-DD] [--fragment] [--strict]
 *
 * Lines up 2-4 houses that each have a property_facts.json from a dossier (or a
 * partial run). Reads numbers only from the caches, the way the dashboard does,
 * and runs the same carry and repair math with one set of financing controls, so
 * the houses are compared on identical assumptions.
 *
 *   --fragment  page body only, for an Artifact publish
 *   --strict    exit 2 if any WARN fires
 *   --today     run date for staleness checks (default: system date)
 */

const fs = require("fs");
const path = require("path");
const { pmt, fhaAnnualMip, computeCarry, repairBudget } = require("./dashboard_math.js");
const { FHA } = require("./anchors.js");
const { mapFacts } = require("./facts_map.js");

const argv = process.argv.slice(2);
const files = []; const opt = {}; const flags = new Set();
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "-o" || a === "--out") opt.out = argv[++i];
  else if (a === "--today") opt.today = argv[++i];
  else if (a.startsWith("--")) flags.add(a);
  else files.push(a);
}
if (files.length < 2 || files.length > 4) {
  console.error("Usage: node build_compare.js <facts_A.json> <facts_B.json> [C] [D] -o compare.html [--today YYYY-MM-DD] [--fragment] [--strict]");
  process.exit(1);
}
const outPath = opt.out || "compare.html";
const today = opt.today ? new Date(opt.today + "T12:00:00Z") : new Date();
const warnings = [];
const warn = m => { warnings.push(m); console.warn("WARN: " + m); };
const daysOld = s => (s && /^\d{4}-\d{2}-\d{2}/.test(s)) ? (today - new Date(s.slice(0, 10) + "T12:00:00Z")) / 864e5 : null;
const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const houses = files.map(fp => {
  const PF = JSON.parse(fs.readFileSync(fp, "utf8"));
  const { F, M } = mapFacts(PF, opt);
  const S = PF.structure || {}, Hz = PF.hazard || {};
  return {
    F,
    key: norm([PF.address?.street, PF.address?.zip || PF.address?.city].join(" ")),
    rate_raw: M.rate_date || null,
    house: {
      sqft: S.sqft || null, year: S.year_built || null, beds: S.beds ?? null, baths: S.baths ?? null,
      lot: S.lot_acres ?? null, pool: !!S.pool,
      fema: Hz.fema_zone === undefined ? undefined : Hz.fema_zone,
      wind: Hz.first_street ? Hz.first_street.wind : null
    }
  };
});

// ===== validation =====
const seen = {};
houses.forEach((h, i) => {
  if (seen[h.key] != null) warn(`houses ${seen[h.key] + 1} and ${i + 1} are the same house ("${h.F.address}"); compare needs different addresses`);
  else seen[h.key] = i;
  if (!h.F.value) warn(`${h.F.address}: no value block; run property-appraisal so its value and list gap can be compared`);
  if (h.F.premium_low == null) warn(`${h.F.address}: no insurance range; carry for this house excludes insurance`);
  if (h.F.tax_annual == null) warn(`${h.F.address}: no post-sale tax; carry for this house excludes tax`);
  const age = daysOld(h.rate_raw);
  if (age != null && age > 7) warn(`${h.F.address}: mortgage rate is ${Math.round(age)} days old; the page uses one shared rate, the most recent`);
});
const dated = houses.map(h => h.rate_raw).filter(Boolean).sort();
if (dated.length > 1 && daysOld(dated[0]) - daysOld(dated[dated.length - 1]) > 7)
  warn(`rate dates span ${dated[0]} to ${dated[dated.length - 1]}; refresh the older dossier before relying on carry differences`);
const fhaAgeMo = (() => { const [y, m] = FHA.as_of.split("-").map(Number); return (today.getUTCFullYear() - y) * 12 + (today.getUTCMonth() + 1 - m); })();
if (fhaAgeMo > 6) warn(`FHA/203(k) anchors are ${fhaAgeMo} months old (as_of ${FHA.as_of}); re-verify`);

// shared rate: the most recent one any house carries
const newest = houses.filter(h => h.rate_raw).sort((a, b) => (a.rate_raw < b.rate_raw ? 1 : -1))[0];
const lead = houses.find(h => h.F.buyer) || null;
const DATA = {
  houses: houses.map(h => Object.assign({}, h.F, { house: h.house })),
  shared: {
    rate_pct: newest ? newest.F.rate_pct : houses[0].F.rate_pct,
    rate_source: newest ? newest.F.rate_source : null, rate_date: newest ? newest.F.rate_date : null,
    loan_type: lead ? lead.F.buyer.loan_type : "conv",
    down_pct: lead ? lead.F.buyer.down_pct : 20,
    report_date: houses[0].F.report_date
  }
};

// self-check: page math reproduces at the default state
DATA.houses.forEach(F => {
  const price = F.value ? F.value.point : F.list_price;
  if (!price || F.rate_pct == null) return;
  const c = computeCarry(F, { price, downPct: 20, cash: false, ratePct: DATA.shared.rate_pct, years: 30, loanType: "conv", financed: 0 });
  if (Math.abs(c.pi - pmt(price * 0.8, DATA.shared.rate_pct, 30)) > 0.5) warn(`internal: carry P&I mismatch for ${F.address}`);
});

let page = fs.readFileSync(path.join(__dirname, "..", "assets", "compare.html"), "utf8");
const escHtml = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const shortName = a => String(a).split(/\s+/).slice(0, 3).join(" ");
page = page
  .replace("__TITLE__", escHtml(houses.map(h => shortName(h.F.address)).join(" vs ")))
  .replace("/*__DATA__*/null", () => JSON.stringify(DATA).replace(/</g, "\\u003c"))
  .replace("/*__MATH__*/", () => [pmt, fhaAnnualMip, computeCarry, repairBudget].map(f => f.toString()).join("\n"));

if (!flags.has("--fragment")) {
  let head = "";
  page = page.replace(/^(<title>[\s\S]*?<\/title>\s*<meta[^>]*>\s*)/, m => { head = m.trim() + "\n"; return ""; });
  page = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n${head}` +
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n` +
    `<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>\n` +
    `</head>\n<body>\n${page}\n</body>\n</html>\n`;
}
fs.writeFileSync(outPath, page);
console.log(`Wrote ${outPath} (${warnings.length} warning${warnings.length === 1 ? "" : "s"})`);
if (flags.has("--strict") && warnings.length) process.exit(2);
