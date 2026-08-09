#!/usr/bin/env node
/**
 * Property Insurance Brief — Coverage Decision Deck Builder
 *
 * Usage: node build_deck.js <insurance_data.json> <output.pptx>
 *
 * 11 slides. Forked from property-appraisal build_deck.js.
 * Shares the locked design system with property-intel-report and property-appraisal.
 * The one-page spec sheet PDF is built separately by build_spec_sheet.py from the same JSON.
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
  console.error("Usage: node build_deck.js <insurance_data.json> [output.pptx]");
  process.exit(1);
}
const D = JSON.parse(fs.readFileSync(inputPath, "utf8"));

// ===== DATA VALIDATION (layout contracts from data_schema.md; warnings, non-fatal) =====
(function validate() {
  const warn = m => console.warn("WARN: " + m);
  if ((D.primer?.cards || []).length !== 4) warn("primer.cards must be exactly 4 (2x2 grid)");
  if ((D.coverage_spec?.stats || []).length !== 6) warn("coverage_spec.stats must be exactly 6 (3x2 grid)");
  // Wind deductible: percentage deductibles are a coastal/named-storm construct.
  // profile "inland" skips the slide entirely rather than faking a percentage.
  const profile = D.market_profile || "coastal";
  const opts = D.wind_deductible?.options || [];
  if (profile === "coastal") {
    if (opts.length !== 3) warn("wind_deductible.options must be exactly 3 on a coastal profile");
    // chosen: true = the buyer selected it. chosen: "default" = nobody chose; we are showing
    // the neutral default because the interview was skipped or answered "I don't know".
    const picked = opts.filter(o => o.chosen === true).length;
    const defaulted = opts.filter(o => o.chosen === "default").length;
    if (picked + defaulted !== 1)
      warn(`exactly one wind_deductible option must carry chosen:true (buyer selected) or chosen:"default" (unchosen); found ${picked} selected and ${defaulted} defaulted`);
    if (defaulted === 1 && !/not selected|unchosen|default/i.test(JSON.stringify(D.caveats || D.sources?.caveats || "")))
      warn('wind deductible is a default, but no caveat says so — the caveats slide must state "wind deductible not selected by buyer"');
  } else if (opts.length) {
    warn(`market_profile is "${profile}" but wind_deductible.options is populated; percentage wind deductibles are a coastal construct`);
  }
  const cl = (D.coverage_lines?.rows || []).length;
  if (cl < 7 || cl > 9) warn(`coverage_lines.rows is ${cl}, expected 7-9`);
  const lv = (D.levers?.items || []).length;
  if (lv > 6) warn(`levers.items is ${lv}, layout fits 6`);
  if (lv < 4) warn(`levers.items is ${lv}; expected 4-6. Fewer is honest only where a lever genuinely does not exist in this market (e.g. no state mitigation program) — say so on the slide`);
  const q = (D.agent_script?.questions || []).length;
  if (q < 6 || q > 8) warn(`agent_script.questions is ${q}, expected 6-8`);
  const rf = (D.agent_script?.red_flags || []).length;
  if (rf < 4 || rf > 6) warn(`agent_script.red_flags is ${rf}, expected 4-6`);
  (D.primer?.cards || []).forEach(c => { if ((c.body || "").length > 200) warn("primer card body >200 chars: " + c.label); });
  (D.levers?.items || []).forEach(i => { if ((i.impact || "").length > 200) warn("lever impact >200 chars: " + i.lever); });
  const bl = D.premium_range?.basis_lines || [];
  bl.forEach((b, i) => { if (!b.label) warn(`premium_range.basis_lines[${i}] has empty label — every line names its source`); });
  // Floor of 1, not 3. Some states have no DOI comparison tool; one honest anchor beats
  // three padded ones. Fewer than 3 requires the caveats slide to say why.
  if (bl.length < 1) warn("premium_range needs at least one sourced basis line");
  if (bl.length > 5) warn(`premium_range.basis_lines is ${bl.length}, layout fits 5`);
  if (bl.length < 3 && !/anchor|comparison tool|no state|single source|limited/i.test(JSON.stringify(D.caveats || D.sources?.caveats || "")))
    warn(`only ${bl.length} basis line(s) — the caveats slide must say why the anchor set is thin`);
  const fl = (D.flood?.facts || []).length;
  if (fl < 3 || fl > 4) warn(`flood.facts is ${fl}, expected 3-4`);
  if (/<Month|<TODAY|<YYYY/.test(JSON.stringify(D))) warn("a date placeholder survived into the data file — generate it from the run date");
})();

// ===== LOCKED DESIGN SYSTEM (shared with property-intel-report / property-appraisal) =====
const C = {
  marine: "0A2540", teal: "1C7293", coral: "E36414", green: "2A9D8F",
  crimson: "B23A48", amber: "C9A227", white: "FFFFFF", ink: "1A1A1A",
  graphite: "3A4A5C", steel: "64748B", mist: "E5EBEF", hairline: "C9D2DA",
  panel: "0F3151"
};
const FONT_H = "Georgia";
const FONT_B = "Calibri";
const W = 13.333, H = 7.5;
const token = name => C[name] || C.steel; // named palette tokens from the JSON

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
function footerDisclaimer(s, dark = false) {
  s.addText("Educational decision support — not insurance advice. All premium figures are estimates; only a carrier can quote.", {
    x: 0.6, y: 7.12, w: 12.13, h: 0.3, fontFace: FONT_B, fontSize: 9,
    color: dark ? "7A93AB" : C.steel, italic: true, align: "center", margin: 0
  });
}
function sourceNote(s, text) {
  if (!text) return;
  s.addText(text, { x: 0.85, y: 6.78, w: 11.6, h: 0.3, fontFace: FONT_B, fontSize: 8.5, color: C.steel, italic: true, margin: 0 });
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Property Insurance Brief";
  pres.title = `${D.property.address} — Homeowners Insurance Brief`;

  const iconCache = {};
  async function getIcon(name, hex) {
    const key = name + "_" + hex;
    if (!iconCache[key]) iconCache[key] = await icon(name, hex);
    return iconCache[key];
  }

  // ================= SLIDE 1 — TITLE (dark) =================
  {
    const s = pres.addSlide();
    const T = D.title || {};
    s.background = { color: C.marine };
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.14, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText(T.eyebrow || "HOMEOWNERS INSURANCE BRIEF", { x: 0.9, y: 1.9, w: 11.5, h: 0.4, fontFace: FONT_B, fontSize: 15, color: C.coral, bold: true, charSpacing: 6, margin: 0 });
    s.addText(D.property.address, { x: 0.9, y: 2.4, w: 11.5, h: 1.1, fontFace: FONT_H, fontSize: 44, color: C.white, bold: true, margin: 0 });
    s.addText(`${D.property.city}, ${D.property.state} ${D.property.zip}`, { x: 0.9, y: 3.55, w: 11.5, h: 0.5, fontFace: FONT_B, fontSize: 20, color: "AFC3D4", margin: 0 });
    const facts = [
      "Built " + D.property.year_built,
      D.property.sqft + " sqft",
      D.property.construction,
      D.property.distance_to_coast
    ].filter(Boolean).join("   ·   ");
    s.addText(facts, { x: 0.9, y: 4.25, w: 11.5, h: 0.4, fontFace: FONT_B, fontSize: 14, color: "7A93AB", margin: 0 });
    s.addShape(pres.shapes.LINE, { x: 0.9, y: 5.0, w: 4.0, h: 0, line: { color: C.teal, width: 1.5 } });
    s.addText(T.tagline || "", { x: 0.9, y: 5.2, w: 10.5, h: 0.4, fontFace: FONT_B, fontSize: 13, color: "AFC3D4", italic: true, margin: 0 });
    if (T.status_tag) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.9, y: 5.8, w: 4.2, h: 0.42, fill: { color: C.coral }, line: { color: C.coral }, rectRadius: 0.21 });
      s.addText(T.status_tag, { x: 0.9, y: 5.8, w: 4.2, h: 0.42, fontFace: FONT_B, fontSize: 10.5, color: C.white, bold: true, charSpacing: 2, align: "center", valign: "middle", margin: 0 });
    }
    s.addText(T.prepared_label || "", { x: 0.9, y: 6.55, w: 6, h: 0.35, fontFace: FONT_B, fontSize: 12, color: "7A93AB", margin: 0 });
    footerDisclaimer(s, true);
  }

  // ================= SLIDE 2 — PRIMER (4 cards, 2x2) =================
  {
    const s = pres.addSlide();
    const P = D.primer;
    header(s, pres, "HOW COASTAL INSURANCE IS PRICED", P.title, P.subtitle, C.coral);
    const cards = (P.cards || []).slice(0, 4);
    const cw = 5.72, ch = 2.15, gx = 0.17, gy = 0.25, x0 = 0.85, y0 = 2.15;
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const x = x0 + (i % 2) * (cw + gx);
      const y = y0 + Math.floor(i / 2) * (ch + gy);
      const col = token(c.color);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, rectRadius: 0.08, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.09, h: ch, fill: { color: col }, line: { color: col } });
      s.addImage({ data: await getIcon(c.icon, token(c.color)), x: x + 0.3, y: y + 0.28, w: 0.42, h: 0.42 });
      s.addText(c.label, { x: x + 0.88, y: y + 0.28, w: cw - 1.1, h: 0.42, fontFace: FONT_B, fontSize: 13, color: col, bold: true, charSpacing: 2, valign: "middle", margin: 0 });
      s.addText(c.body, { x: x + 0.3, y: y + 0.85, w: cw - 0.6, h: ch - 1.05, fontFace: FONT_B, fontSize: 11.5, color: C.graphite, valign: "top", margin: 0 });
    }
    sourceNote(s, P.source_note);
    footerDisclaimer(s);
  }

  // ================= SLIDE 3 — COVERAGE SPEC (6 stat cards, 3x2) =================
  {
    const s = pres.addSlide();
    const CS = D.coverage_spec;
    header(s, pres, "YOUR COVERAGE SPEC", CS.title, CS.subtitle, C.teal);
    const stats = (CS.stats || []).slice(0, 6);
    const cw = 3.78, ch = 2.05, gx = 0.13, gy = 0.28, x0 = 0.85, y0 = 2.15;
    stats.forEach((st, i) => {
      const x = x0 + (i % 3) * (cw + gx);
      const y = y0 + Math.floor(i / 3) * (ch + gy);
      const col = token(st.color);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, rectRadius: 0.08, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cw, h: 0.11, fill: { color: col }, line: { color: col } });
      s.addText(st.big, { x: x + 0.25, y: y + 0.3, w: cw - 0.5, h: 0.75, fontFace: FONT_H, fontSize: 30, color: C.marine, bold: true, margin: 0 });
      s.addText(st.label, { x: x + 0.25, y: y + 1.1, w: cw - 0.5, h: 0.32, fontFace: FONT_B, fontSize: 11.5, color: col, bold: true, charSpacing: 2, margin: 0 });
      s.addText(st.sub || "", { x: x + 0.25, y: y + 1.44, w: cw - 0.5, h: 0.5, fontFace: FONT_B, fontSize: 10.5, color: C.steel, margin: 0 });
    });
    sourceNote(s, CS.source_note);
    footerDisclaimer(s);
  }

  // ================= SLIDE 4 — COVERAGE LINE BY LINE (table) =================
  {
    const s = pres.addSlide();
    const CL = D.coverage_lines;
    header(s, pres, "COVERAGE LINE BY LINE", CL.title, CL.subtitle, C.coral);
    const items = (CL.rows || []).slice(0, 9);
    const rows = [];
    const hdr = ["Coverage Line", "Your Chosen Level", "What It Does"];
    rows.push(hdr.map(t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.marine }, fontFace: FONT_B, fontSize: 11, align: "left", valign: "middle" } })));
    items.forEach((r, i) => {
      const fill = i % 2 === 0 ? C.white : "F4F7F9";
      const base = { fontFace: FONT_B, fontSize: 10.5, fill: { color: fill }, valign: "middle", align: "left" };
      rows.push([
        { text: r.line, options: { ...base, bold: true, color: C.marine } },
        { text: r.chosen, options: { ...base, bold: true, color: C.teal } },
        { text: r.what, options: { ...base, color: C.graphite, fontSize: 10 } }
      ]);
    });
    const rowH = Math.min(0.52, 4.55 / items.length);
    s.addTable(rows, {
      x: 0.6, y: 2.15, w: 12.13,
      colW: [2.6, 3.5, 6.03],
      border: { type: "solid", pt: 0.5, color: C.hairline },
      rowH: [0.4, ...Array(items.length).fill(rowH)],
      margin: 0.06
    });
    sourceNote(s, CL.source_note);
    footerDisclaimer(s);
  }

  // ================= SLIDE 5 — WIND DEDUCTIBLE MATH (3 option cards) =================
  {
    const s = pres.addSlide();
    const WD = D.wind_deductible;
    header(s, pres, "WIND DEDUCTIBLE MATH", WD.title, WD.subtitle, C.crimson);
    const opts = (WD.options || []).slice(0, 3);
    const cw = 3.78, ch = 2.45, gx = 0.13, x0 = 0.85, y0 = 2.15;
    opts.forEach((o, i) => {
      const x = x0 + i * (cw + gx);
      const col = token(o.color);
      const borderW = o.chosen ? 2.25 : 0.75;
      const borderC = o.chosen ? col : C.hairline;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y0, w: cw, h: ch, fill: { color: C.white }, line: { color: borderC, width: borderW }, rectRadius: 0.08, shadow: sh() });
      if (o.chosen) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + cw - 1.55, y: y0 + 0.2, w: 1.35, h: 0.38, fill: { color: col }, line: { color: col }, rectRadius: 0.19 });
        s.addText("YOUR PICK", { x: x + cw - 1.55, y: y0 + 0.2, w: 1.35, h: 0.38, fontFace: FONT_B, fontSize: 9.5, color: C.white, bold: true, charSpacing: 1, align: "center", valign: "middle", margin: 0 });
      }
      s.addText(o.pct, { x: x + 0.28, y: y0 + 0.18, w: 1.9, h: 0.65, fontFace: FONT_H, fontSize: 34, color: col, bold: true, margin: 0 });
      s.addText(o.dollars, { x: x + 0.28, y: y0 + 0.88, w: cw - 0.56, h: 0.62, fontFace: FONT_H, fontSize: 26, color: C.marine, bold: true, margin: 0 });
      s.addText("OUT OF POCKET AT CLAIM", { x: x + 0.28, y: y0 + 1.48, w: cw - 0.56, h: 0.26, fontFace: FONT_B, fontSize: 8.5, color: C.steel, charSpacing: 2, margin: 0 });
      s.addText(o.note || "", { x: x + 0.28, y: y0 + 1.76, w: cw - 0.56, h: 0.62, fontFace: FONT_B, fontSize: 10, color: C.graphite, valign: "top", margin: 0 });
    });
    // Framing band
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 4.85, w: 11.6, h: 1.0, fill: { color: C.marine }, line: { color: C.marine }, rectRadius: 0.08, shadow: sh() });
    s.addText("THE REAL QUESTION", { x: 1.15, y: 4.97, w: 10.9, h: 0.28, fontFace: FONT_B, fontSize: 10.5, color: C.coral, bold: true, charSpacing: 3, margin: 0 });
    s.addText(WD.framing || "", { x: 1.15, y: 5.25, w: 10.9, h: 0.55, fontFace: FONT_B, fontSize: 12.5, color: C.white, valign: "top", margin: 0 });
    // Detail note
    if (WD.detail_note) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 6.0, w: 11.6, h: 0.62, fill: { color: "F0F5F8" }, line: { color: C.teal, width: 0.75 }, rectRadius: 0.06 });
      s.addText(WD.detail_note, { x: 1.1, y: 6.03, w: 11.1, h: 0.56, fontFace: FONT_B, fontSize: 10.5, color: C.graphite, valign: "middle", margin: 0 });
    }
    sourceNote(s, WD.source_note);
    footerDisclaimer(s);
  }

  // ================= SLIDE 6 — FLOOD (stat cards + body + recommendation) =================
  {
    const s = pres.addSlide();
    const F = D.flood;
    header(s, pres, "FLOOD: THE SEPARATE POLICY", F.title, F.subtitle, C.teal);
    const facts = (F.facts || []).slice(0, 4);
    const n = facts.length;
    const gx = 0.15;
    const cw = (11.6 - gx * (n - 1)) / n, ch = 1.85, x0 = 0.85, y0 = 2.15;
    facts.forEach((f, i) => {
      const x = x0 + i * (cw + gx);
      const col = token(f.color);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y0, w: cw, h: ch, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, rectRadius: 0.08, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: y0, w: cw, h: 0.11, fill: { color: col }, line: { color: col } });
      s.addText(f.big, { x: x + 0.22, y: y0 + 0.26, w: cw - 0.44, h: 0.62, fontFace: FONT_H, fontSize: 23, color: C.marine, bold: true, margin: 0 });
      s.addText(f.label, { x: x + 0.22, y: y0 + 0.92, w: cw - 0.44, h: 0.3, fontFace: FONT_B, fontSize: 10.5, color: col, bold: true, charSpacing: 1, margin: 0 });
      s.addText(f.sub || "", { x: x + 0.22, y: y0 + 1.24, w: cw - 0.44, h: 0.52, fontFace: FONT_B, fontSize: 9.5, color: C.steel, margin: 0 });
    });
    // Body
    s.addText(F.body || "", { x: 0.85, y: 4.35, w: 11.6, h: 0.95, fontFace: FONT_B, fontSize: 12.5, color: C.graphite, valign: "top", margin: 0 });
    // Recommendation band
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 5.45, w: 11.6, h: 1.05, fill: { color: C.marine }, line: { color: C.marine }, rectRadius: 0.08, shadow: sh() });
    s.addText("RECOMMENDATION", { x: 1.15, y: 5.58, w: 10.9, h: 0.28, fontFace: FONT_B, fontSize: 10.5, color: C.coral, bold: true, charSpacing: 3, margin: 0 });
    s.addText(F.recommendation || "", { x: 1.15, y: 5.87, w: 10.9, h: 0.55, fontFace: FONT_B, fontSize: 12.5, color: C.white, valign: "top", margin: 0 });
    sourceNote(s, F.source_note);
    footerDisclaimer(s);
  }

  // ================= SLIDE 7 — PRICE LEVERS RANKED =================
  {
    const s = pres.addSlide();
    const L = D.levers;
    header(s, pres, "PRICE LEVERS RANKED", L.title, L.subtitle, C.coral);
    const items = (L.items || []).slice(0, 6);
    const startY = 2.15, rowH = Math.min(0.78, 4.5 / Math.max(items.length, 1));
    items.forEach((it, i) => {
      const y = startY + i * rowH;
      const col = token(it.color);
      // Rank chip
      s.addShape(pres.shapes.OVAL, { x: 0.85, y: y + (rowH - 0.5) / 2, w: 0.5, h: 0.5, fill: { color: col }, line: { color: col } });
      s.addText(it.rank, { x: 0.85, y: y + (rowH - 0.5) / 2, w: 0.5, h: 0.5, fontFace: FONT_H, fontSize: 16, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
      s.addShape(pres.shapes.LINE, { x: 0.85, y: y + rowH - 0.05, w: 11.6, h: 0, line: { color: C.hairline, width: 0.5 } });
      s.addText(it.lever, { x: 1.55, y: y + 0.04, w: 2.9, h: rowH - 0.12, fontFace: FONT_B, fontSize: 12.5, color: C.marine, bold: true, valign: "middle", margin: 0 });
      s.addText(it.status || "", { x: 4.55, y: y + 0.04, w: 3.15, h: rowH - 0.12, fontFace: FONT_B, fontSize: 10.5, color: C.graphite, italic: true, valign: "middle", margin: 0 });
      s.addText(it.impact || "", { x: 7.85, y: y + 0.04, w: 4.6, h: rowH - 0.12, fontFace: FONT_B, fontSize: 10, color: C.graphite, valign: "middle", margin: 0 });
    });
    sourceNote(s, L.source_note);
    footerDisclaimer(s);
  }

  // ================= SLIDE 8 — ESTIMATED PREMIUM RANGE =================
  {
    const s = pres.addSlide();
    const PR = D.premium_range;
    header(s, pres, "ESTIMATED PREMIUM RANGE", PR.title, PR.subtitle, C.amber);
    // Range hero
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: 2.1, w: 11.6, h: 1.55, fill: { color: C.marine }, line: { color: C.marine }, rectRadius: 0.08, shadow: sh() });
    s.addText(`${PR.range_low}  –  ${PR.range_high}`, { x: 1.15, y: 2.28, w: 8.5, h: 0.85, fontFace: FONT_H, fontSize: 44, color: C.white, bold: true, margin: 0 });
    s.addText(PR.range_label || "", { x: 1.15, y: 3.15, w: 11, h: 0.35, fontFace: FONT_B, fontSize: 11.5, color: C.amber, bold: true, charSpacing: 2, margin: 0 });
    // Basis lines
    s.addText("WHERE THE RANGE COMES FROM", { x: 0.85, y: 3.95, w: 6, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.teal, bold: true, charSpacing: 3, margin: 0 });
    const basis = (PR.basis_lines || []).slice(0, 5);
    const capY = 6.05; // fixed: keeps the caveat band clear of the source note and footer
    const basisRowH = Math.min(0.44, (capY - 0.15 - 4.32) / Math.max(basis.length, 1));
    basis.forEach((b, i) => {
      const y = 4.32 + i * basisRowH;
      s.addShape(pres.shapes.LINE, { x: 0.85, y: y + basisRowH - 0.06, w: 11.6, h: 0, line: { color: C.hairline, width: 0.5 } });
      s.addText(b.label, { x: 0.85, y, w: 8.3, h: basisRowH - 0.06, fontFace: FONT_B, fontSize: 11, color: C.graphite, valign: "middle", margin: 0 });
      s.addText(b.value || "", { x: 9.25, y, w: 3.2, h: basisRowH - 0.06, fontFace: FONT_B, fontSize: 11, color: C.marine, bold: true, align: "right", valign: "middle", margin: 0 });
    });
    // Caveat band
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.85, y: capY, w: 11.6, h: 0.6, fill: { color: "FBF6E9" }, line: { color: C.amber, width: 0.75 }, rectRadius: 0.06 });
    s.addText(PR.caveat || "", { x: 1.1, y: capY + 0.02, w: 11.1, h: 0.56, fontFace: FONT_B, fontSize: 10.5, color: C.graphite, italic: true, valign: "middle", margin: 0 });
    sourceNote(s, PR.source_note);
    footerDisclaimer(s);
  }

  // ================= SLIDE 9 — SPEC SHEET PREVIEW =================
  {
    const s = pres.addSlide();
    const SS = D.spec_sheet;
    header(s, pres, "QUOTE SPEC SHEET", SS.headline, SS.instruction, C.teal);
    // Left: property + coverage summary (compact)
    const leftX = 0.85, leftW = 5.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: leftX, y: 2.15, w: leftW, h: 4.45, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, rectRadius: 0.06, shadow: sh() });
    s.addText("THE SPEC EVERY AGENT QUOTES", { x: leftX + 0.22, y: 2.3, w: leftW - 0.44, h: 0.3, fontFace: FONT_B, fontSize: 10.5, color: C.teal, bold: true, charSpacing: 2, margin: 0 });
    const specRows = [...(SS.property_block || []).slice(0, 4), ...(SS.coverage_block || []).slice(0, 6)];
    specRows.forEach((r, i) => {
      const y = 2.68 + i * 0.385;
      s.addShape(pres.shapes.LINE, { x: leftX + 0.22, y: y + 0.33, w: leftW - 0.44, h: 0, line: { color: C.hairline, width: 0.5 } });
      s.addText(r.label, { x: leftX + 0.22, y, w: 1.85, h: 0.33, fontFace: FONT_B, fontSize: 9, color: C.steel, valign: "middle", margin: 0 });
      s.addText(r.value, { x: leftX + 2.1, y, w: leftW - 2.32, h: 0.33, fontFace: FONT_B, fontSize: 9, color: C.ink, bold: true, valign: "middle", margin: 0 });
    });
    // Right: quote comparison grid preview
    const rightX = 6.6, rightW = 5.85;
    const qc = SS.quote_columns || {};
    const qRows = (qc.rows || []).slice(0, 9);
    const rows = [];
    rows.push([
      { text: "", options: { fill: { color: C.marine } } },
      ...(qc.column_headers || []).map(h => ({ text: h, options: { bold: true, color: C.white, fill: { color: C.marine }, fontFace: FONT_B, fontSize: 9.5, align: "center", valign: "middle" } }))
    ]);
    qRows.forEach((r, i) => {
      const fill = i % 2 === 0 ? C.white : "F4F7F9";
      rows.push([
        { text: r, options: { fontFace: FONT_B, fontSize: 8.5, color: C.marine, bold: true, fill: { color: fill }, valign: "middle", align: "left" } },
        ...(qc.column_headers || []).map(() => ({ text: "", options: { fill: { color: fill } } }))
      ]);
    });
    const qRowH = Math.min(0.5, 4.15 / qRows.length);
    s.addTable(rows, {
      x: rightX, y: 2.15, w: rightW,
      colW: [2.35, ...(qc.column_headers || []).map(() => (rightW - 2.35) / (qc.column_headers || []).length)],
      border: { type: "solid", pt: 0.5, color: C.hairline },
      rowH: [0.38, ...qRows.map(() => qRowH)],
      margin: 0.05
    });
    // Handoff note (positioned below the table, never overlapping)
    const noteY = 2.15 + 0.38 + qRows.length * qRowH + 0.12;
    s.addText("Printable one-page version ships with this deck as spec_sheet.pdf.", { x: rightX, y: noteY, w: rightW, h: 0.3, fontFace: FONT_B, fontSize: 10, color: C.graphite, italic: true, valign: "middle", margin: 0 });
    footerDisclaimer(s);
  }

  // ================= SLIDE 10 — AGENT SCRIPT & RED FLAGS (dark) =================
  {
    const s = pres.addSlide();
    const A = D.agent_script;
    s.background = { color: C.marine };
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.5, w: 0.08, h: 0.9, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("AGENT SCRIPT & QUOTE RED FLAGS", { x: 0.85, y: 0.5, w: 10, h: 0.35, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 5, margin: 0 });
    s.addText(A.title, { x: 0.85, y: 0.85, w: 12, h: 0.6, fontFace: FONT_H, fontSize: 26, color: C.white, bold: true, margin: 0 });
    s.addText(A.subtitle || "", { x: 0.85, y: 1.45, w: 11.5, h: 0.35, fontFace: FONT_B, fontSize: 12.5, color: "AFC3D4", italic: true, margin: 0 });

    // Left: questions
    s.addText("ASK EVERY AGENT", { x: 0.85, y: 2.05, w: 6, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.teal, bold: true, charSpacing: 3, margin: 0 });
    const qs = (A.questions || []).slice(0, 8);
    const qH = Math.min(0.56, 4.3 / qs.length);
    qs.forEach((q, i) => {
      const y = 2.42 + i * qH;
      s.addText(String(i + 1), { x: 0.85, y, w: 0.35, h: qH - 0.06, fontFace: FONT_H, fontSize: 13, color: C.coral, bold: true, valign: "top", margin: 0 });
      s.addText(q, { x: 1.25, y, w: 5.75, h: qH - 0.04, fontFace: FONT_B, fontSize: 10, color: "D7E2EA", valign: "top", margin: 0 });
    });

    // Right: red flags
    s.addText(A.red_flags_label || "RED FLAGS IN A QUOTE", { x: 7.45, y: 2.05, w: 5, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.crimson, bold: true, charSpacing: 3, margin: 0 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.45, y: 2.42, w: 5.0, h: 3.85, fill: { color: C.panel }, line: { color: C.crimson, width: 1 }, rectRadius: 0.08 });
    const flags = (A.red_flags || []).slice(0, 6);
    const fH = Math.min(0.72, 3.55 / flags.length);
    flags.forEach((f, i) => {
      const y = 2.6 + i * fH;
      s.addText("!", { x: 7.65, y, w: 0.3, h: fH - 0.08, fontFace: FONT_H, fontSize: 14, color: C.crimson, bold: true, valign: "top", margin: 0 });
      s.addText(f, { x: 8.0, y, w: 4.25, h: fH - 0.04, fontFace: FONT_B, fontSize: 9.5, color: "D7E2EA", valign: "top", margin: 0 });
    });

    // Footer punchline
    if (A.footer_note) {
      s.addShape(pres.shapes.LINE, { x: 0.85, y: 6.6, w: 11.6, h: 0, line: { color: C.panel, width: 0.75 } });
      s.addText(A.footer_note, { x: 0.85, y: 6.68, w: 11.6, h: 0.35, fontFace: FONT_H, fontSize: 13, color: C.coral, italic: true, align: "center", margin: 0 });
    }
    footerDisclaimer(s, true);
  }

  // ================= SLIDE 11 — SOURCES & CAVEATS (dark) =================
  {
    const s = pres.addSlide();
    const SRC = D.sources;
    s.background = { color: C.marine };
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.5, w: 0.08, h: 0.9, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("SOURCES & CAVEATS", { x: 0.85, y: 0.5, w: 10, h: 0.35, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 5, margin: 0 });
    s.addText(SRC.title || "Show Your Work", { x: 0.85, y: 0.85, w: 12, h: 0.6, fontFace: FONT_H, fontSize: 26, color: C.white, bold: true, margin: 0 });

    (SRC.list || []).slice(0, 8).forEach((src, i) => {
      const y = 1.8 + i * 0.48;
      s.addText("•", { x: 0.85, y, w: 0.3, h: 0.4, fontFace: FONT_B, fontSize: 12, color: C.coral, valign: "middle", margin: 0 });
      s.addText(src, { x: 1.2, y, w: 11.3, h: 0.4, fontFace: FONT_B, fontSize: 11.5, color: "D7E2EA", valign: "middle", margin: 0 });
      s.addShape(pres.shapes.LINE, { x: 0.85, y: y + 0.42, w: 11.7, h: 0, line: { color: C.panel, width: 0.75 } });
    });

    const capY = 1.8 + Math.min((SRC.list || []).length, 8) * 0.48 + 0.3;
    s.addText("CAVEATS", { x: 0.85, y: capY, w: 4, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.amber, bold: true, charSpacing: 4, margin: 0 });
    s.addText((SRC.caveats || []).map(c => "•  " + c).join("\n"), { x: 0.85, y: capY + 0.32, w: 11.7, h: Math.max(7.0 - capY - 0.45, 0.5), fontFace: FONT_B, fontSize: 10.5, color: "AFC3D4", margin: 0, lineSpacing: 17 });
    footerDisclaimer(s, true);
  }

  await pres.writeFile({ fileName: outputPath });
  console.log("Wrote " + outputPath);
})().catch(e => { console.error(e); process.exit(1); });
