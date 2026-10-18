#!/usr/bin/env node
/**
 * Property Intel Report — Dossier dashboard builder (Stage 5 only)
 *
 * Usage:
 *   node build_dashboard.js <property_facts.json> <output.html>
 *        [--appraisal appraisal_data.json] [--insurance insurance_data.json] [--intel property_data.json]
 *        [--today YYYY-MM-DD] [--fragment] [--strict]
 *
 * Reads numbers ONLY from property_facts.json, where each owning skill wrote them.
 * The three deck data files are optional and used for one thing: proving the
 * dashboard and the decks show the same numbers. Pass all three in a dossier run.
 *
 *   --fragment  page body only, for an Artifact publish (it adds its own skeleton)
 *   --strict    exit 2 if any WARN fires (unattended runs)
 *   --today     run date for staleness checks (default: system date)
 */

const fs = require("fs");
const path = require("path");
const { pmt, fhaAnnualMip, computeCarry, repairBudget, deductibleTable } = require("./dashboard_math.js");

const { PMI_RATE, PMI_AS_OF, FHA, K203 } = require("./anchors.js");

// ===== args =====
const argv = process.argv.slice(2);
const opt = {}; const pos = []; const flags = new Set();
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (["--appraisal", "--insurance", "--intel", "--today"].includes(a)) opt[a.slice(2)] = argv[++i];
  else if (a.startsWith("--")) flags.add(a);
  else pos.push(a);
}
const [factsPath, outPath = "dossier_dashboard.html"] = pos;
if (!factsPath) {
  console.error("Usage: node build_dashboard.js <property_facts.json> [output.html] [--appraisal f] [--insurance f] [--intel f] [--today YYYY-MM-DD] [--fragment] [--strict]");
  process.exit(1);
}
const read = p => JSON.parse(fs.readFileSync(p, "utf8"));
const PF = read(factsPath);
const today = opt.today ? new Date(opt.today + "T12:00:00Z") : new Date();

const warnings = [];
const warn = m => { warnings.push(m); console.warn("WARN: " + m); };

// ===== map facts -> page data =====
const { mapFacts } = require("./facts_map.js");
const { F, A, M, VAL, INS } = mapFacts(PF, opt);
// ===== validation: completeness =====
if (!F.value) warn("value block missing: run property-appraisal first; the value tile and value-vs-rebuild panel show a notice");
else {
  if (!(F.value.low <= F.value.point && F.value.point <= F.value.high)) warn("value.low/point/high are out of order");
  if (VAL.from_skill && VAL.from_skill !== "property-appraisal") warn(`value.from_skill is "${VAL.from_skill}"; property-appraisal owns market value`);
}
if (!F.list_price) warn("market.list_price missing; carry comparisons against list are skipped");
if (F.rate_pct == null) warn("market.mortgage_rate_pct missing; principal and interest compute at 0%");
if (F.tax_annual == null) warn("market.tax_annual_post_sale missing; carry total excludes property tax");
if (!INS) warn("insurance block missing: run property-insurance-brief; carry excludes insurance and the deductible panel shows a notice");
else {
  if (INS.from_skill && INS.from_skill !== "property-insurance-brief") warn(`insurance.from_skill is "${INS.from_skill}"; property-insurance-brief owns premiums`);
  if (F.premium_low == null || F.premium_high == null) warn("insurance.premium_low/high missing");
  else if (F.premium_low > F.premium_high) warn("insurance.premium_low is above premium_high");
  if (F.cov_a_est == null) warn("insurance.cov_a_est missing");
  const profile = INS.market_profile || "coastal";
  if (profile === "coastal") {
    if (!F.wind_deductible_options_pct.length) warn("coastal profile but insurance.wind_deductible_options_pct is empty");
    else if (!F.wind_deductible_options_pct.includes(F.wind_deductible_pct)) warn(`wind_deductible_pct ${F.wind_deductible_pct} is not one of the options ${JSON.stringify(F.wind_deductible_options_pct)}`);
  } else if (F.wind_deductible_options_pct.length) warn("inland profile but wind deductible options are populated");
  if ((F.flood_premium_low == null) !== (F.flood_premium_high == null)) warn("flood premium has only one end of its range");
}

// ===== validation: staleness =====
const daysOld = s => (s && /^\d{4}-\d{2}-\d{2}/.test(s)) ? (today - new Date(s.slice(0, 10) + "T12:00:00Z")) / 864e5 : null;
// The rate's own survey date governs. A stale weekly rate pulled today is still stale.
const rateRetrieved = M.rate_date || (PF.provenance || {})["market.mortgage_rate_pct"]?.retrieved;
const rAge = daysOld(rateRetrieved);
// ===== validation: repairs, FHA, reconciliation note =====
if (F.repairs) {
  if (F.repairs.from_skill && F.repairs.from_skill !== "property-appraisal") warn(`repairs.from_skill is "${F.repairs.from_skill}"; property-appraisal owns the condition and repair list`);
  F.repairs.items.forEach((r, i) => {
    if (!(typeof r.low === "number" && typeof r.high === "number" && r.low <= r.high)) warn(`repairs.items[${i}] "${r.item}" needs numeric low <= high`);
    if (r.full_low != null && !(r.full_low >= r.low && r.full_high >= r.full_low)) warn(`repairs.items[${i}] "${r.item}" full scope must be >= minimum scope`);
  });
}
if (F.repairs && F.fha.loan_limit == null) warn("market.fha_loan_limit missing; the FHA and 203(k) checks cannot test the county limit");
const fhaAgeMo = (() => { const [y, m] = FHA.as_of.split("-").map(Number); return (today.getUTCFullYear() - y) * 12 + (today.getUTCMonth() + 1 - m); })();
if (fhaAgeMo > 6) warn(`FHA/203(k) anchors are ${fhaAgeMo} months old (as_of ${FHA.as_of}); re-verify in rates_and_anchors.md and here`);
if (opt.appraisal && opt.insurance && opt.intel && !F.note) warn("dossier.note missing: a full dossier run must write the reconciliation note into property_facts.json so the dashboard carries it");
if (F.note) {
  const items = F.note.items || [];
  if (items.length < 1 || items.length > 5) warn(`dossier.note has ${items.length} items; write 3-4 (carry vs premium, list vs value, value vs Cov A, the one thing)`);
  const words = [F.note.headline].concat(items.map(x => `${x.label} ${x.body}`)).join(" ").split(/\s+/).length;
  if (words > 230) warn(`dossier.note runs ${words} words; keep it under ~200`);
  if (F.value) {
    const pv = `$${Math.round(F.value.point / 1000)}K`, pvFull = `$${F.value.point.toLocaleString("en-US")}`;
    const blob = JSON.stringify(F.note);
    if (!blob.includes(pv) && !blob.includes(pvFull)) warn(`dossier.note never states the appraisal point (${pv}); the note must reconcile against it`);
  }

}
if (rAge == null) warn("mortgage rate has no retrieval date; cannot tell if it is current");
else if (rAge > 7) warn(`mortgage rate is ${Math.round(rAge)} days old; market fields go stale after 7 days. Re-pull Freddie Mac PMMS`);
const [py, pm] = PMI_AS_OF.split("-").map(Number);
const pmiAgeMo = (today.getUTCFullYear() - py) * 12 + (today.getUTCMonth() + 1 - pm);
if (pmiAgeMo > 6) warn(`PMI anchor is ${pmiAgeMo} months old (as_of ${PMI_AS_OF}); re-verify it in rates_and_anchors.md and here`);
if (/<Month|<TODAY|<YYYY|YYYY-MM-DD/.test(JSON.stringify(F))) warn("a date placeholder survived into the facts file");

// ===== validation: cross-check against the decks =====
const normAddr = s => String(s || "").toLowerCase().replace(/\b(road|rd|drive|dr|lane|ln|street|st|court|ct|avenue|ave|way)\b/g, m => m.slice(0, 2)).replace(/[^a-z0-9]/g, "");
const subj = normAddr(A.street);
const money = s => { if (typeof s === "number") return s; const m = String(s || "").replace(/,/g, "").match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : null; };

if (opt.appraisal) {
  const AP = read(opt.appraisal), vc = AP.value_conclusion || {};
  if (normAddr(AP.property?.address) !== subj) warn(`appraisal file is for "${AP.property?.address}", facts are for "${A.street}"`);
  if (F.value) {
    [["point_value", "point"], ["range_low", "low"], ["range_high", "high"]].forEach(([k, f]) => {
      if (vc[k] !== F.value[f]) warn(`appraisal ${k} ${vc[k]} != facts value.${f} ${F.value[f]}; the dashboard would contradict the appraisal deck`);
    });
    if (vc.confidence && vc.confidence !== F.value.confidence) warn(`appraisal confidence "${vc.confidence}" != facts "${F.value.confidence}"`);
  }
  const apList = AP.property?.list_price;
  if (apList && F.list_price && apList !== F.list_price) warn(`appraisal list price ${apList} != facts market.list_price ${F.list_price}`);
}
if (opt.insurance) {
  const IN = read(opt.insurance);
  if (normAddr(IN.property?.address) !== subj) warn(`insurance file is for "${IN.property?.address}", facts are for "${A.street}"`);
  const lo = money(IN.premium_range?.range_low), hi = money(IN.premium_range?.range_high);
  if (lo !== F.premium_low || hi !== F.premium_high) warn(`insurance deck premium range ${lo}-${hi} != facts ${F.premium_low}-${F.premium_high}`);
  const chosen = (IN.wind_deductible?.options || []).find(o => o.chosen === true || o.chosen === "default");
  if (chosen && money(chosen.pct) !== F.wind_deductible_pct) warn(`insurance deck shows ${chosen.pct} wind deductible, facts say ${F.wind_deductible_pct}%`);
  const covStat = (IN.coverage_spec?.stats || []).find(s => /COV A|DWELLING/i.test(s.label || ""));
  if (covStat && money(covStat.big) !== F.cov_a_est) warn(`insurance deck Cov A ${covStat.big} != facts cov_a_est ${F.cov_a_est}`);
  (IN.wind_deductible?.options || []).forEach(o => {
    const want = Math.round(F.cov_a_est * money(o.pct) / 100);
    if (Math.abs(money(o.dollars) - want) > 50) warn(`insurance deck says ${o.pct} = ${o.dollars}, but ${o.pct} of ${F.cov_a_est} is ${want}`);
  });
}
if (opt.intel) {
  const PD = read(opt.intel);
  if (normAddr(PD.property?.address) !== subj) warn(`intel file is for "${PD.property?.address}", facts are for "${A.street}"`);
  const sc = (PD.monthly_carry?.scenarios || []).find(s => typeof s.tax === "number");
  if (sc && F.tax_annual != null && Math.abs(sc.tax * 12 - F.tax_annual) > 60)
    warn(`intel carry slide tax ${sc.tax}/mo (${sc.tax * 12}/yr) != facts tax_annual_post_sale ${F.tax_annual}`);
  // Reconciliation rule from SKILL.md Stage 5: flag when the intel carry's insurance differs from the sourced range by more than $75/mo.
  if (sc && F.premium_low != null) {
    const intelIns = ["ins", "wind", "flood"].reduce((a, k) => a + (typeof sc[k] === "number" ? sc[k] : 0), 0);
    const srcLo = (F.premium_low + (F.flood_premium_low || 0)) / 12, srcHi = (F.premium_high + (F.flood_premium_high || 0)) / 12;
    if (intelIns < srcLo - 75 || intelIns > srcHi + 75)
      warn(`intel carry insurance $${intelIns}/mo is more than $75/mo outside the insurance brief range $${Math.round(srcLo)}-$${Math.round(srcHi)}/mo; update the intel carry slide to cite the brief`);
  }
}

// ===== self-check: the page math reproduces at the default state =====
if (F.value && F.rate_pct != null) {
  const c = computeCarry(F, { price: F.value.point, downPct: 20, cash: false, ratePct: F.rate_pct, years: 30 });
  const hand = pmt(F.value.point * 0.8, F.rate_pct, 30);
  if (Math.abs(c.pi - hand) > 0.5) warn("internal: carry P&I does not match the payment formula");
  if (!(c.low <= c.high)) warn("internal: carry low exceeds high");
  const f = computeCarry(F, { price: F.value.point, downPct: 3.5, cash: false, ratePct: F.rate_pct, years: 30, loanType: "fha", financed: 0 });
  const fBase = F.value.point - Math.round(F.value.point * 0.035);
  if (Math.abs(f.pi - pmt(fBase + Math.round(fBase * FHA.ufmip_rate), F.rate_pct, 30)) > 0.5) warn("internal: FHA P&I does not match base + upfront MIP");
  if (Math.abs(f.pmi - fBase * FHA.mip30_gt95 / 12) > 0.5) warn("internal: FHA annual MIP does not match the 96.5% LTV tier");
  if (F.repairs) { const rb = repairBudget(F, "min", false); if (!(rb.low <= rb.high)) warn("internal: repair budget low exceeds high"); }
}
if (F.cov_a_est && F.wind_deductible_options_pct.length) deductibleTable(F, {});

// ===== assemble =====
let page = fs.readFileSync(path.join(__dirname, "..", "assets", "dossier_dashboard.html"), "utf8");
const escHtml = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
page = page
  .replace("__TITLE__", escHtml(`${F.address} Dossier`))
  .replace("/*__DATA__*/null", () => JSON.stringify(F).replace(/</g, "\\u003c"))
  .replace("/*__MATH__*/", () => [pmt, fhaAnnualMip, computeCarry, repairBudget, deductibleTable].map(f => f.toString()).join("\n"));

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
