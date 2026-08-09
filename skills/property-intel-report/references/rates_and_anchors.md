# Rates and Anchors

Every rate, percentage, and dollar figure this skill applies without researching it. Each carries an `as_of` date.

**Standing rule.** Any anchor older than six months at run time must be re-verified during Stage 2, or the figure it produces must be labeled stale on the caveats slide. Do not silently apply a two-year-old rate table to a live client deck.

Last full review: **2026-08**.

---

## 1. Mortgage

| Anchor | Value | as_of | Verify |
|---|---|---|---|
| 30-yr fixed rate source | Freddie Mac PMMS, weekly | 2026-08 | **Every run.** Never cache. |
| PMMS mirror | FRED series `MORTGAGE30US` | 2026-08 | If the series ID 404s, use any named weekly national average and cite it |
| PMI default | 0.70%/yr of loan balance, LTV > 80% | 2026-08 | Annually. Range 0.30%–1.00% by credit tier |
| PMI auto-termination | 78% LTV (Homeowners Protection Act of 1998) | statutory | Only on a change in federal law |

The per-$100K payment shortcut in `calculations.md` §1 spans 5.00%–7.50%. **If the current PMMS rate falls outside that band, do not extrapolate from the table — compute PMT directly from the formula.** The table is a sanity check, not the method.

---

## 2. Property tax

| Anchor | Value | as_of | Verify |
|---|---|---|---|
| Homestead exemption lift on sale | +25% to 35% | 2026-08 | Per state. Use the parcel's actual millage when retrievable; this is the fallback only |
| Tax growth, 5-yr projection | 6%/yr | 2026-08 | Annually. **Override with the parcel's actual trailing 5-yr growth whenever it is higher** |

---

## 3. Insurance orientation bands

**`property-insurance-brief` owns premiums.** Use these only when no sibling run exists, and label every figure est.

| Anchor | Value | as_of | Verify |
|---|---|---|---|
| Homeowners, low-risk inland | $50–80 /mo per $100K dwelling | 2025-Q4 | **Stale — re-verify.** Coastal and wildfire rates moved sharply after 2022 |
| Homeowners, tornado-belt inland | $80–120 /mo per $100K | 2025-Q4 | Stale — re-verify |
| Homeowners, coastal non-named-storm | $100–150 /mo per $100K | 2025-Q4 | Stale — re-verify |
| Homeowners, wildfire WUI | $100–200 /mo per $100K | 2025-Q4 | Stale — re-verify |
| Wind, tier 1 immediate coast | $200–500 /mo per $100K | 2025-Q4 | Stale — re-verify |
| Wind, tier 2 inland coastal | $100–250 /mo per $100K | 2025-Q4 | Stale — re-verify |
| Wind, tier 3 lower exposure | $50–150 /mo per $100K | 2025-Q4 | Stale — re-verify |
| Flood, NFIP | **Not priced by zone.** See below | 2026-08 | — |
| Replacement cost | $150–250 /sqft, 1980s–2000s construction | 2025-Q4 | Stale — materials and labor inflation. Re-verify locally |

**Flood.** NFIP Risk Rating 2.0 (October 2021) prices per structure — elevation, distance to water, rebuild cost, flood frequency — not by zone letter. The zone determines whether coverage is *mandatory* for a federally backed mortgage; it does not determine cost. Report the zone for the mandate, give cost as an orientation band pending a quote, and never reproduce an X / AE / VE price table.

Apply homeowners rates to **replacement cost**, not market value.

---

## 4. Growth rates, 5-year projection

| Anchor | Value | as_of | Verify |
|---|---|---|---|
| Insurance growth, hurricane / wildfire zones | 7%/yr | 2025-Q4 | Annually. Conservative against the 8–12% coastal average observed 2020–2025; raise if the local trend is sharper |
| Insurance growth, elsewhere | 4%/yr | 2025-Q4 | Annually |
| Tax growth | 6%/yr | 2026-08 | See §2 |

The 8–12% coastal observation is window-bounded to 2020–2025. It is not a forecast.

---

## 5. Comp normalization

Applied in `calculations.md` §5. These are appraiser conventions, not measured market rates; they move slowly but they are regional.

| Strip | Value | as_of | Verify |
|---|---|---|---|
| Waterfront (creek, lake, bay direct) | -10% to -20% | 2026-08 | Regional. Widen in premium waterfront markets |
| Newer build | -5% per ~15 years newer | 2026-08 | Annually |
| Larger lot | -3% per acre over 1 | 2026-08 | Regional |
| Recent remodel | -10% to -15% | 2026-08 | Annually |
| Fixer discount | -5% to -25% by listing language and cut history | 2026-08 | Annually |

Strips compound. See `calculations.md` §5.

---

## 6. Offer strategy

| Anchor | Value | as_of |
|---|---|---|
| Opening offer low | fair_value_high × 0.90 | 2026-08 |
| Opening offer high | fair_value_high × 0.94 | 2026-08 |
| Competing inventory band | ±15% of list price, same ZIP | 2026-08 |

---

## 7. Diligence budget

Every line item and archetype total in `diligence_budget_template.md` is nominal and dated **2025-Q4**. Treat the whole file as one anchor: re-verify regional pricing annually, and state the vintage on the diligence slide when the figures are more than a year old.

---

## 8. Deck metadata

Never hardcode a date. `prepared_label` and any "PREPARED &lt;MONTH YEAR&gt;" string is generated from the run date at synthesis time. Schema examples use `<TODAY>` as the placeholder; if you see a literal month and year in a schema example, it is a defect, not a default.
