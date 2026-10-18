# Rates and Anchors

Every rate, percentage, and dollar figure this skill applies without researching it. Each carries an `as_of` date.

**Standing rule.** Any anchor older than six months at run time must be re-verified during Stage 2, or the figure it produces must be labeled stale on the caveats slide.

Last full review: **2026-08**.

---

## 1. Adjustment schedule

Appraiser conventions from `methodology.md` §2. Regional, and they move slowly.

| Adjustment | Value | as_of | Verify |
|---|---|---|---|
| Location (street, view, nuisance) | ±3-8% of value | 2026-08 | Regional. Widen in markets with sharp micro-location premiums |
| Site / lot size | ±2% per acre of difference | 2026-08 | Regional |
| GLA (living area) | 35-45% of local $/sqft per sqft of difference | 2026-08 | Annually. The ratio, not the full $/sqft — this is the most commonly over-applied adjustment |
| Age / effective age | 0.5%/yr of value | 2026-08 | Annually |
| Bedroom count | $3-8K per bed | 2025-Q4 | Annually. Scale with price tier |
| Bathroom count | 1-2% of value per bath | 2026-08 | Annually |
| Garage | 1.5-3% of value per bay | 2026-08 | Regional |
| Pool | +3-6% in Gulf Coast / Sun Belt, 0 to +2% elsewhere | 2026-08 | Regional. Can be negative in cold markets |

**Adjustment discipline.** Gross adjustments over 25% or net over 15% mean the comp is too dissimilar. Drop it or explain it.

---

## 2. Condition adjustments (interview-derived)

Full mapping in `interview.md`. **Vintage 2025-Q4, calibrated to a $250-600K single-family home in a Gulf Coast market.** In another region or price tier, scale these and say you did.

| Item | Value | Verify |
|---|---|---|
| Roof, ≤5 yrs verified | +$3-6K | Annually |
| Roof, 12+ yrs verified | −(replacement midpoint × age ÷ expected life) | Annually |
| Roof replacement midpoint, asphalt | $12-20K, ~17-yr expected life | 2025-Q4 — re-verify locally |
| HVAC, 13+ yrs | −$6-12K per system | 2025-Q4 |
| Water heater, aged | −$1.5-2.5K | 2025-Q4 |
| Flooring, new quality | +$5-12K | 2025-Q4 |
| Foundation defect | −$15-40K | 2025-Q4 — the widest band here; get a structural quote before publishing a point |
| Workshop / outbuilding | +$8-25K | 2025-Q4 |
| Whole-house generator | +$5-10K | 2025-Q4 |
| Dock (waterfront) | +$15-40K | 2025-Q4 — regional, and permit-dependent |
| Insulated window pane (walked) | −$300-600 each | 2026-10 est. — re-verify locally |
| Exterior door and frame (walked) | −$1,500-3,500 installed | 2026-10 est. — re-verify locally |
| Carpet, installed (walked) | −$3.50-6.00 /sq ft | 2026-10 est. — re-verify locally |
| Porch boards / fence sections / siding pieces (walked) | −$300-800 / −$150-300 per section / −$500-1,500 | 2026-10 est. — re-verify locally |
| Minor rot at slab or sills (walked) | −(cure × 1.25), cure $1-3K | 2026-10 est. — moisture defect multiplier per methodology §4 |

**Cap.** Total condition adjustments are capped at ±20% of the base indicated value. Past that, the comps are wrong, not the condition.

**Neutral assumptions when unknown:** roof 10 yrs, HVAC 8 yrs, kitchen and baths consistent with year built and price tier, no defects, no extras. Each assumed item renders tagged "assumed."

---

## 3. Confidence and range width

| Confidence | Range width | Applies when | as_of |
|---|---|---|---|
| High | ±4% | 4-5 comps, mostly tier 1, recent, buyer walked the property | 2026-08 |
| Medium | ±7% | 3-4 comps, mixed tiers, or an interview with gaps | 2026-08 |
| Low | ±10-12% | Thin or stale comps, skipped interview, or unattended run | 2026-08 |

Fewer than 3 usable comps forces Low and a range of at least ±15%, regardless of interview quality.

---

## 4. Verdict thresholds

| Verdict | Trigger | as_of |
|---|---|---|
| Priced at value | List within 3% of point value | 2026-08 |
| Priced above value | List 3-8% above point | 2026-08 |
| Priced well above value | List more than 8% above point | 2026-08 |
| Priced below value | List below point | 2026-08 |

Verdict strings are an enum. Use the exact casing in `methodology.md` §8 in every field that carries one — `vs_list_verdict` and `verdict_headline` must match character for character.

---

## 5. Deck metadata

Never hardcode a date. `report_date`, source pull dates, and data-release labels are generated from the run date at synthesis time. A literal month and year in a schema example is a placeholder, not a default.
