#!/usr/bin/env node
/**
 * Property Intelligence Report — Deck Builder
 *
 * Usage: node build_deck.js <property_data.json> <output.pptx>
 *
 * Reads property_data.json (schema in references/data_schema.md) and
 * produces a 16-slide PowerPoint following the locked design system.
 */

const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const FA = require("react-icons/fa");

// ===== ARGS =====
const inputPath = process.argv[2];
const outputPath = process.argv[3] || "output.pptx";
if (!inputPath) {
  console.error("Usage: node build_deck.js <property_data.json> [output.pptx]");
  process.exit(1);
}
const D = JSON.parse(fs.readFileSync(inputPath, "utf8"));

// ===== DATA VALIDATION (warnings, non-fatal) =====
// Every check here corresponds to a defect that shipped in a previous worked example.
// Treat every WARN as a fix-before-delivery item.
(function validate() {
  let n = 0;
  const warn = m => { n++; console.warn("WARN: " + m); };
  // First $-prefixed number in a string, else the first bare number. Never concatenate stray digits.
  const money = v => {
    const s = String(v == null ? "" : v);
    const m = s.match(/\$\s*([\d,]+(?:\.\d+)?)/) || s.match(/(-?[\d,]+(?:\.\d+)?)/);
    return m ? Number(m[1].replace(/,/g, "")) : 0;
  };

  // 1. Comp average must reproduce from the comps shown.
  const entries = (D.comps?.entries || []).filter(e => !/subject/i.test(e.label || ""));
  const walk = D.comps?.fair_value_walk || [];
  if (entries.length) {
    const avg = entries.reduce((a, e) => a + (e.psf || 0), 0) / entries.length;
    const stated = money(walk.find(w => /average/i.test(w.label || ""))?.value);
    if (stated && Math.abs(stated - avg) > 1)
      warn(`comp average is stated as $${stated}/sqft but the ${entries.length} comps shown average $${avg.toFixed(1)}/sqft`);
    if (entries.length < 3) warn(`only ${entries.length} comps — state the count on the slide and widen the range`);
  }
  // 2. Strips compound, they do not sum.
  if (walk.length >= 4) {
    const avg = money(walk[0].value);
    const strips = walk.slice(1, -2).map(w => Math.abs(money(w.value)) / 100).filter(p => p > 0 && p < 1);
    const base = money(walk[walk.length - 2].value);
    const expect = strips.reduce((a, p) => a * (1 - p), avg);
    if (avg && base && Math.abs(expect - base) > 2)
      warn(`adjusted base ${base} does not equal ${avg} compounded through ${strips.map(p => `x${(1 - p).toFixed(2)}`).join(" ")} = ${expect.toFixed(1)} (are the strips being summed?)`);
  }
  // 3. Price cuts = points - 1.
  const pts = (D.price_history?.points || []).length;
  if (pts) {
    const co = (D.price_history?.callouts || []).find(c => /cut/i.test(c.label || ""));
    if (co && Number(co.big) !== pts - 1)
      warn(`price-cut callout says ${co.big} but ${pts} points is ${pts - 1} reductions`);
  }
  // 4. Cumulative 5-yr must equal sum of deltas x 12.
  const yrs = D.projection?.years || [];
  if (yrs.length === 5) {
    const tot = yrs.map(y => (y.pi || 0) + (y.tax || 0) + (y.ins || 0));
    const cum = tot.reduce((a, t) => a + (t - tot[0]), 0) * 12;
    const stated = money(D.projection?.cumulative_note);
    if (stated && Math.abs(stated - cum) > Math.max(150, cum * 0.02))
      warn(`cumulative 5-yr note says ~$${stated} but the year totals sum to $${cum}`);
    if (D.projection.year1_carry && D.projection.year1_carry !== tot[0])
      warn(`year1_carry ${D.projection.year1_carry} != year 1 components ${tot[0]}`);
    if (D.projection.year5_carry && D.projection.year5_carry !== tot[4])
      warn(`year5_carry ${D.projection.year5_carry} != year 5 components ${tot[4]}`);
  }
  // 5. Monthly carry totals must equal their components.
  (D.monthly_carry?.scenarios || []).forEach(s => {
    // "—" marks a line that doesn't apply; count it as 0, never concatenate it into the sum.
    const n = v => (typeof v === "number" ? v : 0);
    const sum = n(s.pi) + n(s.pmi) + n(s.tax) + n(s.ins) + n(s.wind) + n(s.flood);
    if (s.total && Math.abs(s.total - sum) > 2)
      warn(`carry scenario "${s.label}" total ${s.total} != components ${sum}`);
  });
  // 6. Layout ceilings — under is fine and honest, over breaks the slide.
  const cap = (path, arr, max) => { if ((arr || []).length > max) warn(`${path} has ${arr.length}, layout fits ${max}`); };
  cap("climate.risks", D.climate?.risks, 6);
  cap("red_flags.items", D.red_flags?.items, 6);
  cap("at_a_glance.stats", D.at_a_glance?.stats, 6);
  cap("schools.list", D.schools?.list, 3);
  cap("inventory.alternatives", D.inventory?.alternatives, 4);
  cap("comps.entries", D.comps?.entries, 7);
  cap("projection.years", D.projection?.years, 5);
  cap("action.phases", D.action?.phases, 4);
  cap("price_history.callouts", D.price_history?.callouts, 5);
  if ((D.monthly_carry?.scenarios || []).length !== 4) warn("monthly_carry.scenarios must be exactly 4 (10/20/25/cash)");
  // 7. A slide title must not hardcode a count the data may not produce.
  const numWord = /\b(three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i;
  [["red_flags", D.red_flags?.title], ["climate", D.climate?.title], ["schools", D.schools?.title]]
    .forEach(([k, t]) => { if (t && numWord.test(t)) warn(`${k}.title hardcodes a count ("${t}") — titles must not promise a number the data may not hit`); });
  // 8. PII and placeholder hygiene in the data file.
  const blob = JSON.stringify(D);
  if (/\b\d{3}-\d{3}-\d{4}\b/.test(blob)) warn("a phone number appears in the data file — remove personal contact details");
  if (/spokeo|beenverified|truepeoplesearch/i.test(blob)) warn("a people-search aggregator is cited — tier 3, and a privacy exposure");
  // Flags AVM-as-source phrasing ("sourced from ... AVMs"), not a disclaimer that none were used.
  if (/(sourced|derived|taken|pulled)\s+from[^.]{0,60}(AVM|Zestimate|Redfin Estimate)/i.test(D.comps?.source_note || ""))
    warn("comps.source_note sources comps from an AVM — AVMs are tier 3 and are never comps");

  if (n) console.warn(`WARN: ${n} validation issue(s). Fix before delivery.`);
})();

// ===== LOCKED DESIGN SYSTEM =====
const C = {
  marine: "0A2540",
  teal: "1C7293",
  coral: "E36414",
  green: "2A9D8F",
  crimson: "B23A48",
  amber: "C9A227",
  white: "FFFFFF",
  ink: "1A1A1A",
  graphite: "3A4A5C",
  steel: "64748B",
  mist: "E5EBEF",
  hairline: "C9D2DA",
  panel: "0F3151"
};
const FONT_H = "Georgia";
const FONT_B = "Calibri";
const W = 13.333;
const H = 7.5;

// Map color names to hex (for data file readability)
const colorMap = {
  marine: C.marine, teal: C.teal, coral: C.coral, green: C.green,
  crimson: C.crimson, amber: C.amber, steel: C.steel
};
const cx = name => colorMap[name] || name; // accept "coral" or raw hex

// ===== HELPERS =====
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}
async function icon(iconName, colorName) {
  const Component = FA[iconName];
  if (!Component) throw new Error("Unknown icon: " + iconName);
  const svg = renderIconSvg(Component, "#" + cx(colorName));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}
const sh = () => ({ type: "outer", blur: 8, offset: 2, angle: 90, color: "000000", opacity: 0.10 });
const shStrong = () => ({ type: "outer", blur: 14, offset: 4, angle: 90, color: "000000", opacity: 0.20 });

function header(s, pres, eyebrow, title, subtitle, accentColor = C.coral) {
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.4, w: 0.08, h: 0.95, fill: { color: accentColor }, line: { color: accentColor } });
  s.addText(eyebrow, { x: 0.85, y: 0.4, w: 10, h: 0.3, fontFace: FONT_B, fontSize: 12, color: accentColor, bold: true, charSpacing: 5, margin: 0 });
  s.addText(title, { x: 0.85, y: 0.7, w: 12.2, h: 0.7, fontFace: FONT_H, fontSize: 28, color: C.marine, bold: true, margin: 0 });
  if (subtitle) {
    s.addText(subtitle, { x: 0.85, y: 1.45, w: 11.8, h: 0.65, fontFace: FONT_B, fontSize: 13, color: C.graphite, italic: true, margin: 0 });
  }
}

function fmt$(n) {
  if (n === null || n === undefined || n === "") return "—";
  if (typeof n === "string") return n;
  return "$" + n.toLocaleString();
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.author = "Property Intelligence Report";
  pres.title = `${D.property.address} — Buyer Intelligence Report`;

  // Pre-render all icons referenced in data
  const iconCache = {};
  async function getIcon(name, color) {
    const key = name + "_" + color;
    if (!iconCache[key]) iconCache[key] = await icon(name, color);
    return iconCache[key];
  }

  // ============================================================
  // SLIDE 1 — TITLE
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.marine };
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.6, w: 0.08, h: 4.3, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText(D.title.eyebrow || "PROPERTY INTELLIGENCE REPORT", {
      x: 0.85, y: 1.55, w: 10, h: 0.4,
      fontFace: FONT_B, fontSize: 14, color: C.coral, bold: true, charSpacing: 6, margin: 0
    });
    s.addText(D.property.address, {
      x: 0.85, y: 2.05, w: 12, h: 1.2,
      fontFace: FONT_H, fontSize: 56, color: C.white, bold: true, margin: 0
    });
    s.addText(`${D.property.city}, ${D.property.state}  ·  ${D.property.zip}`, {
      x: 0.85, y: 3.25, w: 12, h: 0.7,
      fontFace: FONT_H, fontSize: 28, color: "B8C9D6", italic: true, margin: 0
    });
    s.addText(D.title.tagline, {
      x: 0.85, y: 4.3, w: 11, h: 1.4,
      fontFace: FONT_B, fontSize: 16, color: "CDD7DE", margin: 0
    });
    if (D.title.status_tag) {
      s.addShape(pres.shapes.RECTANGLE, { x: 0.85, y: 5.85, w: 4.5, h: 0.55, fill: { color: C.coral }, line: { color: C.coral } });
      s.addText(D.title.status_tag, {
        x: 0.85, y: 5.85, w: 4.5, h: 0.55,
        fontFace: FONT_B, fontSize: 12, color: C.white, bold: true, charSpacing: 5, align: "center", valign: "middle", margin: 0
      });
    }
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 6.8, w: W, h: 0.05, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText(D.title.prepared_label || "PREPARED " + new Date().toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase(), {
      x: 0.85, y: 6.95, w: 5, h: 0.4,
      fontFace: FONT_B, fontSize: 11, color: "8FA0AE", bold: true, charSpacing: 4, margin: 0
    });
    const idLine = [D.property.mls && `MLS #${D.property.mls}`, D.property.parcel && `Parcel ${D.property.parcel}`].filter(Boolean).join("  ·  ");
    s.addText(idLine, {
      x: 7.5, y: 6.95, w: 5.5, h: 0.4,
      fontFace: FONT_B, fontSize: 11, color: "8FA0AE", align: "right", margin: 0
    });
  }

  // ============================================================
  // SLIDE 2 — EXEC SUMMARY
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    s.addText("EXECUTIVE SUMMARY", { x: 0.6, y: 0.4, w: 8, h: 0.35, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 5, margin: 0 });
    s.addText(D.exec_summary.headline || "The Good. The Bad. The Ugly.", {
      x: 0.6, y: 0.75, w: 12, h: 0.7, fontFace: FONT_H, fontSize: 32, color: C.marine, bold: true, margin: 0
    });

    const iCheck = await getIcon("FaCheckCircle", "green");
    const iWarn = await getIcon("FaExclamationTriangle", "amber");
    const iX = await getIcon("FaTimesCircle", "crimson");

    const cols = [
      { x: 0.6, color: C.green, ic: iCheck, label: "THE GOOD", items: D.exec_summary.good },
      { x: 4.85, color: C.amber, ic: iWarn, label: "THE BAD", items: D.exec_summary.bad },
      { x: 9.1, color: C.crimson, ic: iX, label: "THE UGLY", items: D.exec_summary.ugly }
    ];
    cols.forEach(col => {
      s.addShape(pres.shapes.RECTANGLE, { x: col.x, y: 1.7, w: 4.0, h: 5.55, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x: col.x, y: 1.7, w: 4.0, h: 0.12, fill: { color: col.color }, line: { color: col.color } });
      s.addImage({ data: col.ic, x: col.x + 0.25, y: 2.0, w: 0.45, h: 0.45 });
      s.addText(col.label, { x: col.x + 0.85, y: 2.0, w: 3, h: 0.45, fontFace: FONT_B, fontSize: 14, color: col.color, bold: true, charSpacing: 4, valign: "middle", margin: 0 });
      const runs = col.items.map((t, i) => ({
        text: t, options: { bullet: { code: "25A0" }, breakLine: i < col.items.length - 1, paraSpaceAfter: 6 }
      }));
      s.addText(runs, { x: col.x + 0.25, y: 2.6, w: 3.55, h: 4.5, fontFace: FONT_B, fontSize: 11.5, color: C.ink, valign: "top", paraSpaceAfter: 6 });
    });
  }

  // ============================================================
  // SLIDE 3 — AT A GLANCE
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.4, w: 0.08, h: 0.95, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("AT A GLANCE", { x: 0.85, y: 0.4, w: 8, h: 0.3, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 5, margin: 0 });
    s.addText(D.at_a_glance.title || "The Property in Numbers", {
      x: 0.85, y: 0.7, w: 12, h: 0.7, fontFace: FONT_H, fontSize: 30, color: C.marine, bold: true, margin: 0
    });

    const cardW = 3.95, cardH = 2.45;
    D.at_a_glance.stats.forEach((st, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 0.6 + col * (cardW + 0.18);
      const y = 1.85 + row * (cardH + 0.2);
      const color = cx(st.color || (i % 3 === 0 ? "coral" : i % 3 === 1 ? "teal" : "green"));
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.08, h: cardH, fill: { color }, line: { color } });
      s.addText(st.big, { x: x + 0.3, y: y + 0.25, w: cardW - 0.4, h: 1.1, fontFace: FONT_H, fontSize: 44, color: C.marine, bold: true, margin: 0 });
      s.addText(st.label, { x: x + 0.3, y: y + 1.4, w: cardW - 0.4, h: 0.32, fontFace: FONT_B, fontSize: 11, color, bold: true, charSpacing: 4, margin: 0 });
      s.addText(st.sub, { x: x + 0.3, y: y + 1.75, w: cardW - 0.4, h: 0.55, fontFace: FONT_B, fontSize: 11, color: C.steel, italic: true, margin: 0 });
    });
    if (D.at_a_glance.source_note) {
      s.addText(D.at_a_glance.source_note, { x: 0.6, y: 7.15, w: 12.2, h: 0.3, fontFace: FONT_B, fontSize: 9, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 4 — TOTAL MONTHLY CARRY
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    header(s, pres, "TOTAL MONTHLY CARRY",
      D.monthly_carry.title || "What You Actually Pay Each Month",
      D.monthly_carry.subtitle);

    const scenarios = D.monthly_carry.scenarios;
    const cardW = 3.0, cardH = 4.65, baseY = 2.4;
    scenarios.forEach((sc, i) => {
      const x = 0.6 + i * (cardW + 0.13);
      const color = cx(sc.color);
      s.addShape(pres.shapes.RECTANGLE, { x, y: baseY, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: baseY, w: cardW, h: 0.08, fill: { color }, line: { color } });
      s.addText(sc.label, { x: x + 0.25, y: baseY + 0.18, w: cardW - 0.4, h: 0.32, fontFace: FONT_B, fontSize: 13, color, bold: true, charSpacing: 4, margin: 0 });
      s.addText(`Down  ${fmt$(sc.down)}   Loan  ${fmt$(sc.loan)}`, { x: x + 0.25, y: baseY + 0.5, w: cardW - 0.4, h: 0.28, fontFace: FONT_B, fontSize: 10, color: C.steel, margin: 0 });

      const items = [
        ["Principal & Interest", fmt$(sc.pi)],
        ["PMI", fmt$(sc.pmi)],
        ["Property tax", fmt$(sc.tax)],
        ["Homeowners ins.", fmt$(sc.ins)],
        ["Wind / hurricane", fmt$(sc.wind)],
        ["Flood (NFIP est.)", fmt$(sc.flood)]
      ];
      let yy = baseY + 0.9;
      items.forEach(it => {
        const isDash = it[1] === "—";
        s.addText(it[0], { x: x + 0.25, y: yy, w: 1.7, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.graphite, valign: "middle", margin: 0 });
        s.addText(it[1], { x: x + 1.85, y: yy, w: cardW - 2.15, h: 0.3, fontFace: FONT_B, fontSize: 11, color: isDash ? C.steel : C.ink, bold: !isDash, align: "right", valign: "middle", margin: 0 });
        s.addShape(pres.shapes.LINE, { x: x + 0.25, y: yy + 0.32, w: cardW - 0.5, h: 0, line: { color: C.hairline, width: 0.4 } });
        yy += 0.34;
      });

      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.15, y: yy + 0.1, w: cardW - 0.3, h: 0.7, fill: { color }, line: { color } });
      s.addText("TOTAL / MO", { x: x + 0.28, y: yy + 0.13, w: 1.3, h: 0.32, fontFace: FONT_B, fontSize: 10, color: C.white, bold: true, charSpacing: 3, valign: "middle", margin: 0 });
      s.addText(fmt$(sc.total), { x: x + 1.45, y: yy + 0.13, w: cardW - 1.6, h: 0.5, fontFace: FONT_H, fontSize: 20, color: C.white, bold: true, align: "right", valign: "middle", margin: 0 });
      s.addText(sc.note || "", { x: x + 0.25, y: baseY + cardH - 0.6, w: cardW - 0.4, h: 0.5, fontFace: FONT_B, fontSize: 10, color: C.steel, italic: true, margin: 0 });
    });
    if (D.monthly_carry.source_note) {
      s.addText(D.monthly_carry.source_note, { x: 0.6, y: 7.15, w: 12.2, h: 0.3, fontFace: FONT_B, fontSize: 9, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 5 — PRICE TRAJECTORY
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    header(s, pres, "PRICE TRAJECTORY",
      D.price_history.title || "Price History",
      D.price_history.subtitle);

    s.addChart(pres.charts.LINE, [{
      name: "List Price",
      labels: D.price_history.points.map(p => p.label),
      values: D.price_history.points.map(p => p.price)
    }], {
      x: 0.6, y: 2.5, w: 8.6, h: 4.5,
      chartColors: [C.coral], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 10,
      lineDataSymbolLineColor: C.coral,
      chartArea: { fill: { color: C.white }, roundedCorners: false },
      catAxisLabelColor: C.steel, catAxisLabelFontFace: FONT_B, catAxisLabelFontSize: 10,
      valAxisLabelColor: C.steel, valAxisLabelFontFace: FONT_B, valAxisLabelFontSize: 10,
      valAxisLabelFormatCode: "$#,##0",
      valGridLine: { color: C.hairline, size: 0.5 }, catGridLine: { style: "none" },
      showLegend: false, showTitle: false
    });

    const px = 9.5, pw = 3.3;
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 2.5, w: pw, h: 4.5, fill: { color: C.marine }, line: { color: C.marine }, shadow: shStrong() });
    s.addText(D.price_history.callouts_label || "THE NUMBERS", { x: px + 0.3, y: 2.7, w: pw - 0.4, h: 0.35, fontFace: FONT_B, fontSize: 11, color: C.coral, bold: true, charSpacing: 4, margin: 0 });
    D.price_history.callouts.forEach((c, i) => {
      const yy = 3.15 + i * 0.78;
      s.addText(c.big, { x: px + 0.3, y: yy, w: pw - 0.4, h: 0.4, fontFace: FONT_H, fontSize: 22, color: C.white, bold: true, margin: 0 });
      s.addText(c.label, { x: px + 0.3, y: yy + 0.42, w: pw - 0.4, h: 0.28, fontFace: FONT_B, fontSize: 10, color: "8FA9C0", margin: 0 });
    });
    if (D.price_history.source_note) {
      s.addText(D.price_history.source_note, { x: 0.6, y: 7.15, w: 12.2, h: 0.3, fontFace: FONT_B, fontSize: 9, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 6 — COMP ANALYSIS
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    header(s, pres, "COMP ANALYSIS",
      D.comps.title || "What the Subject Should Cost",
      D.comps.subtitle);

    const compLabels = D.comps.entries.map(c => c.label);
    const compPSF = D.comps.entries.map(c => c.psf);

    s.addChart(pres.charts.BAR, [{ name: "$ per sqft", labels: compLabels, values: compPSF }], {
      x: 0.6, y: 2.45, w: 7.5, h: 4.55,
      barDir: "col",
      chartColors: [C.teal],
      chartArea: { fill: { color: C.white }, roundedCorners: false },
      catAxisLabelColor: C.steel, catAxisLabelFontFace: FONT_B, catAxisLabelFontSize: 10,
      valAxisLabelColor: C.steel, valAxisLabelFontFace: FONT_B, valAxisLabelFontSize: 10,
      valAxisLabelFormatCode: "$#,##0",
      valGridLine: { color: C.hairline, size: 0.5 }, catGridLine: { style: "none" },
      showValue: true, dataLabelPosition: "outEnd",
      dataLabelColor: C.marine, dataLabelFontFace: FONT_B, dataLabelFontSize: 11,
      dataLabelFormatCode: "$#,##0",
      showLegend: false,
      showTitle: true, title: D.comps.chart_title || "$ per sqft  ·  Nearby comps",
      titleColor: C.marine, titleFontFace: FONT_H, titleFontSize: 14
    });

    const px = 8.4, pw = 4.4;
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 2.45, w: pw, h: 4.55, fill: { color: C.marine }, line: { color: C.marine }, shadow: shStrong() });
    s.addText("FAIR-VALUE WALK", { x: px + 0.3, y: 2.6, w: pw - 0.4, h: 0.35, fontFace: FONT_B, fontSize: 11, color: C.coral, bold: true, charSpacing: 4, margin: 0 });

    let yy = 3.05;
    D.comps.fair_value_walk.forEach((it, i) => {
      const isLast = i === D.comps.fair_value_walk.length - 1;
      s.addText(it.label, { x: px + 0.3, y: yy, w: 2.6, h: 0.35, fontFace: FONT_B, fontSize: 11, color: isLast ? C.coral : "B8C9D6", bold: isLast, valign: "middle", margin: 0 });
      s.addText(it.value, { x: px + 2.9, y: yy, w: pw - 3.1, h: 0.35, fontFace: FONT_B, fontSize: 12, color: isLast ? C.coral : C.white, bold: true, align: "right", valign: "middle", margin: 0 });
      s.addShape(pres.shapes.LINE, { x: px + 0.3, y: yy + 0.38, w: pw - 0.6, h: 0, line: { color: "1B4366", width: 0.5 } });
      yy += 0.42;
    });

    yy += 0.05;
    s.addText("IMPLIED FAIR VALUE", { x: px + 0.3, y: yy, w: pw - 0.4, h: 0.32, fontFace: FONT_B, fontSize: 11, color: C.coral, bold: true, charSpacing: 4, margin: 0 });
    s.addText(D.comps.implied_range, { x: px + 0.3, y: yy + 0.32, w: pw - 0.4, h: 0.6, fontFace: FONT_H, fontSize: 26, color: C.white, bold: true, margin: 0 });
    s.addText(D.comps.implied_takeaway, { x: px + 0.3, y: yy + 0.95, w: pw - 0.4, h: 0.85, fontFace: FONT_B, fontSize: 11, color: "B8C9D6", italic: true, margin: 0 });

    if (D.comps.source_note) {
      s.addText(D.comps.source_note, { x: 0.6, y: 7.15, w: 12.2, h: 0.3, fontFace: FONT_B, fontSize: 9, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 7 — 5-YEAR PROJECTION
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    header(s, pres, "5-YEAR COST PROJECTION",
      D.projection.title || "What This Property Costs Over Time",
      D.projection.subtitle);

    const years = D.projection.years.map(y => y.label);
    const piVals = D.projection.years.map(y => y.pi);
    const taxVals = D.projection.years.map(y => y.tax);
    const insVals = D.projection.years.map(y => y.ins);

    s.addChart(pres.charts.BAR, [
      { name: "Principal & Interest", labels: years, values: piVals },
      { name: "Property tax", labels: years, values: taxVals },
      { name: "Insurance (HO+wind+flood)", labels: years, values: insVals }
    ], {
      x: 0.6, y: 2.4, w: 8.0, h: 4.6,
      barDir: "col", barGrouping: "stacked",
      chartColors: [C.marine, C.amber, C.coral],
      chartArea: { fill: { color: C.white }, roundedCorners: false },
      catAxisLabelColor: C.steel, catAxisLabelFontFace: FONT_B, catAxisLabelFontSize: 10,
      valAxisLabelColor: C.steel, valAxisLabelFontFace: FONT_B, valAxisLabelFontSize: 10,
      valAxisLabelFormatCode: "$#,##0",
      valGridLine: { color: C.hairline, size: 0.5 }, catGridLine: { style: "none" },
      showValue: false, showLegend: true, legendPos: "b",
      legendFontFace: FONT_B, legendFontSize: 10, legendColor: C.graphite,
      showTitle: true, title: D.projection.chart_title || "Monthly carry by component  ·  $/month",
      titleColor: C.marine, titleFontFace: FONT_H, titleFontSize: 14
    });

    const px = 8.85, pw = 4.0;
    s.addShape(pres.shapes.RECTANGLE, { x: px, y: 2.4, w: pw, h: 4.6, fill: { color: C.marine }, line: { color: C.marine }, shadow: shStrong() });
    s.addText("FIVE-YEAR DELTA", { x: px + 0.3, y: 2.55, w: pw - 0.4, h: 0.35, fontFace: FONT_B, fontSize: 11, color: C.coral, bold: true, charSpacing: 4, margin: 0 });
    s.addText(fmt$(D.projection.year1_carry), { x: px + 0.3, y: 3.0, w: pw - 0.4, h: 0.55, fontFace: FONT_H, fontSize: 32, color: C.white, bold: true, margin: 0 });
    s.addText("Year 1 monthly carry", { x: px + 0.3, y: 3.55, w: pw - 0.4, h: 0.3, fontFace: FONT_B, fontSize: 11, color: "B8C9D6", italic: true, margin: 0 });
    s.addText(fmt$(D.projection.year5_carry), { x: px + 0.3, y: 4.0, w: pw - 0.4, h: 0.55, fontFace: FONT_H, fontSize: 32, color: C.white, bold: true, margin: 0 });
    s.addText("Year 5 monthly carry", { x: px + 0.3, y: 4.55, w: pw - 0.4, h: 0.3, fontFace: FONT_B, fontSize: 11, color: "B8C9D6", italic: true, margin: 0 });
    s.addShape(pres.shapes.LINE, { x: px + 0.3, y: 5.0, w: pw - 0.6, h: 0, line: { color: "1B4366", width: 1 } });
    s.addText(D.projection.delta_label, { x: px + 0.3, y: 5.1, w: pw - 0.4, h: 0.5, fontFace: FONT_H, fontSize: 28, color: C.coral, bold: true, margin: 0 });
    s.addText(D.projection.delta_sub, { x: px + 0.3, y: 5.6, w: pw - 0.4, h: 0.3, fontFace: FONT_B, fontSize: 11, color: "B8C9D6", italic: true, margin: 0 });
    s.addText(D.projection.cumulative_note, { x: px + 0.3, y: 6.0, w: pw - 0.4, h: 0.85, fontFace: FONT_B, fontSize: 11, color: C.white, margin: 0 });

    if (D.projection.source_note) {
      s.addText(D.projection.source_note, { x: 0.6, y: 7.15, w: 12.2, h: 0.3, fontFace: FONT_B, fontSize: 9, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 8 — SCHOOLS
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    header(s, pres, "SCHOOLS",
      D.schools.title || "School Assignments",
      D.schools.subtitle);

    const cardW = 4.0, cardH = 4.6;
    const colors = [C.green, C.coral, C.teal];
    D.schools.list.forEach((sc, i) => {
      const x = 0.6 + i * (cardW + 0.17);
      const y = 2.3;
      const color = cx(sc.color || colors[i % 3]);
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: 0.18, fill: { color }, line: { color } });
      s.addText(sc.rating, { x: x + 0.3, y: y + 0.5, w: 1.7, h: 1.5, fontFace: FONT_H, fontSize: 84, color, bold: true, margin: 0 });
      s.addText(sc.rating_sub || "/10 GreatSchools", { x: x + 0.3, y: y + 1.95, w: cardW - 0.4, h: 0.35, fontFace: FONT_B, fontSize: 11, color: C.steel, bold: true, charSpacing: 2, margin: 0 });
      s.addText(sc.name, { x: x + 0.3, y: y + 2.5, w: cardW - 0.5, h: 0.7, fontFace: FONT_H, fontSize: 17, color: C.marine, bold: true, margin: 0 });
      s.addText(`Grades ${sc.grades}  ·  ${sc.distance}`, { x: x + 0.3, y: y + 3.25, w: cardW - 0.5, h: 0.3, fontFace: FONT_B, fontSize: 11, color, bold: true, margin: 0 });
      s.addText(sc.facts, { x: x + 0.3, y: y + 3.6, w: cardW - 0.5, h: 0.55, fontFace: FONT_B, fontSize: 11, color: C.graphite, margin: 0 });
      if (sc.tagline) {
        s.addText(sc.tagline, { x: x + 0.3, y: y + 4.15, w: cardW - 0.5, h: 0.3, fontFace: FONT_B, fontSize: 10, color: C.steel, italic: true, margin: 0 });
      }
    });
    if (D.schools.source_note) {
      s.addText(D.schools.source_note, { x: 0.6, y: 7.15, w: 12.2, h: 0.3, fontFace: FONT_B, fontSize: 9, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 9 — CLIMATE & RISK
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    header(s, pres, "CLIMATE & RISK",
      D.climate.title || "What Insurance Will Actually Cost You",
      D.climate.subtitle);

    const cardW = 4.05, cardH = 2.35;
    for (let i = 0; i < D.climate.risks.length; i++) {
      const r = D.climate.risks[i];
      const col = i % 3, row = Math.floor(i / 3);
      const x = 0.6 + col * (cardW + 0.13);
      const y = 2.15 + row * (cardH + 0.18);
      const color = cx(r.color);
      const ic = await getIcon(r.icon, r.color);
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.08, h: cardH, fill: { color }, line: { color } });
      s.addImage({ data: ic, x: x + 0.3, y: y + 0.22, w: 0.4, h: 0.4 });
      s.addText(r.label, { x: x + 0.85, y: y + 0.22, w: cardW - 1, h: 0.25, fontFace: FONT_B, fontSize: 11, color: C.marine, bold: true, charSpacing: 3, margin: 0 });
      s.addText(r.level, { x: x + 0.85, y: y + 0.46, w: cardW - 1, h: 0.3, fontFace: FONT_B, fontSize: 13, color, bold: true, margin: 0 });
      s.addText(r.body, { x: x + 0.3, y: y + 0.85, w: cardW - 0.5, h: cardH - 0.95, fontFace: FONT_B, fontSize: 10.5, color: C.graphite, margin: 0, valign: "top" });
    }
    if (D.climate.source_note) {
      s.addText(D.climate.source_note, { x: 0.6, y: 7.15, w: 12.2, h: 0.3, fontFace: FONT_B, fontSize: 9, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 10 — DILIGENCE BUDGET
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    header(s, pres, "DILIGENCE BUDGET",
      D.diligence.title || "Itemized Pre-Closing Costs",
      D.diligence.subtitle);

    let yy = 2.15;
    const lx = 0.6, lw = 12.2;
    const rowH = 0.255;
    const grpH = 0.25;

    // Header row
    s.addShape(pres.shapes.RECTANGLE, { x: lx, y: yy, w: lw, h: 0.34, fill: { color: C.marine }, line: { color: C.marine } });
    s.addText("LINE ITEM", { x: lx + 0.2, y: yy, w: 4, h: 0.34, fontFace: FONT_B, fontSize: 11, color: C.white, bold: true, charSpacing: 4, valign: "middle", margin: 0 });
    s.addText("NOTES", { x: lx + 4.6, y: yy, w: 5, h: 0.34, fontFace: FONT_B, fontSize: 11, color: C.white, bold: true, charSpacing: 4, valign: "middle", margin: 0 });
    s.addText("LOW", { x: lx + 9.6, y: yy, w: 1.2, h: 0.34, fontFace: FONT_B, fontSize: 11, color: C.white, bold: true, charSpacing: 4, valign: "middle", align: "right", margin: 0 });
    s.addText("HIGH", { x: lx + 10.9, y: yy, w: 1.2, h: 0.34, fontFace: FONT_B, fontSize: 11, color: C.white, bold: true, charSpacing: 4, valign: "middle", align: "right", margin: 0 });
    yy += 0.36;

    D.diligence.groups.forEach(group => {
      const gColor = cx(group.color);
      s.addShape(pres.shapes.RECTANGLE, { x: lx, y: yy, w: lw, h: grpH, fill: { color: C.mist }, line: { color: C.mist } });
      s.addShape(pres.shapes.RECTANGLE, { x: lx, y: yy, w: 0.08, h: grpH, fill: { color: gColor }, line: { color: gColor } });
      s.addText(group.category, { x: lx + 0.2, y: yy, w: 8, h: grpH, fontFace: FONT_B, fontSize: 10, color: gColor, bold: true, charSpacing: 4, valign: "middle", margin: 0 });
      yy += grpH;
      group.rows.forEach(row => {
        const lo = row.low === null || row.low === undefined ? "—" : "$" + row.low.toLocaleString();
        const hi = row.high === null || row.high === undefined ? "—" : "$" + row.high.toLocaleString();
        s.addText(row.item, { x: lx + 0.2, y: yy, w: 4.3, h: rowH, fontFace: FONT_B, fontSize: 10.5, color: C.ink, valign: "middle", margin: 0 });
        s.addText(row.note || "", { x: lx + 4.6, y: yy, w: 4.9, h: rowH, fontFace: FONT_B, fontSize: 10, color: C.steel, italic: true, valign: "middle", margin: 0 });
        s.addText(lo, { x: lx + 9.6, y: yy, w: 1.2, h: rowH, fontFace: FONT_B, fontSize: 11, color: C.ink, align: "right", valign: "middle", margin: 0 });
        s.addText(hi, { x: lx + 10.9, y: yy, w: 1.2, h: rowH, fontFace: FONT_B, fontSize: 11, color: C.ink, bold: true, align: "right", valign: "middle", margin: 0 });
        s.addShape(pres.shapes.LINE, { x: lx + 0.2, y: yy + rowH + 0.01, w: lw - 0.4, h: 0, line: { color: C.hairline, width: 0.4 } });
        yy += rowH;
      });
    });

    yy += 0.05;
    s.addShape(pres.shapes.RECTANGLE, { x: lx, y: yy, w: lw, h: 0.45, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("TOTAL DILIGENCE BUDGET", { x: lx + 0.2, y: yy, w: 8, h: 0.45, fontFace: FONT_B, fontSize: 12, color: C.white, bold: true, charSpacing: 4, valign: "middle", margin: 0 });
    s.addText("$" + D.diligence.total_low.toLocaleString(), { x: lx + 9.6, y: yy, w: 1.2, h: 0.45, fontFace: FONT_H, fontSize: 16, color: C.white, bold: true, align: "right", valign: "middle", margin: 0 });
    s.addText("$" + D.diligence.total_high.toLocaleString(), { x: lx + 10.9, y: yy, w: 1.2, h: 0.45, fontFace: FONT_H, fontSize: 16, color: C.white, bold: true, align: "right", valign: "middle", margin: 0 });

    const noteY = yy + 0.5;
    if (D.diligence.source_note && noteY < 7.4) {
      s.addText(D.diligence.source_note, { x: 0.6, y: noteY, w: 12.2, h: 7.45 - noteY, fontFace: FONT_B, fontSize: 9.5, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 11 — COMPETING INVENTORY
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    header(s, pres, "COMPETING INVENTORY",
      D.inventory.title || "What Else Buys You at This Price Point",
      D.inventory.subtitle);

    const subj = D.inventory.subject;
    const sx = 0.6, sy = 2.4, sw = 4.6, shh = 4.7;
    s.addShape(pres.shapes.RECTANGLE, { x: sx, y: sy, w: sw, h: shh, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, shadow: sh() });
    s.addShape(pres.shapes.RECTANGLE, { x: sx, y: sy, w: sw, h: 0.4, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("SUBJECT", { x: sx + 0.25, y: sy, w: 3, h: 0.4, fontFace: FONT_B, fontSize: 11, color: C.white, bold: true, charSpacing: 4, valign: "middle", margin: 0 });
    s.addText(subj.address, { x: sx + 0.25, y: sy + 0.55, w: sw - 0.4, h: 0.55, fontFace: FONT_H, fontSize: 22, color: C.marine, bold: true, margin: 0 });
    s.addText(subj.price, { x: sx + 0.25, y: sy + 1.1, w: sw - 0.4, h: 0.85, fontFace: FONT_H, fontSize: 40, color: C.coral, bold: true, margin: 0 });
    const subjStats = [
      ["Bed / Bath", subj.bed_bath],
      ["Square feet", subj.sqft],
      ["Lot size", subj.lot],
      ["Year built", subj.year],
      ["$ / sqft", subj.psf]
    ];
    let syy = sy + 2.1;
    subjStats.forEach(it => {
      s.addText(it[0], { x: sx + 0.25, y: syy, w: 2, h: 0.32, fontFace: FONT_B, fontSize: 11, color: C.graphite, valign: "middle", margin: 0 });
      s.addText(it[1] || "—", { x: sx + 2.3, y: syy, w: sw - 2.5, h: 0.32, fontFace: FONT_B, fontSize: 12, color: C.marine, bold: true, align: "right", valign: "middle", margin: 0 });
      s.addShape(pres.shapes.LINE, { x: sx + 0.25, y: syy + 0.34, w: sw - 0.5, h: 0, line: { color: C.hairline, width: 0.4 } });
      syy += 0.36;
    });
    s.addText(subj.note, { x: sx + 0.25, y: sy + shh - 1.0, w: sw - 0.4, h: 0.9, fontFace: FONT_B, fontSize: 11, color: C.graphite, italic: true, margin: 0 });

    const aw = 3.85, ah = 2.25, gx = 0.15, gy = 0.2;
    const baseAx = 5.4, baseAy = 2.4;
    D.inventory.alternatives.slice(0, 4).forEach((a, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = baseAx + col * (aw + gx);
      const y = baseAy + row * (ah + gy);
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: aw, h: ah, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.08, h: ah, fill: { color: C.teal }, line: { color: C.teal } });
      s.addText(a.address, { x: x + 0.2, y: y + 0.15, w: aw - 0.3, h: 0.35, fontFace: FONT_H, fontSize: 14, color: C.marine, bold: true, margin: 0 });
      s.addText(a.price, { x: x + 0.2, y: y + 0.5, w: aw - 0.3, h: 0.5, fontFace: FONT_H, fontSize: 22, color: C.teal, bold: true, margin: 0 });
      s.addText(`${a.bed_bath} bd  ·  ${a.sqft} sqft  ·  ${a.psf}/sf`, { x: x + 0.2, y: y + 1.05, w: aw - 0.3, h: 0.3, fontFace: FONT_B, fontSize: 10, color: C.steel, bold: true, margin: 0 });
      s.addText(a.note, { x: x + 0.2, y: y + 1.4, w: aw - 0.3, h: ah - 1.5, fontFace: FONT_B, fontSize: 10, color: C.graphite, margin: 0, valign: "top" });
    });

    if (D.inventory.source_note) {
      s.addText(D.inventory.source_note, { x: 0.6, y: 7.2, w: 12.2, h: 0.3, fontFace: FONT_B, fontSize: 9, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 12 — RED FLAGS
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.4, w: 0.08, h: 0.95, fill: { color: C.crimson }, line: { color: C.crimson } });
    s.addText("RED FLAGS", { x: 0.85, y: 0.4, w: 8, h: 0.3, fontFace: FONT_B, fontSize: 12, color: C.crimson, bold: true, charSpacing: 5, margin: 0 });
    s.addText(D.red_flags.title || "Things to Resolve Before You Sign", {
      x: 0.85, y: 0.7, w: 12, h: 0.7, fontFace: FONT_H, fontSize: 28, color: C.marine, bold: true, margin: 0
    });

    const cardW = 6.05, cardH = 1.7;
    D.red_flags.items.slice(0, 6).forEach((f, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.6 + col * (cardW + 0.15);
      const y = 1.7 + row * (cardH + 0.13);
      const num = String(i + 1).padStart(2, "0");
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.08, h: cardH, fill: { color: C.crimson }, line: { color: C.crimson } });
      s.addText(num, { x: x + 0.25, y: y + 0.2, w: 1.0, h: 0.7, fontFace: FONT_H, fontSize: 36, color: C.crimson, bold: true, margin: 0 });
      s.addText(f.title, { x: x + 1.3, y: y + 0.22, w: cardW - 1.5, h: 0.45, fontFace: FONT_H, fontSize: 16, color: C.marine, bold: true, margin: 0 });
      s.addText(f.body, { x: x + 1.3, y: y + 0.7, w: cardW - 1.5, h: cardH - 0.8, fontFace: FONT_B, fontSize: 11, color: C.graphite, valign: "top", margin: 0 });
    });
    if (D.red_flags.footer_note) {
      s.addText(D.red_flags.footer_note, { x: 0.6, y: 7.15, w: 12, h: 0.3, fontFace: FONT_B, fontSize: 10, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 13 — QUESTION SCRIPTS
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    header(s, pres, "QUESTION SCRIPTS",
      D.scripts.title || "Bring These Into the Negotiation",
      D.scripts.subtitle);

    const iAgent = await getIcon("FaUserTie", "coral");
    const iNeighbor = await getIcon("FaUserFriends", "teal");
    const iInspector = await getIcon("FaHardHat", "amber");
    const cols = [
      { ic: iAgent, color: C.coral, label: "LISTING AGENT", count: `${D.scripts.agent.length} questions`, items: D.scripts.agent },
      { ic: iNeighbor, color: C.teal, label: "NEIGHBORS", count: `${D.scripts.neighbors.length} questions`, items: D.scripts.neighbors },
      { ic: iInspector, color: C.amber, label: "BRIEF YOUR INSPECTOR", count: `${D.scripts.inspector.length} priorities`, items: D.scripts.inspector }
    ];
    const cardW = 4.0, cardH = 4.7, baseY = 2.3;
    cols.forEach(col => {
      const x = 0.6 + cols.indexOf(col) * (cardW + 0.17);
      s.addShape(pres.shapes.RECTANGLE, { x, y: baseY, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y: baseY, w: cardW, h: 0.55, fill: { color: col.color }, line: { color: col.color } });
      s.addImage({ data: col.ic, x: x + 0.25, y: baseY + 0.11, w: 0.32, h: 0.32 });
      s.addText(col.label, { x: x + 0.7, y: baseY + 0.05, w: cardW - 0.8, h: 0.3, fontFace: FONT_B, fontSize: 13, color: C.white, bold: true, charSpacing: 4, valign: "middle", margin: 0 });
      s.addText(col.count, { x: x + 0.7, y: baseY + 0.3, w: cardW - 0.8, h: 0.22, fontFace: FONT_B, fontSize: 10, color: "FFE5D6", italic: true, valign: "middle", margin: 0 });

      const runs = [];
      col.items.forEach((t, j) => {
        runs.push({ text: String(j + 1).padStart(2, "0") + "  ", options: { bold: true, color: col.color } });
        runs.push({ text: t, options: { color: C.ink, breakLine: j < col.items.length - 1 } });
      });
      s.addText(runs, {
        x: x + 0.25, y: baseY + 0.7, w: cardW - 0.4, h: cardH - 0.8,
        fontFace: FONT_B, fontSize: 10, valign: "top", paraSpaceAfter: 4
      });
    });
    if (D.scripts.footer_note) {
      s.addText(D.scripts.footer_note, { x: 0.6, y: 7.15, w: 12.2, h: 0.3, fontFace: FONT_B, fontSize: 10, color: C.steel, italic: true, margin: 0 });
    }
  }

  // ============================================================
  // SLIDE 14 — ACTION PLAN
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    header(s, pres, "ACTION PLAN", D.action.title || "A Phased Diligence Plan", null);

    const cardW = 3.0, cardH = 5.4;
    D.action.phases.slice(0, 4).forEach((p, i) => {
      const x = 0.6 + i * (cardW + 0.13);
      const y = 1.65;
      const color = cx(p.color);
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: cardH, fill: { color: C.white }, line: { color: C.hairline, width: 0.75 }, shadow: sh() });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: 1.0, fill: { color }, line: { color } });
      s.addText("PHASE  " + String(i + 1).padStart(2, "0"), { x: x + 0.25, y: y + 0.15, w: cardW - 0.4, h: 0.3, fontFace: FONT_B, fontSize: 10, color: C.white, bold: true, charSpacing: 4, margin: 0 });
      s.addText(p.title, { x: x + 0.25, y: y + 0.45, w: cardW - 0.4, h: 0.4, fontFace: FONT_H, fontSize: 18, color: C.white, bold: true, margin: 0 });
      s.addText(p.time, { x: x + 0.25, y: y + 0.78, w: cardW - 0.4, h: 0.22, fontFace: FONT_B, fontSize: 10, color: C.white, italic: true, margin: 0 });
      const runs = p.items.map((t, j) => ({
        text: t, options: { bullet: { code: "25A0" }, breakLine: j < p.items.length - 1, paraSpaceAfter: 6 }
      }));
      s.addText(runs, {
        x: x + 0.25, y: y + 1.15, w: cardW - 0.4, h: cardH - 1.3,
        fontFace: FONT_B, fontSize: 10.5, color: C.ink, valign: "top", paraSpaceAfter: 6
      });
    });
  }

  // ============================================================
  // SLIDE 15 — OFFER STRATEGY (DARK)
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.marine };
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.6, w: 0.08, h: 0.95, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("OFFER STRATEGY", { x: 0.85, y: 0.6, w: 8, h: 0.3, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 5, margin: 0 });
    s.addText(D.offer.title || "The Number, The Walk-Away, The Upside", {
      x: 0.85, y: 0.9, w: 12, h: 0.7, fontFace: FONT_H, fontSize: 28, color: C.white, bold: true, margin: 0
    });

    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 2.0, w: 12.2, h: 1.55, fill: { color: C.panel }, line: { color: C.coral, width: 1.5 } });
    s.addText("RECOMMENDED OPENING OFFER", { x: 0.85, y: 2.15, w: 7, h: 0.32, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 4, margin: 0 });
    s.addText(D.offer.opening, { x: 0.85, y: 2.5, w: 7, h: 1.0, fontFace: FONT_H, fontSize: 48, color: C.white, bold: true, margin: 0 });
    (D.offer.rationale_lines || []).forEach((line, i) => {
      s.addText(line, { x: 8.2, y: 2.4 + i * 0.3, w: 4.5, h: 0.4, fontFace: FONT_B, fontSize: 12, color: "B8C9D6", italic: true, margin: 0 });
    });

    const triggers = [
      { color: C.crimson, label: "WALK AWAY IF", items: D.offer.walk_away },
      { color: C.amber, label: "REDUCE FURTHER IF", items: D.offer.reduce_further },
      { color: C.green, label: "GO TO ASK IF", items: D.offer.go_to_ask }
    ];
    const cardW = 4.0, cardH = 3.3;
    triggers.forEach((t, i) => {
      const x = 0.6 + i * (cardW + 0.15);
      const y = 3.85;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: cardH, fill: { color: C.panel }, line: { color: t.color, width: 1 } });
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: 0.08, fill: { color: t.color }, line: { color: t.color } });
      s.addText(t.label, { x: x + 0.25, y: y + 0.25, w: cardW - 0.4, h: 0.4, fontFace: FONT_B, fontSize: 13, color: t.color, bold: true, charSpacing: 4, margin: 0 });
      const runs = (t.items || []).map((item, j) => ({
        text: item, options: { bullet: { code: "25A0" }, breakLine: j < t.items.length - 1, paraSpaceAfter: 6 }
      }));
      s.addText(runs, { x: x + 0.25, y: y + 0.75, w: cardW - 0.4, h: cardH - 0.9, fontFace: FONT_B, fontSize: 11, color: C.white, valign: "top", paraSpaceAfter: 6 });
    });

    s.addText("BOTTOM LINE", { x: 0.85, y: 7.1, w: 3, h: 0.3, fontFace: FONT_B, fontSize: 11, color: C.coral, bold: true, charSpacing: 4, margin: 0 });
    s.addText(D.offer.bottom_line, {
      x: 2.6, y: 7.1, w: 10.3, h: 0.3, fontFace: FONT_B, fontSize: 12, color: C.white, italic: true, margin: 0, align: "right"
    });
  }

  // ============================================================
  // SLIDE 16 — SOURCES & CAVEATS (DARK)
  // ============================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.marine };
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.6, w: 0.08, h: 0.95, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("SOURCES & CAVEATS", { x: 0.85, y: 0.6, w: 8, h: 0.3, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 5, margin: 0 });
    s.addText(D.sources.title || "Show Your Work", {
      x: 0.85, y: 0.9, w: 12, h: 0.7, fontFace: FONT_H, fontSize: 28, color: C.white, bold: true, margin: 0
    });

    const lx = 0.6, rx = 6.95, colW = 6.25, colH = 5.0;
    s.addShape(pres.shapes.RECTANGLE, { x: lx, y: 2.0, w: colW, h: colH, fill: { color: C.panel }, line: { color: "1B4366", width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: lx, y: 2.0, w: colW, h: 0.08, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("KEY PUBLIC DATA SOURCES", { x: lx + 0.3, y: 2.2, w: colW - 0.5, h: 0.35, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 4, margin: 0 });
    const sRuns = D.sources.list.map((t, i) => ({
      text: t, options: { bullet: { code: "25A0" }, breakLine: i < D.sources.list.length - 1, paraSpaceAfter: 4 }
    }));
    s.addText(sRuns, { x: lx + 0.3, y: 2.65, w: colW - 0.5, h: colH - 0.8, fontFace: FONT_B, fontSize: 10.5, color: C.white, valign: "top", paraSpaceAfter: 4 });

    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 2.0, w: colW, h: colH, fill: { color: C.panel }, line: { color: "1B4366", width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 2.0, w: colW, h: 0.08, fill: { color: C.coral }, line: { color: C.coral } });
    s.addText("CAVEATS", { x: rx + 0.3, y: 2.2, w: colW - 0.5, h: 0.35, fontFace: FONT_B, fontSize: 12, color: C.coral, bold: true, charSpacing: 4, margin: 0 });
    const cRuns = D.sources.caveats.map((t, i) => ({
      text: t, options: { bullet: { code: "25A0" }, breakLine: i < D.sources.caveats.length - 1, paraSpaceAfter: 6 }
    }));
    s.addText(cRuns, { x: rx + 0.3, y: 2.65, w: colW - 0.5, h: colH - 0.8, fontFace: FONT_B, fontSize: 10.5, color: C.white, valign: "top", paraSpaceAfter: 6 });

    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.14, w: W, h: 0.04, fill: { color: C.coral }, line: { color: C.coral } });
    const footer = `${D.property.address.toUpperCase()}  ·  PROPERTY INTELLIGENCE REPORT  ·  ${D.title.prepared_label || ""}`;
    s.addText(footer, {
      x: 0.6, y: 7.22, w: 12.2, h: 0.24, fontFace: FONT_B, fontSize: 9, color: "8FA0AE", charSpacing: 3, align: "center", margin: 0
    });
  }

  await pres.writeFile({ fileName: outputPath });
  console.log("Wrote: " + outputPath);
})();
