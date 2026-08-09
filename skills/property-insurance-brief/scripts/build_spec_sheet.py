#!/usr/bin/env python3
"""
Property Insurance Brief — One-Page Quote Spec Sheet (PDF)

Usage: python3 build_spec_sheet.py <insurance_data.json> <spec_sheet.pdf>

Renders the `spec_sheet` section of insurance_data.json as a printable
one-page letter-portrait worksheet: property facts and the requested
coverage spec on the left, three blank hand-fillable quote columns on
the right. Design tokens match the deck (marine/teal/coral, serif heads).

Hard constraint: one page. The layout is computed top-down; if content
would overflow, the script measures both columns against the footer floor and exits non-zero rather than drawing off the page.
"""

import json
import sys

from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

# ---- Locked palette (matches deck) ----
MARINE = HexColor("#0A2540")
TEAL = HexColor("#1C7293")
CORAL = HexColor("#E36414")
GRAPHITE = HexColor("#3A4A5C")
STEEL = HexColor("#64748B")
MIST = HexColor("#E5EBEF")
HAIRLINE = HexColor("#C9D2DA")
WHITE = HexColor("#FFFFFF")
ROWALT = HexColor("#F4F7F9")

FONT_H = "Times-Bold"      # closest built-in to Georgia headline
FONT_B = "Helvetica"       # closest built-in to Calibri body
FONT_BB = "Helvetica-Bold"
FONT_BI = "Helvetica-Oblique"

PAGE_W, PAGE_H = letter    # 612 x 792 pt
M = 40                     # page margin


def main():
    if len(sys.argv) < 2:
        print("Usage: build_spec_sheet.py <insurance_data.json> [spec_sheet.pdf]")
        sys.exit(1)
    data = json.load(open(sys.argv[1]))
    out = sys.argv[2] if len(sys.argv) > 2 else "spec_sheet.pdf"
    ss = data["spec_sheet"]
    prop = data.get("property", {})

    c = canvas.Canvas(out, pagesize=letter)

    # ---- Header band ----
    band_h = 74
    c.setFillColor(MARINE)
    c.rect(0, PAGE_H - band_h, PAGE_W, band_h, fill=1, stroke=0)
    c.setFillColor(CORAL)
    c.rect(0, PAGE_H - band_h - 4, PAGE_W, 4, fill=1, stroke=0)
    c.setFillColor(CORAL)
    c.setFont(FONT_BB, 8)
    c.drawString(M, PAGE_H - 24, "HOMEOWNERS INSURANCE — QUOTE REQUEST")
    c.setFillColor(WHITE)
    c.setFont(FONT_H, 17)
    c.drawString(M, PAGE_H - 44, ss.get("headline", "Quote Request & Comparison Worksheet"))
    c.setFillColor(HexColor("#AFC3D4"))
    c.setFont(FONT_B, 9)
    addr = f'{prop.get("address", "")}, {prop.get("city", "")}, {prop.get("state", "")} {prop.get("zip", "")}'
    c.drawString(M, PAGE_H - 60, addr)

    y = PAGE_H - band_h - 16

    # ---- Instruction line ----
    c.setFillColor(GRAPHITE)
    c.setFont(FONT_BI, 8.5)
    for ln in simpleSplit(ss.get("instruction", ""), FONT_BI, 8.5, PAGE_W - 2 * M):
        c.drawString(M, y, ln)
        y -= 11
    y -= 6

    # ---- Two-column layout ----
    left_w = 235
    gap = 14
    right_x = M + left_w + gap
    right_w = PAGE_W - M - right_x
    top_y = y

    def label_value_block(title, rows, x, w, start_y, row_h=17.5, label_w=78):
        """Left-column block of label/value hairline rows. Returns new y."""
        yy = start_y
        c.setFillColor(TEAL)
        c.setFont(FONT_BB, 8)
        c.drawString(x, yy, title)
        yy -= 6
        c.setStrokeColor(TEAL)
        c.setLineWidth(1)
        c.line(x, yy, x + w, yy)
        yy -= 4
        for r in rows:
            val_lines = simpleSplit(str(r["value"]), FONT_BB, 7.5, w - label_w - 4)
            need = max(row_h, 9 * len(val_lines) + 8)
            c.setFillColor(STEEL)
            c.setFont(FONT_B, 7.5)
            c.drawString(x, yy - 10, r["label"])
            c.setFillColor(HexColor("#1A1A1A"))
            c.setFont(FONT_BB, 7.5)
            vy = yy - 10
            for vl in val_lines:
                c.drawString(x + label_w, vy, vl)
                vy -= 9
            yy -= need
            c.setStrokeColor(HAIRLINE)
            c.setLineWidth(0.5)
            c.line(x, yy + 3, x + w, yy + 3)
        return yy

    # Left column must finish above the footer zone. Measure first, then draw.
    footer_zone = 64
    left_floor = M + footer_zone

    def measure_block(rows, w, row_h=17.5, label_w=78):
        """Height the block will consume, matching label_value_block's own wrapping math."""
        h = 10  # title + rule + gap
        for r in rows:
            lines = simpleSplit(str(r["value"]), FONT_BB, 7.5, w - label_w - 4)
            h += max(row_h, 9 * len(lines) + 8)
        return h

    prop_rows = ss.get("property_block", [])
    cov_rows = ss.get("coverage_block", [])
    needed = measure_block(prop_rows, left_w) + 14 + measure_block(cov_rows, left_w)
    available = top_y - left_floor
    if needed > available:
        over = needed - available
        print(
            f"ERROR: left column needs {needed:.0f}pt but only {available:.0f}pt fits above the footer "
            f"({over:.0f}pt over). property_block has {len(prop_rows)} rows, coverage_block has {len(cov_rows)}. "
            f"Trim rows or shorten the longest values.",
            file=sys.stderr,
        )
        sys.exit(2)

    y_left = label_value_block("PROPERTY", prop_rows, M, left_w, top_y)
    y_left -= 14
    y_left = label_value_block("REQUESTED COVERAGE SPEC", cov_rows, M, left_w, y_left)
    if y_left < left_floor:
        print(f"ERROR: left column drew to {y_left:.0f}pt, below the footer floor at {left_floor}pt.", file=sys.stderr)
        sys.exit(2)

    # ---- Right: quote comparison grid ----
    qc = ss.get("quote_columns", {})
    headers = qc.get("column_headers", ["QUOTE 1", "QUOTE 2", "QUOTE 3"])
    rows = qc.get("rows", [])
    label_col = 92
    col_w = (right_w - label_col) / max(len(headers), 1)
    hdr_h = 20
    # available vertical space for the grid = down to the same footer floor the left column uses
    grid_bottom_limit = left_floor
    grid_row_h = min(46, (top_y - 8 - hdr_h - grid_bottom_limit) / max(len(rows), 1))
    if grid_row_h < 30:
        print(f"ERROR: quote grid rows would be {grid_row_h:.0f}pt tall; too many rows for one page.")
        sys.exit(2)

    gy = top_y - 8
    # header row
    c.setFillColor(MARINE)
    c.rect(right_x, gy - hdr_h, right_w, hdr_h, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont(FONT_BB, 7.5)
    for i, h in enumerate(headers):
        cx = right_x + label_col + i * col_w + col_w / 2
        c.drawCentredString(cx, gy - hdr_h + 6.5, h)
    gy -= hdr_h
    # body rows
    for i, rlabel in enumerate(rows):
        rh = grid_row_h
        if i % 2 == 1:
            c.setFillColor(ROWALT)
            c.rect(right_x, gy - rh, right_w, rh, fill=1, stroke=0)
        c.setFillColor(MARINE)
        c.setFont(FONT_BB, 7)
        for j, ll in enumerate(simpleSplit(rlabel, FONT_BB, 7, label_col - 8)[:3]):
            c.drawString(right_x + 4, gy - 11 - j * 8.5, ll)
        # cell borders
        c.setStrokeColor(HAIRLINE)
        c.setLineWidth(0.5)
        for j in range(len(headers) + 1):
            xx = right_x + label_col + j * col_w
            c.line(xx, gy - rh, xx, gy)
        c.line(right_x, gy - rh, right_x + right_w, gy - rh)
        gy -= rh
    # outer border
    c.setStrokeColor(MARINE)
    c.setLineWidth(1)
    c.rect(right_x, gy, right_w, (top_y - 8) - gy, fill=0, stroke=1)

    # ---- Footer ----
    fy = M + 34
    c.setStrokeColor(HAIRLINE)
    c.setLineWidth(0.5)
    c.line(M, fy + 10, PAGE_W - M, fy + 10)
    c.setFillColor(GRAPHITE)
    c.setFont(FONT_BI, 7.5)
    for ln in simpleSplit(ss.get("footer", ""), FONT_BI, 7.5, PAGE_W - 2 * M):
        c.drawString(M, fy, ln)
        fy -= 9.5
    c.setFillColor(STEEL)
    c.setFont(FONT_BI, 7)
    c.drawString(M, M - 14, "Educational decision support — not insurance advice. Only a carrier can quote.")

    c.showPage()
    c.save()

    # One page is guaranteed structurally: showPage() is called exactly once, and both
    # columns are bounds-checked against left_floor before drawing. A page-count check
    # after the fact can never fail and would read as a guarantee it does not provide.
    print(f"Wrote {out} (1 page)")


if __name__ == "__main__":
    main()
