# Rates and Anchors

Every rate, program name, statutory figure, and dollar anchor this skill applies without researching it. Each carries an `as_of` date.

**Standing rule.** Any anchor older than six months at run time must be re-verified during Stage 2, or the figure it produces must be labeled stale on the caveats slide. Insurance markets move faster than the other two skills' domains — treat this file as the shortest-lived reference in the family.

Last full review: **2026-11**.

---

## 1. Coverage defaults (neutral, when the buyer does not choose)

From `interview.md`. Each is a **default**, not a recommendation, and renders marked as such.

| Line | Default | as_of | Verify |
|---|---|---|---|
| Wind deductible (coastal) | 2% standing rule, never asked; written `chosen: "default"` | 2026-10 | Per territory — quote the steps carriers actually write |
| All-other-perils deductible | $2,500 | 2025-Q4 | Annually |
| Cov C (contents) | 50% of Cov A, replacement cost | 2026-08 | Standard across most HO-3 forms |
| Liability | $300K | 2026-08 | Scale to net worth, see §2 |
| MedPay | $5,000 | 2026-08 | Rarely varies |
| Water backup | $10,000 | 2025-Q4 | Annually |
| Ordinance / law | 25% | 2026-08 | Applies to homes built before the jurisdiction's current code cycle. **Verify the adoption year** rather than assuming 2006 |
| Flood | Quoted only when the lender requires it (SFHA zones A/V); zone always reported | 2026-10 | — |

## 2. Liability by net worth

| Net worth | Liability limit | as_of |
|---|---|---|
| Under $500K | $300K | 2026-08 |
| $500K – $1M | $500K | 2026-08 |
| Over $1M | $1M, and price an umbrella | 2026-08 |

## 3. Contents sub-limits

| Category | Typical sub-limit | as_of | Verify |
|---|---|---|---|
| Jewelry, furs, firearms, silverware | $1,500 – $2,500 per category | 2025-Q4 | Annually. Schedule anything above the limit |

---

## 4. Territory specifics

Everything below is **one territory's** detail. Never apply it to another state. Gather the equivalent per `data_sources.md` when working a new market.

### Coastal Alabama (worked example)

| Anchor | Value | as_of | Verify |
|---|---|---|---|
| Surplus lines premium tax | 6% | 2025-Q4 | **Statutory — re-verify.** Changes by legislation |
| Minimum earned premium, surplus lines | 25% typical | 2025-Q4 | Market convention, not statute. Confirm per quote |
| Residual market / wind pool | Alabama Insurance Underwriting Association (AIUA), Baldwin and Mobile counties | 2025-Q4 | Program names and eligibility maps change |
| State mitigation program | Strengthen Alabama Homes (grant), IBHS FORTIFIED (certification) | 2025-Q4 | **FORTIFIED tiers have been revised before.** Confirm current tier names and requirements |
| Wind mitigation credit | Material reductions filed in coastal cities | 2025-Q4 | **Cite the actual filing and figure, not a remembered percentage.** Filed schedules change annually |
| Regulator comparison tool | ALDOI ComparePremiums | 2025-Q4 | Tools get retired or relocated |
| State average, $300K dwelling | Cite the named rate study and its year | — | Annual studies. Never quote a figure without naming the study |
| Guaranty fund | Does not cover surplus-lines carriers | statutory | Only on a change in state law |

### Real-quote anchors (coastal Alabama)

A real quote is the best anchor this file can hold. Each row is one quote, expressed as total cost per $1,000 of Cov A so it transfers to a house of a different size in the same territory and protection class. Expire each row six months after its quote date.

| Territory / PPC | Construction | Cov A | Wind ded. | AOP | Total/yr | $ per $1K Cov A | Quote date | Expires |
|---|---|---|---|---|---|---|---|---|
| Fairhope territory 5 / PPC 3 | Masonry veneer, 1994 | $430,000 | $20,000 flat hurricane | $2,500 | $3,790 | $8.81 | 2026-10-08 | 2027-04 |
| Fairhope territory 5 / PPC 3 | Masonry veneer | (second quote, same carrier) | $20,000 flat hurricane | $2,500 | — | $8.62 | 2026-10 | 2027-04 |

Both quotes came from one carrier on carrier defaults (Cov C 25%, MedPay $1,000, water backup $5,000, animal liability $5,000, no ordinance or law). A quote at the full spec in this file's §1 prices higher; say so beside the anchor. One carrier is not a market: the ladder in §9 treats these as rung 2 for any other address, never as the range.

---

## 5. Flood

| Anchor | Value | as_of |
|---|---|---|
| NFIP pricing method | Risk Rating 2.0 (effective October 2021) — per structure: elevation, distance to water, rebuild cost, flood frequency | 2026-08 |
| Zone's role | Determines the **mandatory purchase** requirement for federally backed mortgages. Does **not** determine price | 2026-08 |
| Legacy terms | "Preferred Risk Policy" and "preferred-risk" pricing were phased out under Risk Rating 2.0. Do not use the term | 2026-08 |

Never price flood from a zone table. Report the zone for the mandate, give cost as an orientation band pending a quote, and say it is pending.

---

## 6. Replacement cost (Cov A anchor)

| Anchor | Value | as_of | Verify |
|---|---|---|---|
| Rebuild cost, 1980s–2000s construction | $150–250 /sqft | 2025-Q4 | **Stale — re-verify locally.** Materials and labor inflation |
| Fairhope, AL check | ~$160 /sqft landed within 0.5% of a carrier's Cov A ($432K est. vs $430K carrier) | 2026-10 | One data point. Re-verify each run |

Cov A is always labeled est. until a carrier replacement-cost estimator runs. It anchors to rebuild cost, never to market value or purchase price. If `property_facts.json` carries a `value` block from `property-appraisal`, that is the market value — it is not Cov A, and using it as Cov A over-insures on an expensive lot and under-insures on a cheap one.

---

## 7. Roof age

| Anchor | Value | as_of | Verify |
|---|---|---|---|
| Common carrier threshold | ~10 years | 2025-Q4 | **Carrier- and state-specific.** Verify against the actual quotes in hand |

Watch for an RCV roof headline with an age-triggered ACV roof endorsement attached. That pattern is the single most common gap between what a quote says and what it pays.

---

## 8. Deck metadata

Never hardcode a date. `prepared_label`, footer dates, and rate-study years come from the run date or from the study actually cited. A literal month and year in a schema example is a placeholder, not a default.


---

## 9. The premium ladder

Slide 8's range is built from the highest rung available and shows its arithmetic. Lower rungs are context, never a competing number.

| Rung | Source | How it becomes a number |
|---|---|---|
| 1 | Real quote on this address | Total cost, normalized to the spec (add the cost of spec lines the quote omitted, subtract endorsements the spec did not ask for, name each) |
| 2 | Real quote in the same territory and protection class (§4) | $ per $1K Cov A × this house's Cov A, adjusted for construction and roof age differences, named |
| 3 | State DOI premium comparison for a matching profile | DOI figure scaled by Cov A ÷ the DOI profile's dwelling value |
| 4 | Named state-average study | Study figure, labeled as a state average |

Write the rung used into `premium_range.ladder` (see `data_schema.md`). A rung-3 or rung-4 range on a coastal property is wide by nature; say so on the slide instead of narrowing it.
