# The Buyer Interview (one batch)

Asked after research, before synthesis. One message, all questions at once, numbered so the buyer can answer inline. 8-12 questions. Cut anything research or a sibling-skill run already answered and say which ones you cut and why ("the intel report shows a 2019 permit-verified roof — skipping the roof question").

## Phrasing rules

- Reference research facts where possible: "ALDOI shows FORTIFIED credits over 50% in your area — do you want the retrofit priced?"
- Offer answer shortcuts: "(a rough number is fine)", "(skip any you don't know)".
- Never ask about things neither the deck nor the spec sheet uses.
- Close the batch with: "Skip any you don't know. I'll use the standard defaults and label them."

## The question set

**Q0 (always first): After a hurricane, how large a check could you write for repairs without real hardship? (a rough number is fine)**
Drives the wind deductible choice — the single biggest coverage decision in a coastal market. Map: answer ≥ 5% of Cov A → 5% is on the table; ≥ 2% of Cov A → 2% default pick; below that → 1%. The chosen option gets `chosen: true` on slide 5 and the framing line quotes the buyer's answer back.

**Q1. Will this be your primary residence, a second home, or a rental?**
Occupancy changes carrier appetite and pricing. Goes on the spec sheet property block verbatim.

**Q2. Any homeowners or auto claims in the last 5 years? Any lapse in coverage?**
Claims history and lapses are top-tier pricing factors. "None / none" is a selling point — it goes on the spec sheet so every quote prices it in.

**Q3. Do you have an auto policy you could bundle, and would you consider moving it?**
Feeds the bundling lever. Multi-policy discounts are routine and cost nothing in coverage.

**Q4. How much stuff are you insuring — typical furnishings, or high-value items (jewelry, instruments, firearms, art) that need scheduling?**
Sets Cov C at 50% (typical) or 70% (heavy contents), and adds a scheduled-property line to coverage_lines if items exceed standard sub-limits (typically $1,500-2,500 per category).

**Q5. Net worth ballpark — under $500K, $500K-1M, or above? (sets the liability limit; skip if you prefer)**
Under $500K → $300K liability. $500K-1M → $500K. Above → $500K plus an umbrella note in coverage_lines ("umbrella policy recommended, quoted separately").

**Q6. Anything on the property that raises liability — pool, trampoline, dock, certain dog breeds, regular short-term guests?**
Any yes → bump liability one tier and add the exposure to the agent script ("confirm the policy covers X; some carriers exclude it").

**Q7. Do you want flood coverage quoted even though the lender may not require it?**
Zone X → recommend yes (preferred-risk NFIP is cheap precisely because risk is low, not zero). SFHA zones → mandatory anyway. Answer sets the FLOOD stat on slide 3 and the spec sheet line.

**Q8. Would you pursue a FORTIFIED roof certification or retrofit if the credit is large enough?**
Yes → lever 1 gets "pursuing" status, the agent script adds the credit-in-dollars question, and the spec sheet keeps the FORTIFIED row. No → lever stays informational.

**Q9. Home business, home office with client visits, or anything commercial run from the house?**
Yes → add an endorsement line to coverage_lines and an agent-script question; home business activity is excluded by default on HO-3.

**Q10. Water backup, service lines, equipment breakdown — do you want the cheap endorsements included in the spec, or quoted as add-ons?**
Default: water backup $10K in spec, others as add-on asks in the agent script.

**Q11 (only if no appraisal or list price exists): What's the purchase price or your target?**
Anchors the Cov A estimate until a rebuild-cost figure exists. Cov A is rebuild cost, not price — say so when asking.

## Answer-to-spec mapping and defaults

| Input | Answer | Spec effect |
|---|---|---|
| Storm-check tolerance (Q0) | ≥ 5% of Cov A | 5% wind ded. offered as a real option; buyer picks |
| | ≈ 2% of Cov A | 2% chosen (most common coastal pick) |
| | < 2% of Cov A | 1% chosen; framing notes the premium cost of that safety |
| | unknown | 2% shown as unchosen default; caveats slide flags "wind deductible not selected by buyer" |
| Occupancy (Q1) | any | verbatim on spec sheet; default: primary residence |
| Claims/lapses (Q2) | any | verbatim on spec sheet; default: "unknown — carrier will run CLUE" |
| Bundle (Q3) | yes | lever status "auto available to bundle" |
| Contents (Q4) | typical | Cov C 50% of Cov A, replacement cost endorsement |
| | high-value | Cov C 70% + scheduled-property row |
| Liability (Q5) | per tiers above | default: $300K |
| Exposures (Q6) | any yes | liability +1 tier, agent-script line added |
| Flood (Q7) | yes/no | slide 3 FLOOD stat YES/NO + spec sheet row; default: quote it |
| FORTIFIED (Q8) | yes | lever 1 "pursuing", credit question in script |
| Home business (Q9) | yes | endorsement row + script question |
| Endorsements (Q10) | default | water backup $10K in spec; ordinance/law 25% Cov A on any pre-2006 coastal home |

**Neutral defaults when unknown:** 2% wind deductible (unchosen), $2,500 AOP, Cov C 50% RC, $300K liability, $5K MedPay, water backup $10K, ordinance/law 25% on homes built before the current local code cycle (verify the adoption year for the jurisdiction rather than assuming 2006), flood quoted. Every defaulted line is identified on the caveats slide.

**Cov A rule:** Cov A is an estimated rebuild cost (local $/sqft × sqft, labeled est.), sanity-checked against the appraisal value when one exists. It is never the purchase price and never presented as final — the spec sheet instructs each agent to run their estimator and show the number.

## Inland profile

On `market_profile: "inland"`, three questions change:

- **Q1 deductible tolerance** asks about a major hail or wind event rather than a hurricane, and drives the flat all-other-perils deductible plus any separate wind/hail deductible the territory uses.
- **Mitigation credits** ask about the program that actually exists locally (impact-resistant roof class, hail-resistant shingle rating, alarm and water-shutoff credits) rather than FORTIFIED.
- **Flood** stays in the set. Inland flooding is the most under-insured peril there is, and a Zone X property still floods.

Everything else is unchanged. Do not ask a coastal question on an inland property; it wastes one of your 8-12 and signals the brief was not built for this house.

## Unattended runs

No user present means no interview. Do not wait. Apply every neutral default below, mark each resulting spec line as a default rather than a selection, set the deductible option to `chosen: "default"`, and add the caveat. The brief is still useful; it is just explicitly unchosen.
