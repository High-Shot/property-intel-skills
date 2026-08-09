# Valuation Methodology

Sales comparison approach, adjusted for owner-interview condition inputs. This file is the skill's brain. Follow it exactly; deviate only when a property genuinely breaks the model (unique waterfront, acreage with income use, major damage) and say so in the reconciliation narrative.

## 1. Comp selection

Ideal comp: closed sale, ≤1 mile (rural ≤5 mi), ≤6 months old, sqft within ±25%, year built within ±15 years, same style and story count, same school zone if possible.

Relax in this order when thin: time to 12 months → distance to 2 mi (rural 8) → sqft to ±35%. Note every relaxation in the reconciliation narrative.

Use 3-5 comps in the grid (deck fits 5 best; pick the strongest 5 if more). Fewer than 3 usable: confidence = Low, widen range per §6, state the shortage plainly.

## 2. Adjustment schedule (percent-of-value based)

Adjust the COMP toward the SUBJECT. Comp superior → subtract; comp inferior → add. Rates are percentages of the comp's sold price unless noted. These are defaults; if research surfaces local paired-sales evidence (e.g., two near-identical sales differing only in garage), prefer the local evidence and note it.

| Item | Rate | Notes |
|---|---|---|
| Market/time | Local median $/sqft trend, applied monthly from sold date to today | E.g., market up 4%/yr → comp sold 6 mo ago gets +2%. Cap at ±8% total; older comps get less weight instead. |
| Location/street | ±3-8% | Busy road, power lines, backs to commercial: comp on a quiet street, subject on a busy road: the subject is inferior, so the comp is adjusted DOWN toward the subject, -3 to -8%. Waterfront handled separately: ±15-25%, use local paired sales if at all possible. |
| Site/lot | ±2% per acre difference beyond 0.25 ac, cap ±8% | Usable land only; wetlands and easement-covered land at half rate. |
| GLA (sqft) | 35-45% of the market $/sqft × sqft difference | E.g., market $200/sqft → adjust at $70-90/sqft. Never adjust at full $/sqft; marginal sqft is worth less than average sqft. |
| Year built / effective age | 0.5% per year of age difference, cap ±10% | Skip if condition adjustments already capture the renovation gap; never double count age and condition. |
| Bedrooms | $3-8K per bed if sqft-adjusted already, else fold into GLA | Only when bed count changes utility (2 vs 3 matters, 4 vs 5 rarely does). |
| Bathrooms | 1-2% per full bath, half that per half bath | |
| Garage | 1.5-3% per bay difference | Carport = half a bay. |
| Pool | +3-6% in Gulf Coast/Sun Belt, 0 to +2% elsewhere | In-ground only; above-ground = $0. |
| Outbuildings/extras | Depreciated contribution, not cost | Workshop, dock, generator, solar (owned only, leased = $0 or negative). |
| Condition/updates (comp-visible) | ±5-15% | From listing remarks and photos: "fully renovated" comp vs original subject → subtract 5-15%. Coarse; the interview refines the subject side in §4. |

**Net adjustment discipline:** if a comp's gross adjustments exceed 25% or net exceeds 15% of its sold price, it is a weak comp — keep it only if comps are thin, and cut its weight in half.

## 3. Weighting

Score each comp 1-5 on: similarity (after adjustments — lower gross adjustment = higher score), recency, proximity, and source tier (Tier 1 = 5, Tier 2 = 3, Tier 3 = never a comp). Weight = product of the four scores, normalized to sum to 1. Round to 0.05 steps for the deck. Base indicated value = Σ(adjusted value × weight).

## 4. Subject condition adjustments (from the interview)

Applied once to the base indicated value, not per comp. Dollar guidance is in `interview.md` §mapping. Principles:

- Deferred maintenance adjusts at cure cost (roof replacement quote midpoint, HVAC replacement, etc.), prorated by remaining life where partial.
- Updates add at depreciated contribution, roughly 50-70% of renovation cost for kitchens/baths under 5 years old, sliding to 0 at 15+ years.
- Defects (foundation, moisture, structural) adjust at cure cost × 1.25 (buyers discount beyond the repair bill). If cure cost is unknown, use the range from interview.md and label "est."
- Cap total condition adjustments at ±20% of base indicated value. Beyond that the property is a fixer or a rebuild and the sales comparison model is straining — say so.

Final point value = base indicated value + Σ condition adjustments, rounded to the nearest $1,000.

## 5. AVM cross-check

Collect Zestimate, Redfin Estimate, Realtor.com estimate. The AVM band = min to max. It is a sanity check, never an input. If the point value falls outside the band by more than 5%, re-verify the two heaviest comps' sold prices and the biggest adjustments before publishing, then explain the divergence in one or two sentences in the reconciliation narrative (AVMs cannot see condition, so a dated interior or a new roof routinely justifies divergence).

## 6. Confidence rubric and range width

| Confidence | Criteria (all must hold) | Range width around point value |
|---|---|---|
| High | ≥4 comps, ≥3 of them Tier 1, all ≤6 mo, net adjustments ≤10%, buyer walked the property | ±4% |
| Medium | ≥3 comps, mixed tiers OK, ≤12 mo, net adjustments ≤15% | ±7% |
| Low | <3 strong comps, or heavy relaxation, or photos-only condition inputs, or interview skipped | ±10-12% |

Interview skipped, unattended run, or mostly "don't know": drop one level from whatever the comp data alone would support. Fewer than 3 usable comps: Low, regardless of interview quality.

## 7. Sensitivity cases

- Low case: point value with every "assumed" condition input resolved unfavorably and the weakest comp removed.
- High case: assumed inputs resolved favorably, market/time adjustment at the top of its range.
Both render on the reconciliation slide with a one-line driver each.

## 8. Value vs list verdict

- Point value ≥ list + 3%: "Priced below value" — anchor near list, move fast.
- Within ±3%: "Priced at value" — negotiate on condition findings, not price theory.
- List > point value by 3-8%: "Priced above value" — anchor at point value, show the comp grid.
- List > point value by >8%: "Significantly overpriced" — anchor at range low; be ready to walk.

Anchor points for the deck: range low (walk-away ceiling for a discipline buyer), point value (fair), and the number at which the buyer is paying the seller's premium (list). The bottom line is one sentence in the buyer's actual situation, not a tagline.

## 9. Never do

- Never blend AVMs into the comp math.
- Never invent a comp, a sold price, or a sold date.
- Never present a point value without range + confidence.
- Never double count age and condition, or sqft and bedrooms.
- Never let the interview inflate value on unverified owner claims ("seller says new roof") — label those "reported, unverified" and adjust at half weight until verified.
