# The Buyer Interview (one batch)

Asked after research, before synthesis. One message, all questions at once, numbered so the buyer can answer inline. **3 questions max.** Cut anything research or a sibling-skill run already answered and say which ones you cut and why.

## Standing rules (never asked)

- **Wind deductible: 2%, every property.** Do not ask about storm-day cash. Write the 2% option as `chosen: "default"`, quote 1% and 5% beside it for comparison, and add the caveat "Wind deductible set at the standard 2% default; 1% and 5% quoted for comparison." On an inland profile the equivalent is the $2,500 AOP default.
- **Flood: quoted only when the lender requires it** (the parcel sits in a Special Flood Hazard Area, zones A or V). Outside the SFHA, slide 6 still reports the zone and First Street score, the FLOOD stat reads NO, and the recommendation says flood is not quoted unless the lender requires it, with a one-line note that an NFIP quote is one call away.

## Phrasing rules

- Offer answer shortcuts: "(yes/no is fine)", "(skip any you don't know)".
- Never ask about things neither the deck nor the spec sheet uses.
- Close the batch with: "Skip any you don't know. I'll use the standard defaults and label them."

## The question set

**Q1. Any homeowners or auto claims in the last 5 years, or a gap in coverage?**
Claims history and lapses are top-tier pricing factors. "None / none" goes on the spec sheet so every quote prices it in.

**Q2. Anything that changes liability or contents — pool, trampoline, any dogs (breed matters), a home business, or high-value items (jewelry, firearms, art) to schedule?**
Any liability exposure → liability up one tier plus an agent-script line. High-value items → Cov C 70% plus a scheduled-property row. Home business → endorsement row plus a script question.

**Q3 (optional, skip-friendly): Net worth ballpark — under $500K, $500K-1M, or above?**
Sets the liability limit. Skipped → $300K default.

Not asked, handled by defaults or research: occupancy (primary residence unless the conversation says otherwise), bundling (agent-script ask), FORTIFIED interest (lever 1 stays informational; the agent script asks for the credit in dollars), water backup and ordinance/law (default endorsements).

## Answer-to-spec mapping and defaults

| Input | Answer | Spec effect |
|---|---|---|
| Wind deductible | standing rule | 2% `chosen: "default"`; 1% and 5% quoted beside it; caveat line required |
| Flood | standing rule | Quoted only in an SFHA (A/V zones); otherwise FLOOD stat NO and no NFIP line on the spec sheet |
| Occupancy | not asked | Primary residence unless the conversation says otherwise |
| Claims/lapses (Q1) | any | verbatim on spec sheet; default: "unknown — carrier will run CLUE" |
| Exposures / contents (Q2) | liability exposure | liability +1 tier, agent-script line added |
| | high-value items | Cov C 70% + scheduled-property row |
| | home business | endorsement row + script question |
| | none / skipped | Cov C 50% of Cov A, replacement cost |
| Net worth (Q3) | per tiers in rates_and_anchors.md §2 | default: $300K |
| Bundling, FORTIFIED | not asked | Lever status "ask the agent"; agent script asks for both prices and the FORTIFIED credit in dollars |
| Endorsements | not asked | water backup $10K; ordinance/law 25% Cov A on homes built before the current local code cycle |

**Neutral defaults when unknown:** 2% wind deductible (default), $2,500 AOP, Cov C 50% RC, $300K liability, $5K MedPay, water backup $10K, ordinance/law 25% on homes built before the current local code cycle (verify the adoption year for the jurisdiction rather than assuming 2006), flood quoted only when lender-required. Every defaulted line is identified on the caveats slide.

**Cov A rule:** Cov A is an estimated rebuild cost (local $/sqft × sqft, labeled est.), sanity-checked against the appraisal value when one exists. It is never the purchase price and never presented as final — the spec sheet instructs each agent to run their estimator and show the number.

## Carrier intake answers (not asked; harvested)

Page 2 of the spec sheet answers the carrier's own intake form. Fill it without adding questions:

| Intake field | Where it comes from | If unknown |
|---|---|---|
| Year built, sqft, stories, acres, construction, foundation | Cache `structure` (tier 1 beats listing) | CONFIRM |
| Roof type, roof year, roof shape | Permit for year; listing photos or aerial imagery for shape (hip vs gable) | CONFIRM. Never guess roof shape; it is a major wind rating factor |
| Wind mitigation level, shutters | FORTIFIED certificate lookup; listing copy | "None" only when a certificate search came back empty; otherwise CONFIRM |
| Heat/AC year, water heater year and location, tankless | Listing, permits, inspection report | CONFIRM |
| Plumbing material, wiring, panel brand | Inspection report only | CONFIRM. Flag Federal Pacific, Zinsco, fuse panels, polybutylene, galvanized supply, aluminum branch wiring as rate or eligibility risks |
| Detached structures, pond, garage | Parcel GIS, aerials, listing | CONFIRM. A detached shop means Cov B at 10% may be low; say so |
| Pool, trampoline, dogs | Q2 | "Unknown" |
| Prior claims | Q1 | "Unknown, carrier will run CLUE" |
| Mortgaged | `buyer.financing` or the conversation | "Yes" for any financed purchase |
| Occupancy | Conversation | Primary |

If the buyer has walked the house or has an inspection report, read it before building page 2; it answers most CONFIRM rows. After the walkthrough, one optional follow-up is allowed: "Did you see the electrical panel brand, the water heater's age and location, or the pipe material? (skip any)". It does not count against the 3-question cap only because the house has now been seen.

Never put SSN, driver's license number, or date of birth on the sheet or in the cache, even when the carrier form asks for them. Those go into the agent's secure portal.

## Inland profile

On `market_profile: "inland"`:

- The standing deductible rule is the $2,500 flat AOP deductible plus any separate wind/hail deductible the territory uses, shown in dollars.
- Mitigation levers name the program that actually exists locally (impact-resistant roof class, hail-resistant shingle rating, alarm and water-shutoff credits) rather than FORTIFIED.
- The flood rule is the same: quoted only when the lender requires it.

Do not ask a coastal question on an inland property.

## Unattended runs

No user present means no interview. Do not wait. Apply every neutral default below, mark each resulting spec line as a default rather than a selection, set the deductible option to `chosen: "default"`, and add the caveat. The brief is still useful; it is just explicitly unchosen.
