#!/usr/bin/env node
/**
 * Property Appraisal — Buyer's Valuation Brief Deck Builder
 *
 * Usage: node build_deck.js <appraisal_data.json> <output.pptx>
 *
 * 9 slides. Shares the locked design system with property-intel-report.
 */

const fs = require("fs");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const FA = require("react-icons/fa");

// ===== ARGS =====
const inputPath = process.argv[2];
const outputPath = process.argv[3] || "output.pptx";
if (!inputPath) {
  console.error("Usage: node build_deck.js <appraisal_data.json> [output.pptx]");
  process.exit(1);
}
const D = JSON.parse(fs.readFileSync(inputPath, "utf8"));

// ===== DATA VALIDATION (warnings, non-fatal) =====
(function validate() {
  const warn = m => console.warn("WARN: " + m);
  const wSum = (D.comps || []).reduce((a, c) => a + (c.weight || 0), 0);
  if (Math.abs(wSum - 1) > 0.01) warn(`comp weights sum to ${wSum.toFixed(2)}, expected 1.00`);
  const cSum = (D.condition_adjustments || []).reduce((a, c) => a + (c.amount || 0), 0);
  if (D.condition_total !== undefined && cSum !== D.condition_total)
    warn(`condition_total ${D.condition_total} != sum of adjustments ${cSum}`);
  const expected = (D.reconciliation?.base_indicated_value || 0) + (D.condition_total || 0);
  const pv = D.value_conclusion?.point_value || 0;
  if (Math.abs(expected - pv) > 1000)
    warn(`point_value ${pv} differs from base+condition ${expected} by more than $1,000`);
  (D.comps || []).forEach((c, i) => {
    if (c.source_tier === 3) warn(`comp ${i + 1} has source_tier 3 — AVMs are never comps`);
  });
  const weighted = (D.comps || []).reduce((a, c) => a + (c.adjusted_value || 0) * (c.weight || 0), 0);
  const base = D.reconciliation?.base_indicated_value || 0;
  if (Math.abs(weighted - base) > 1000)
    warn(`base_indicated_value ${base} differs from weighted comp sum ${Math.round(weighted)} by more than $1,000`);
  if ((D.comps || []).length > 5) warn("more than 5 comps; grid fits 5 — trim to strongest");
  // Thin comps must be met with Low confidence and a wider range, not a padded grid.
  const nc = (D.comps || []).length;
  const conf = String(D.value_conclusion?.confidence || "");
  if (nc && nc < 3 && !/low/i.test(conf))
    warn(`only ${nc} comp(s) but confidence is "${conf}" — fewer than 3 usable comps forces Low`);
  // Verdict strings are an enum; every field carrying one must match character for character.
  const v1 = D.value_conclusion?.vs_list_verdict, v2 = D.value_vs_price?.verdict_headline;
  if (v1 && v2 && v1 !== v2)
    warn(`verdict mismatch: vs_list_verdict "${v1}" != verdict_headline "${v2}" — same enum, must match exactly`);
  // The stated count of assumed inputs must match the rows actually tagged assumed.
  const nAssumed = (D.condition_adjustments || []).filter(c => c.tag === "assumed").length;
  const m = String(D.value_conclusion?.confidence_reason || "").match(/(\d+|one|two|three|four)\s+condition inputs?\s+assumed/i);
  if (m) {
    const words = { one: 1, two: 2, three: 3, four: 4 };
    const stated = words[m[1].toLowerCase()] ?? Number(m[1]);
    if (stated !== nAssumed) warn(`confidence_reason says ${m[1]} condition input(s) assumed but ${nAssumed} row(s) carry tag "assumed"`);
  }
  // Dates are generated from the run date, never hardcoded in a template.
  if (/<Month|<TODAY|<YYYY/.test(JSON.stringify(D))) warn("a date placeholder survived into the data file — generate it from the run date");
})();

// ===== LOCKED DESIGN SYSTEM =====
const C = {
  marine: "0A2540", teal: "1C7293", coral: "E36414", green: "2A9D8F",
  crimson: "B23A48", amber: "C9A227", white: "FFFFFF", ink: "1A1A1A",
  graphite: "3A4A5C", steel: "64748B", mist: "E5EBEF", hairline: "C9D2DA",
  panel: "0F3151"
};
const FONT_H = "Georgia";
const FONT_B = "Calibri";
const W = 13.333, H = 7.5;

// ===== HELPERS =====
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}
async function icon(iconName, hex) {
  const Component = FA[iconName];
  if (!Component) throw new Error("Unknown icon: " + iconName);
  const svg = renderIconSvg(Component, "#" + hex);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}
const sh = () => ({ type: "outer", blur: 8, offset: 2, angle: 90, color: "000000", opacity: 0.10 });

function header(s, pres, eyebrow, title, subtitle, accentColor = C.coral) {
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.4, w: 0.08, h: 0.95, fill: { color: accentColor }, line: { color: accentColor } });
  s.addText(eyebrow, { x: 0.85, y: 0.4, w: 10, h: 0.3, fontFace: FONT_B, fontSize: 12, color: accentColor, bold: true, charSpacing: 5, margin: 0 });
  s.addText(title, { x: 0.85, y: 0.7, w: 12.2, h: 0.7, fontFace: FONT_H, fontSize: 28, color: C.marine, bold: true, margin: 0 });
  if (subtitle) s.addText(subtitle, { x: 0.85, y: 1.45, w: 11.8, h: 0.55, fontFace: FONT_B, fontSize: 13, color: C.graphite, italic: true, margin: 0 });
}
function fmt$(n) {
  if (n === null || n === undefined || n === "") return "—";
  if (typeof n === "string") return n;
  const neg = n < 0;
  return (neg ? "−$" : "$") + Math.abs(n).toLocaleString();
}
function fmtAdj(n) {
  if (n === null || n === undefined) return "—";
  if (typeof n === "string") return n;
  return (n >= 0 ? "+$" : "−$") + Math.abs(n).toLocaleString();
}
function footerDisclaimer(s, dark = false) {
  s.addText("Valuation estimate for buyer decision support — not a licensed (USPAP) appraisal.", {
    x: 0.6, y: 7.12, w: 12.13, h: 0.3, fontFace: FONT_B, fontSize: 9,
    color: dark ? "7A93AB" : C.steel, italic: true, align: "center", margin: 0
  });
}
const confColor = c => (c === "High" ? C.green : c === "Medium" ? C.amber : C.crimson);
const impactColor = i => (i === "positive" ? C.green : i === "negative" ? C.crimson : i === "assumed" ? C.amber : C.steel);
const tagColor = t => (t === "verified" ? C.green : t === "assumed" ? C.amber : t === "reported-unverified" ? C.coral : C.steel);

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Property Appraisal";
  pres.title = `${D.property.address} — Buyer's Valuation Brief`;

  const iconCache = {};
  async function getIcon(name, hex) {
    const key = name + "_" + hex;
    if (!iconCache[key]) iconCache[key] = await icon(name, hex);
    return iconCache[key];
  }

  // ================= SLIDE 1 — TITLE (dark) =================
  {
    const s = pres.addSlide();
    s.background = { color: C.marine };
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.14, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("BUYER'S VALUATION BRIEF", { x: 0.9, y: 2.0, w: 11.5, h: 0.4, fontFace: FONT_B, fontSize: 15, color: C.coral, bold: true, charSpacing: 6, margin: 0 });
    s.addText(D.property.address, { x: 0.9, y: 2.5, w: 11.5, h: 1.1, fontFace: FONT_H, fontSize: 44, color: C.white, bold: true, margin: 0 });
    s.addText(D.property.city_state_zip, { x: 0.9, y: 3.65, w: 11.5, h: 0.5, fontFace: FONT_B, fontSize: 20, color: "AFC3D4", margin: 0 });
    const facts = [
      D.property.beds + " bd", D.property.baths + " ba",
      (D.property.sqft || 0).toLocaleString() + " sqft",
      D.property.lot_acres + " ac", "Built " + D.property.year_built
    ].join("   ·   ");
    s.addText(facts, { x: 0.9, y: 4.35, w: 11.5, h: 0.4, fontFace: FONT_B, fontSize: 14, color: "7A93AB", margin: 0 });
    s.addShape(pres.shapes.LINE, { x: 0.9, y: 5.15, w: 4.0, h: 0, line: { color: C.teal, width: 1.5 } });
    s.addText("Sales comparison appraisal with owner-interview condition adjustments", { x: 0.9, y: 5.35, w: 9, h: 0.35, fontFace: FONT_B, fontSize: 13, color: "AFC3D4", italic: true, margin: 0 });
    s.addText(D.property.report_date, { x: 0.9, y: 6.55, w: 6, h: 0.35, fontFace: FONT_B, fontSize: 12, color: "7A93AB", margin: 0 });
    footerDisclaimer(s, true);
  }

  // ================= SLIDE 2 — VALUE CONCLUSION =================
  {
    const s = pres.addSlide();
    const V = D.value_conclusion;
    header(s, pres, "VALUE CONCLUSION", "What This House Is Worth", null, C.coral);

    // Point value hero
    s.addText(fmt$(V.point_value), { x: 0.85, y: 1.7, w: 6.2, h: 1.2, fontFace: FONT_H, fontSize: 60, color: C.marine, bold: true, margin: 0 });
    s.addText("Indicated market value", { x: 0.9, y: 2.9, w: 6, h: 0.35, fontFace: FONT_B, fontSize: 14, color: C.graphite, margin: 0 });

    // Confidence badge
    const cc = confColor(V.confidence);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.6, y: 1.85, w: 5.1, h: 1.35, fill: { color: C.white }, line: { color: cc, width: 1.5 }, rectRadius: 0.08, shadow: sh() });
    s.addText("CONFIDENCE: " + V.confidence.toUpperCase(), { x: 7.85, y: 2.0, w: 4.6, h: 0.35, fontFace: FONT_B, fontSize: 14, color: cc, bold: true, charSpacing: 2, margin: 0 });
    s.addText(V.confidence_reason, { x: 7.85, y: 2.38, w: 4.6, h: 0.72, fontFace: FONT_B, fontSize: 11, color: C.graphite, margin: 0 });

    // Range band graphic
    const bandY = 4.1, bandX = 1.2, bandW = 10.9;
    const lo = V.range_low, hi = V.range_high, pv = V.point_value;
    const list = D.property.list_price;
    const min = Math.min(lo, list || lo) * 0.985;
    const max = Math.max(hi, list || hi) * 1.015;
    const pos = v => bandX + ((v - min) / (max - min)) * bandW;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bandX, y: bandY, w: bandW, h: 0.5, fill: { color: C.mist }, line: { color: C.hairline, width: 0.75 }, rectRadius: 0.05 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: pos(lo), y: bandY, w: pos(hi) - pos(lo), h: 0.5, fill: { color: C.teal, transparency: 25 }, line: { color: C.teal, width: 1 }, rectRadius: 0.05 });
    // point value marker
    s.addShape(pres.shapes.RECTANGLE, { x: pos(pv) - 0.03, y: bandY - 0.18, w: 0.06, h: 0.86, fill: { color: C.marine }, line: { color: C.marine } });
    s.addText("VALUE " + fmt$(pv), { x: pos(pv) - 1.1, y: bandY - 0.55, w: 2.2, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.marine, bold: true, align: "center", margin: 0 });
    // list price marker
    if (list) {
      s.addShape(pres.shapes.RECTANGLE, { x: pos(list) - 0.03, y: bandY - 0.18, w: 0.06, h: 0.86, fill: { color: C.coral }, line: { color: C.coral } });
      s.addText("LIST " + fmt$(list), { x: pos(list) - 1.1, y: bandY + 0.76, w: 2.2, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.coral, bold: true, align: "center", margin: 0 });
    }
    s.addText(fmt$(lo), { x: pos(lo) - 0.9, y: bandY + 0.62, w: 1.8, h: 0.28, fontFace: FONT_B, fontSize: 10, color: C.steel, align: "center", margin: 0 });
    s.addText(fmt$(hi), { x: pos(hi) - 0.9, y: bandY + 0.62, w: 1.8, h: 0.28, fontFace: FONT_B, fontSize: 10, color: C.steel, align: "center", margin: 0 });

    // Verdict bar
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 5.6, w: 11.6, h: 1.15, fill: { color: C.marine }, line: { color: C.marine }, rectRadius: 0.08, shadow: sh() });
    s.addText(V.vs_list_verdict.toUpperCase(), { x: 1.15, y: 5.78, w: 11, h: 0.4, fontFace: FONT_H, fontSize: 19, color: C.coral, bold: true, margin: 0 });
    s.addText(V.vs_list_detail, { x: 1.15, y: 6.2, w: 11, h: 0.4, fontFace: FONT_B, fontSize: 13, color: "D7E2EA", margin: 0 });
    footerDisclaimer(s);
  }

  // ================= SLIDE 3 — SUBJECT PROFILE =================
  {
    const s = pres.addSlide();
    const P = D.subject_profile;
    header(s, pres, "SUBJECT PROPERTY", "Public Record vs. What the Records Can't See",
      P.walked ? "Condition inputs from an in-person walkthrough." : "Condition inputs from photos and listing only — confidence adjusted accordingly.", C.teal);

    const colY = 2.15, rowH = 0.56;
    // Left: public facts
    s.addText("PUBLIC RECORD", { x: 0.85, y: colY, w: 5.7, h: 0.32, fontFace: FONT_B, fontSize: 12, color: C.teal, bold: true, charSpacing: 3, margin: 0 });
    (P.public_facts || []).slice(0, 8).forEach((f, i) => {
      const y = colY + 0.42 + i * rowH;
      s.addShape(pres.shapes.LINE, { x: 0.85, y: y + rowH - 0.08, w: 5.7, h: 0, line: { color: C.hairline, width: 0.5 } });
      s.addText(f.label, { x: 0.85, y, w: 2.4, h: rowH - 0.1, fontFace: FONT_B, fontSize: 11.5, color: C.steel, valign: "middle", margin: 0 });
      s.addText(String(f.value), { x: 3.3, y, w: 3.25, h: rowH - 0.1, fontFace: FONT_B, fontSize: 11.5, color: C.ink, bold: true, valign: "middle", margin: 0 });
    });
    // Right: interview inputs
    s.addText("FROM THE BUYER INTERVIEW", { x: 6.95, y: colY, w: 5.7, h: 0.32, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 3, margin: 0 });
    (P.interview_inputs || []).slice(0, 8).forEach((f, i) => {
      const y = colY + 0.42 + i * rowH;
      const ic = impactColor(f.impact);
      s.addShape(pres.shapes.RECTANGLE, { x: 6.95, y: y + 0.06, w: 0.05, h: rowH - 0.22, fill: { color: ic }, line: { color: ic } });
      s.addShape(pres.shapes.LINE, { x: 6.95, y: y + rowH - 0.08, w: 5.75, h: 0, line: { color: C.hairline, width: 0.5 } });
      s.addText(f.label, { x: 7.12, y, w: 1.9, h: rowH - 0.1, fontFace: FONT_B, fontSize: 11.5, color: C.steel, valign: "middle", margin: 0 });
      s.addText(String(f.value), { x: 9.05, y, w: 3.65, h: rowH - 0.1, fontFace: FONT_B, fontSize: 11, color: C.ink, valign: "middle", margin: 0 });
    });
    footerDisclaimer(s);
  }

  // ================= SLIDE 4 — COMPARABLE SALES GRID =================
  {
    const s = pres.addSlide();
    header(s, pres, "COMPARABLE SALES", "The Comps, Adjusted to the Subject",
      "Each comp is adjusted toward the subject; superior features subtract, inferior features add. Tier 1 = MLS/record-grade sold price.", C.coral);

    const comps = (D.comps || []).slice(0, 5);
    const rows = [];
    const hdr = ["Comp", "Sold", "Sold Price", "SqFt", "$/SF", "Net Adj", "Adj. Value", "Wt", "Tier"];
    rows.push(hdr.map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.marine }, fontFace: FONT_B, fontSize: 10.5, align: "center", valign: "middle" } })));
    comps.forEach((c, i) => {
      const fill = i % 2 === 0 ? C.white : "F4F7F9";
      const base = { fontFace: FONT_B, fontSize: 10.5, color: C.ink, fill: { color: fill }, valign: "middle" };
      rows.push([
        { text: c.address + "\n" + (c.key_diffs || ""), options: { ...base, fontSize: 9.5, align: "left" } },
        { text: c.sold_date, options: { ...base, align: "center" } },
        { text: fmt$(c.sold_price), options: { ...base, bold: true, align: "right" } },
        { text: (c.sqft || 0).toLocaleString(), options: { ...base, align: "right" } },
        { text: "$" + c.ppsf, options: { ...base, align: "right" } },
        { text: fmtAdj(c.net_adjustment), options: { ...base, align: "right", color: (c.net_adjustment || 0) >= 0 ? C.green : C.crimson, bold: true } },
        { text: fmt$(c.adjusted_value), options: { ...base, bold: true, align: "right", color: C.marine } },
        { text: (c.weight * 100).toFixed(0) + "%", options: { ...base, align: "center" } },
        { text: "T" + c.source_tier, options: { ...base, align: "center", bold: true, color: c.source_tier === 1 ? C.green : C.amber } }
      ]);
    });
    s.addTable(rows, {
      x: 0.6, y: 2.15, w: 12.13,
      colW: [3.6, 0.95, 1.35, 0.9, 0.85, 1.35, 1.55, 0.68, 0.9],
      border: { type: "solid", pt: 0.5, color: C.hairline },
      rowH: [0.42, ...comps.map(() => 0.72)],
      margin: 0.06
    });

    // Weighted value callout
    const tblBottom = 2.15 + 0.42 + comps.length * 0.72;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: tblBottom + 0.22, w: 12.13, h: 0.62, fill: { color: "F0F5F8" }, line: { color: C.teal, width: 1 }, rectRadius: 0.06 });
    s.addText([
      { text: "Weighted indicated value (before subject condition adjustments):  ", options: { fontFace: FONT_B, fontSize: 13, color: C.graphite } },
      { text: fmt$(D.reconciliation.base_indicated_value), options: { fontFace: FONT_H, fontSize: 16, color: C.marine, bold: true } }
    ], { x: 0.9, y: tblBottom + 0.22, w: 11.6, h: 0.62, valign: "middle", margin: 0 });
    // Sources line
    s.addText("Sources: " + comps.map((c, i) => `[${i + 1}] ${c.source}`).join("  ·  "), { x: 0.6, y: tblBottom + 0.98, w: 12.13, h: 0.5, fontFace: FONT_B, fontSize: 8.5, color: C.steel, italic: true, margin: 0 });
    footerDisclaimer(s);
  }

  // ================= SLIDE 5 — ADJUSTMENT SCHEDULE =================
  {
    const s = pres.addSlide();
    header(s, pres, "ADJUSTMENT SCHEDULE", "The Rates Behind the Comp Grid",
      "Percent-of-value rates per the sales comparison method. Local paired-sales evidence overrides defaults where found.", C.teal);
    const rows = [];
    const hdr = ["Adjustment", "Rate Applied", "Basis", "Applied To"];
    rows.push(hdr.map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.marine }, fontFace: FONT_B, fontSize: 11, align: "left", valign: "middle" } })));
    (D.adjustment_schedule || []).slice(0, 8).forEach((a, i) => {
      const fill = i % 2 === 0 ? C.white : "F4F7F9";
      const base = { fontFace: FONT_B, fontSize: 10.5, color: C.ink, fill: { color: fill }, valign: "middle", align: "left" };
      rows.push([
        { text: a.item, options: { ...base, bold: true, color: C.marine } },
        { text: a.rate, options: { ...base, bold: true, color: C.teal } },
        { text: a.basis, options: { ...base, fontSize: 10 } },
        { text: a.applied_to, options: { ...base, fontSize: 10 } }
      ]);
    });
    const n = Math.min((D.adjustment_schedule || []).length, 8);
    s.addTable(rows, {
      x: 0.6, y: 2.15, w: 12.13,
      colW: [2.3, 2.0, 5.03, 2.8],
      border: { type: "solid", pt: 0.5, color: C.hairline },
      rowH: [0.42, ...Array(n).fill(0.55)],
      margin: 0.07
    });
    footerDisclaimer(s);
  }

  // ================= SLIDE 6 — CONDITION ADJUSTMENTS =================
  {
    const s = pres.addSlide();
    header(s, pres, "CONDITION ADJUSTMENTS", "What the Interview Changed",
      "Applied once to the weighted comp value. Tags: verified · assumed (neutral default) · reported-unverified (half weight).", C.coral);
    const items = (D.condition_adjustments || []).slice(0, 8);
    const startY = 2.15, rowH2 = Math.min(0.62, 4.0 / Math.max(items.length, 1));
    items.forEach((c, i) => {
      const y = startY + i * rowH2;
      const tc = tagColor(c.tag);
      s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: y + 0.06, w: 0.05, h: rowH2 - 0.18, fill: { color: tc }, line: { color: tc } });
      s.addShape(pres.shapes.LINE, { x: 0.85, y: y + rowH2 - 0.05, w: 11.6, h: 0, line: { color: C.hairline, width: 0.5 } });
      s.addText(c.item, { x: 1.05, y, w: 2.7, h: rowH2 - 0.1, fontFace: FONT_B, fontSize: 12, color: C.marine, bold: true, valign: "middle", margin: 0 });
      s.addText(c.finding + (c.note ? " — " + c.note : ""), { x: 3.85, y, w: 6.1, h: rowH2 - 0.1, fontFace: FONT_B, fontSize: 10.5, color: C.graphite, valign: "middle", margin: 0 });
      s.addText(c.tag, { x: 10.0, y, w: 1.1, h: rowH2 - 0.1, fontFace: FONT_B, fontSize: 8.5, color: tc, italic: true, valign: "middle", margin: 0 });
      s.addText(fmtAdj(c.amount), { x: 11.15, y, w: 1.3, h: rowH2 - 0.1, fontFace: FONT_B, fontSize: 12.5, color: (c.amount || 0) >= 0 ? C.green : C.crimson, bold: true, align: "right", valign: "middle", margin: 0 });
    });
    // Total bar
    const totY = startY + items.length * rowH2 + 0.25;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: totY, w: 11.6, h: 0.85, fill: { color: C.marine }, line: { color: C.marine }, rectRadius: 0.06, shadow: sh() });
    s.addText("NET CONDITION ADJUSTMENT", { x: 1.15, y: totY, w: 6, h: 0.85, fontFace: FONT_B, fontSize: 13, color: "AFC3D4", bold: true, charSpacing: 2, valign: "middle", margin: 0 });
    s.addText(fmtAdj(D.condition_total), { x: 8.0, y: totY, w: 4.15, h: 0.85, fontFace: FONT_H, fontSize: 24, color: (D.condition_total || 0) >= 0 ? "6FCF97" : "F2994A", bold: true, align: "right", valign: "middle", margin: 0 });
    footerDisclaimer(s);
  }

  // ================= SLIDE 7 — RECONCILIATION =================
  {
    const s = pres.addSlide();
    const R = D.reconciliation;
    header(s, pres, "RECONCILIATION", "How the Number Holds Up", null, C.teal);

    // Value walk (left)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 2.0, w: 5.6, h: 2.35, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, rectRadius: 0.06, shadow: sh() });
    s.addText("VALUE WALK", { x: 1.1, y: 2.15, w: 5, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.teal, bold: true, charSpacing: 3, margin: 0 });
    const walk = [
      ["Weighted comp value", fmt$(R.base_indicated_value), C.ink],
      ["Condition adjustments", fmtAdj(D.condition_total), (D.condition_total || 0) >= 0 ? C.green : C.crimson],
      ["Indicated point value", fmt$(D.value_conclusion.point_value), C.marine]
    ];
    walk.forEach((wk, i) => {
      const y = 2.55 + i * 0.55;
      if (i === 2) s.addShape(pres.shapes.LINE, { x: 1.1, y: y - 0.05, w: 5.1, h: 0, line: { color: C.marine, width: 1 } });
      s.addText(wk[0], { x: 1.1, y, w: 3.3, h: 0.45, fontFace: FONT_B, fontSize: 12, color: C.graphite, bold: i === 2, valign: "middle", margin: 0 });
      s.addText(wk[1], { x: 4.4, y, w: 1.85, h: 0.45, fontFace: i === 2 ? FONT_H : FONT_B, fontSize: i === 2 ? 16 : 13, color: wk[2], bold: true, align: "right", valign: "middle", margin: 0 });
    });

    // AVM cross-check (right)
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.85, y: 2.0, w: 5.6, h: 2.35, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, rectRadius: 0.06, shadow: sh() });
    s.addText("AVM CROSS-CHECK (context only, never comps)", { x: 7.1, y: 2.15, w: 5.2, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.teal, bold: true, charSpacing: 2, margin: 0 });
    (R.avm_checks || []).slice(0, 3).forEach((a, i) => {
      const y = 2.55 + i * 0.5;
      s.addText(a.source, { x: 7.1, y, w: 3.2, h: 0.42, fontFace: FONT_B, fontSize: 12, color: C.graphite, valign: "middle", margin: 0 });
      s.addText(fmt$(a.value), { x: 10.3, y, w: 1.95, h: 0.42, fontFace: FONT_B, fontSize: 13, color: C.ink, bold: true, align: "right", valign: "middle", margin: 0 });
    });

    // Narrative
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 4.55, w: 11.6, h: 1.0, fill: { color: "F0F5F8" }, line: { color: C.teal, width: 0.75 }, rectRadius: 0.06 });
    s.addText(R.narrative, { x: 1.1, y: 4.62, w: 11.1, h: 0.88, fontFace: FONT_B, fontSize: 11, color: C.graphite, valign: "middle", margin: 0 });

    // Sensitivity cards
    const sens = R.sensitivity || {};
    const cards = [
      ["LOW CASE", fmt$(sens.low_case), sens.low_note, C.crimson],
      ["HIGH CASE", fmt$(sens.high_case), sens.high_note, C.green]
    ];
    cards.forEach((cd, i) => {
      const x = 0.85 + i * 5.95;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 5.75, w: 5.65, h: 1.15, fill: { color: C.white }, line: { color: cd[3], width: 1.25 }, rectRadius: 0.06, shadow: sh() });
      s.addText(cd[0], { x: x + 0.22, y: 5.87, w: 2.4, h: 0.3, fontFace: FONT_B, fontSize: 10.5, color: cd[3], bold: true, charSpacing: 3, margin: 0 });
      s.addText(cd[1], { x: x + 0.22, y: 6.14, w: 2.4, h: 0.5, fontFace: FONT_H, fontSize: 20, color: C.marine, bold: true, margin: 0 });
      s.addText(cd[2] || "", { x: x + 2.7, y: 5.87, w: 2.75, h: 0.92, fontFace: FONT_B, fontSize: 9.5, color: C.graphite, valign: "middle", margin: 0 });
    });
    footerDisclaimer(s);
  }

  // ================= SLIDE 8 — VALUE VS LIST =================
  {
    const s = pres.addSlide();
    const V = D.value_vs_price;
    header(s, pres, "VALUE VS. LIST PRICE", V.verdict_headline,
      `List ${fmt$(V.list_price)} vs. indicated value ${fmt$(V.point_value)} — a ${fmtAdj(V.delta)} (${V.delta_pct > 0 ? "+" : ""}${V.delta_pct}%) gap.`, C.coral);

    (V.anchor_points || []).slice(0, 3).forEach((a, i) => {
      const x = 0.85 + i * 4.0;
      const colors = [C.green, C.teal, C.crimson];
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.35, w: 3.7, h: 2.5, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, rectRadius: 0.08, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: 2.35, w: 3.7, h: 0.12, fill: { color: colors[i] }, line: { color: colors[i] } });
      s.addText(a.label.toUpperCase(), { x: x + 0.25, y: 2.65, w: 3.2, h: 0.35, fontFace: FONT_B, fontSize: 12, color: colors[i], bold: true, charSpacing: 2, margin: 0 });
      s.addText(fmt$(a.value), { x: x + 0.25, y: 3.05, w: 3.2, h: 0.75, fontFace: FONT_H, fontSize: 30, color: C.marine, bold: true, margin: 0 });
      s.addText(a.note, { x: x + 0.25, y: 3.85, w: 3.2, h: 0.85, fontFace: FONT_B, fontSize: 11, color: C.graphite, margin: 0 });
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 5.35, w: 11.6, h: 1.35, fill: { color: C.marine }, line: { color: C.marine }, rectRadius: 0.08, shadow: sh() });
    s.addText("BOTTOM LINE", { x: 1.15, y: 5.52, w: 10.9, h: 0.32, fontFace: FONT_B, fontSize: 11, color: C.coral, bold: true, charSpacing: 4, margin: 0 });
    s.addText(V.bottom_line, { x: 1.15, y: 5.85, w: 10.9, h: 0.75, fontFace: FONT_B, fontSize: 14, color: C.white, valign: "top", margin: 0 });
    footerDisclaimer(s);
  }

  // ================= SLIDE 9 — SOURCES & CAVEATS (dark) =================
  {
    const s = pres.addSlide();
    s.background = { color: C.marine };
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.5, w: 0.08, h: 0.9, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("SOURCES, CONFIDENCE & CAVEATS", { x: 0.85, y: 0.5, w: 10, h: 0.35, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 5, margin: 0 });
    s.addText("Where Every Number Came From", { x: 0.85, y: 0.85, w: 12, h: 0.6, fontFace: FONT_H, fontSize: 26, color: C.white, bold: true, margin: 0 });

    (D.sources || []).slice(0, 8).forEach((src, i) => {
      const y = 1.85 + i * 0.5;
      s.addText(src.category, { x: 0.85, y, w: 2.9, h: 0.42, fontFace: FONT_B, fontSize: 11.5, color: C.coral, bold: true, valign: "middle", margin: 0 });
      s.addText(src.detail, { x: 3.85, y, w: 8.7, h: 0.42, fontFace: FONT_B, fontSize: 11, color: "D7E2EA", valign: "middle", margin: 0 });
      s.addShape(pres.shapes.LINE, { x: 0.85, y: y + 0.44, w: 11.7, h: 0, line: { color: C.panel, width: 0.75 } });
    });

    const capY = 1.85 + Math.min((D.sources || []).length, 8) * 0.5 + 0.25;
    s.addText("CAVEATS", { x: 0.85, y: capY, w: 4, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.amber, bold: true, charSpacing: 4, margin: 0 });
    s.addText((D.caveats || []).map(c => "•  " + c).join("\n"), { x: 0.85, y: capY + 0.32, w: 11.7, h: 7.0 - capY - 0.45, fontFace: FONT_B, fontSize: 10.5, color: "AFC3D4", margin: 0, lineSpacing: 16 });
    footerDisclaimer(s, true);
  }

  await pres.writeFile({ fileName: outputPath });
  console.log("Wrote " + outputPath);
})().catch(e => { console.error(e); process.exit(1); });
