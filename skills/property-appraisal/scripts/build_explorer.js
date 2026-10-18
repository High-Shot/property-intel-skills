#!/usr/bin/env node
/**
 * Property Appraisal — Comp Explorer builder
 *
 * Usage:
 *   node build_explorer.js <appraisal_data.json> <output.html> [--fragment] [--strict]
 *
 *   --fragment  Emit the page body only (no doctype/html/head/body). Use this when
 *               publishing through the Artifact tool, which adds its own skeleton.
 *               Default output is a complete standalone HTML document.
 *   --strict    Exit 2 if any WARN fires. Use in unattended or automated runs.
 *
 * No dependencies. Reads the same appraisal_data.json the deck builder reads,
 * so the explorer's default state is the deck's value by construction.
 */

const fs = require("fs");
const path = require("path");
const { computeValue, haversineMi } = require("./explorer_math.js");

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith("--")));
const [inputPath, outputPath = "comp_explorer.html"] = args.filter(a => !a.startsWith("--"));
if (!inputPath) {
  console.error("Usage: node build_explorer.js <appraisal_data.json> [output.html] [--fragment] [--strict]");
  process.exit(1);
}
const A = JSON.parse(fs.readFileSync(inputPath, "utf8"));

// ===== Extract only what the page needs =====
const P = A.property || {};
const D = {
  address: P.address,
  city_state_zip: P.city_state_zip,
  report_date: P.report_date,
  list_price: P.list_price ?? A.value_vs_price?.list_price ?? null,
  subject_sqft: P.sqft,
  beds: P.beds, baths: P.baths, year_built: P.year_built,
  lat: P.lat ?? null, lng: P.lng ?? null,
  value_conclusion: A.value_conclusion,
  base_indicated_value: A.reconciliation?.base_indicated_value,
  condition_total: A.condition_total ?? 0,
  avm_checks: A.reconciliation?.avm_checks || [],
  comps: (A.comps || []).map(c => ({
    address: c.address, sold_date: c.sold_date, sold_price: c.sold_price, sqft: c.sqft,
    ppsf: c.ppsf, distance_mi: c.distance_mi, source: c.source, source_tier: c.source_tier,
    key_diffs: c.key_diffs, net_adjustment: c.net_adjustment, adjusted_value: c.adjusted_value,
    weight: c.weight, lat: c.lat ?? null, lng: c.lng ?? null
  })),
  screened_out: (A.screened_out || []).map(s => ({
    address: s.address, sold_price: s.sold_price ?? null, sold_date: s.sold_date ?? null,
    reason: s.reason, lat: s.lat ?? null, lng: s.lng ?? null
  }))
};

// ===== Validation =====
const warnings = [];
const warn = m => { warnings.push(m); console.warn("WARN: " + m); };

if (!D.subject_sqft) warn("property.sqft missing; the $/sq ft strip cannot be drawn");
if (!D.comps.length) warn("no comps in the data file");
if (D.comps.length > 5) warn("more than 5 comps; the deck grid holds 5 and the explorer must match the deck");
D.comps.forEach((c, i) => {
  if (c.source_tier === 3) warn(`comp ${i + 1} has source_tier 3. AVMs are never comps`);
  if (typeof c.adjusted_value !== "number" || typeof c.weight !== "number") warn(`comp ${i + 1} is missing adjusted_value or weight`);
});
const wSum = D.comps.reduce((a, c) => a + (c.weight || 0), 0);
if (Math.abs(wSum - 1) > 0.01) warn(`comp weights sum to ${wSum.toFixed(2)}, expected 1.00`);

// The page shows the deck's numbers in its default state. Prove the arithmetic
// reproduces them, or the first toggle would jump for reasons unrelated to the comp removed.
if (D.comps.length && D.value_conclusion) {
  const allOn = D.comps.map(() => true);
  const exact = computeValue(D, allOn, { exact: true });
  const deck = computeValue(D, allOn);
  const pv = D.value_conclusion.point_value;
  if (Math.abs(exact.point - pv) > 1000)
    warn(`recomputed point value ${exact.point} differs from deck point_value ${pv} by more than $1,000; toggles would not start from the deck's number`);
  if (Math.abs(exact.base - D.base_indicated_value) > 1000)
    warn(`recomputed weighted comp value ${exact.base} differs from base_indicated_value ${D.base_indicated_value} by more than $1,000`);
  const deckVerdict = D.value_conclusion.vs_list_verdict;
  if (D.list_price && deckVerdict && deck.verdict !== deckVerdict)
    warn(`deck verdict "${deckVerdict}" but methodology section 8 gives "${deck.verdict}" for list ${D.list_price} vs point ${pv}`);
  if (D.value_conclusion.range_low > pv || D.value_conclusion.range_high < pv)
    warn("value_conclusion range does not bracket point_value");
}

// Coordinates: optional, but if present they must agree with the stated distance.
const geoMissing = [D.lat, D.lng].some(v => v == null) || D.comps.some(c => c.lat == null || c.lng == null);
if (geoMissing) {
  warn("coordinates missing for the subject or at least one comp; the map renders as a notice instead. Add lat/lng per data_sources.md");
} else {
  D.comps.forEach((c, i) => {
    const d = haversineMi(D.lat, D.lng, c.lat, c.lng);
    if (Math.abs(d - c.distance_mi) > Math.max(0.25, 0.5 * c.distance_mi))
      warn(`comp ${i + 1} coordinates put it ${d.toFixed(2)} mi from the subject but distance_mi says ${c.distance_mi}; check the geocode`);
  });
}
D.screened_out.forEach((s, i) => {
  if (!s.reason) warn(`screened_out ${i + 1} (${s.address}) has no reason; every dropped sale needs one`);
});
if (D.screened_out.length > 8) warn("more than 8 screened_out entries; keep the strongest rejects that a buyer would ask about");
if (/<Month|<TODAY|<YYYY/.test(JSON.stringify(D))) warn("a date placeholder survived into the data file; generate it from the run date");

// ===== Assemble =====
const tplPath = path.join(__dirname, "..", "assets", "comp_explorer.html");
let page = fs.readFileSync(tplPath, "utf8");
const title = `${D.address || "Subject"} Comps`;
const escHtml = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
// JSON inside <script>: neutralize "</" so data can never close the tag.
const json = JSON.stringify(D).replace(/</g, "\\u003c");
page = page
  .replace("__TITLE__", escHtml(title))
  .replace("/*__DATA__*/null", () => json)
  .replace("/*__MATH__*/", () => computeValue.toString() + "\n" + haversineMi.toString());

if (!flags.has("--fragment")) {
  // Standalone: lift the leading <title>/<meta> into a real <head>.
  let headExtra = "";
  page = page.replace(/^(<title>[\s\S]*?<\/title>\s*<meta[^>]*>\s*)/, m => { headExtra = m.trim() + "\n"; return ""; });
  page = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n` + headExtra +
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n` +
    `<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>\n` +
    `</head>\n<body>\n${page}\n</body>\n</html>\n`;
}
fs.writeFileSync(outputPath, page);
console.log(`Wrote ${outputPath} (${warnings.length} warning${warnings.length === 1 ? "" : "s"})`);
if (flags.has("--strict") && warnings.length) process.exit(2);
