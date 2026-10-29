# Rates and Anchors

Every rate, program name, statutory figure, and dollar anchor this skill applies without researching it. Each carries an `as_of` date.

**Standing rule.** Any anchor older than six months at run time must be re-verified during Stage 2, or the figure it produces must be labeled stale on the caveats slide. Insurance markets move faster than the other two skills' domains — treat this file as the shortest-lived reference in the family.

Last full review: **2026-08**. Real-quote anchors added **2026-10**.

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

Real quotes outrank every published anchor in this file. When `property_facts.json` holds `insurance.quotes[]` for the address, the premium range comes from them. When it holds quotes for a nearby property in the same territory and protection class, the rate below is a basis line on slide 8, cited as "carrier quote, <month year>".

| Anchor | Value | as_of | Verify |
|---|---|---|---|
| Total annual premium per $1K Cov A, HO-3, Fairhope (Baldwin territory 5, protection class 3), masonry veneer, $20K flat hurricane / $2,500 AOP | $8.62 - $8.81 (2 quotes, one carrier, 1994 and 2007 builds, Cov A $430K-$450K) | 2026-10 | Small sample from one carrier. Add each new quote; re-verify after 6 months |
| Hurricane deductible form | Some admitted carriers here quote a **flat dollar** hurricane deductible ($20,000 on $430K-$450K Cov A = 4.4-4.7%), not a percentage | 2026-10 | Never assume 2% means 2% of Cov A; read the quote |
| Carrier-default coverages seen on unspecified quotes | Cov C 25% of Cov A, MedPay $1,000, water backup $5,000, animal liability capped at $5,000, home day care excluded | 2026-10 | These are why the spec sheet exists: the request asks for 50% / $5,000 / $10,000 explicitly |
| Roof coverage endorsement | $25,000-$30,000 roof limit endorsement on a shingle roof (included on one, +$100 on another) | 2026-10 | Ask whether it caps roof payment; a full re-roof on a larger two-story can exceed it |
| Rating inputs on the quote | Territory, protection class, construction, year built printed on the declaration | 2026-10 | Check year built and roof year on every quote against the cache |

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
