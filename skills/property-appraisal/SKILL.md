---
name: property-appraisal
description: "Estimate the market value of a residential property using a sales comparison appraisal with owner-interview condition adjustments. Use this skill whenever the user asks what a house is worth, asks to appraise a property, asks for a valuation, a CMA, a fair value estimate, or asks 'is this house priced right', 'what should I offer based on value', 'what would this appraise for', or provides an address with intent to value it. If the user wants a full buyer's brief rather than just a number, run property-intel-report instead; if they want coverage or premiums, run property-insurance-brief. Companion to property-intel-report: that skill covers diligence and risk, this one produces the value number. Produces a 9-slide PowerPoint valuation brief with a comp grid, adjustment schedule, condition adjustments from a one-batch buyer interview, reconciliation, AVM cross-check, and a value-vs-list verdict, plus an interactive comp explorer page (map, $/sq ft strip, comp toggles that recompute the value)."
---

# Property Appraisal (Buyer's Valuation Brief)

This skill produces a defensible market-value estimate for a residential property, packaged as a 9-slide PowerPoint the buyer can use to decide whether the list price is right and what to anchor on.

It is a companion to `property-intel-report`. That skill answers "what am I buying and what could go wrong." This skill answers "what is it actually worth." Do not duplicate that skill's content (climate, schools, diligence budget, question scripts) here.

This is a valuation estimate, not a licensed appraisal. The deck says so. Never present a point value without a range and a confidence rating.

## The 5-Stage Pipeline

```
INTAKE  →  RESEARCH  →  INTERVIEW  →  SYNTHESIZE  →  RENDER
(address)  (comps +     (one batch    (appraisal     (PPTX +
            records)     of questions)  JSON)         explorer)
```

Run in order. The interview comes AFTER research so the questions can reference specific facts ("records show a 2004 roof permit — has it been replaced since?") and skip anything research already answered.

## Stage 1: Intake

Required: full street address with city, state, ZIP. Parse from a Zillow/Redfin/MLS URL if provided. If the user gives a list price or target price, capture it. That is all — everything else comes from research and the interview.

## Stage 2: Research

**First, check the shared cache.** Before any web call, look for `property_facts.json` per `references/property_facts.md`. If a sibling skill already researched this address, reuse every non-stale field, research only the gaps, and say once in the run summary how many facts you reused. Merge what you learn back into the cache at the end of this stage.

Then research the gaps with parallel `WebSearch` + `WebFetch`. Target 25-35 tool calls on a cold start, far fewer when the cache is warm. If a dedicated deep-research tool exists on this runtime (for example `launch_extended_search_task`) you may use it instead; do not assume it exists. The full source list and reliability tiers are in `references/data_sources.md`. Priorities in order:

1. **Subject property record**: sqft, beds/baths, year built, lot, garage, parcel ID, last sale price and date.
2. **Sold comps (the core)**: screen 5-8 closed sales, then carry the **strongest 3-5** into the grid (the deck fits 5). Criteria: within ~1 mile (rural: 3-5 miles), sold in the last 6 months (stretch to 12 if thin), similar sqft (±25%), age (±15 yrs), and style. For each: sold price, sold date, sqft, lot, beds/baths, condition clues from listing remarks. Record the SOURCE and TIER for every sold price (see data_sources.md). Never use an AVM estimate as a comp. Say in the reconciliation how many you screened and why you dropped the ones you dropped. If fewer than 3 survive screening, take the thin-comp path in `references/data_schema.md` rather than loosening the criteria to reach a count.
   Record **coordinates** for the subject and every comp you carry (lat/lng to 5 decimals) and for each sale you screen out. Sources and tiers are in `references/data_sources.md` § Coordinates. Coordinates drive the explorer map only; they never enter the value math. Keep the strongest 2-5 rejected sales with a one-line reason each in `screened_out`, so the buyer can see what was considered and why it was dropped.
3. **Active/pending competition**: 2-3 listings, for ceiling context only.
4. **AVM cross-checks**: Zestimate, Redfin Estimate, Realtor.com estimate. Sanity band only, clearly labeled, never blended into the comp math.
5. **Market condition**: ZIP or city median $/sqft trend, months of inventory, median days on market. Used for the time adjustment.

County portal quirks (which assessor and GIS sites resist automated fetch, and what to do about it) are in `references/data_sources.md`. Check there before concluding a county figure is unavailable.

## Stage 3: Interview (one batch, mandatory)

Ask the buyer ONE batch of questions before synthesizing. Never drip-feed. The full question set, phrasing guidance, and the answer-to-dollar-adjustment mapping are in `references/interview.md`.

Rules:
- 8-12 questions max. Cut any question research already answered, and say so ("permits show the roof was replaced in 2021, so I'm skipping that one").
- Reference research facts in the questions where possible.
- First question is always: "Have you walked the property, or are you working from photos?" This sets the condition-input confidence.
- If the buyer answers "I don't know" to something, proceed with the neutral assumption from interview.md and label the resulting adjustment as assumed.
- If the buyer skips the interview entirely, proceed with all-neutral assumptions, drop confidence one level, and say so on the caveats slide.

**Unattended runs.** If this is a scheduled or otherwise unattended run with no user present to answer, do not wait. Post the question batch anyway so it is on the record, then build immediately on all-neutral assumptions, drop confidence one level, tag every condition line "assumed," and open the delivery message with: *"Built without the buyer interview. Condition inputs are assumptions, not observations. Answer the questions above and I will rerun with real inputs, which typically moves the point value by 3-8%."* An unanswered interview is never a reason to stall a run.

`interview_inputs` in the schema exists to show what the value rests on. On a skipped interview, render the same rows carrying the neutral assumption and the "assumed" tag — the buyer needs to see which assumptions are load-bearing. Do not render an empty slide, and do not present an assumption as an observation.

## Stage 4: Synthesize

Build `appraisal_data.json` per `references/data_schema.md`. The valuation method, adjustment schedule, weighting rules, confidence rubric, and range-width rules are in `references/methodology.md`. Follow it exactly — it is the skill's brain. Every rate it applies is dated in `references/rates_and_anchors.md`; re-verify any anchor older than six months. Summary:

1. Adjust each comp to the subject (market/time, location, site, age, sqft, garage, pool/extras, condition) using the percent-of-value schedule in methodology.md.
2. Weight comps by similarity, recency, proximity, and source tier.
3. Weighted value = base indicated value.
4. Apply subject-specific condition adjustments from the interview (roof, HVAC, kitchen, baths, defects) to reach the final point value.
5. Set the range width from the confidence rubric. Cross-check against the AVM band — if the point value falls outside the AVM band, re-examine the comps before publishing, then explain the divergence in the reconciliation narrative.
6. Write the value-vs-list verdict and 2-3 negotiation anchor numbers.

Save to `appraisal_data.json` in your working directory.

## Stage 5: Render

```bash
NODE_PATH=$(npm root -g) \
  node <skill_path>/scripts/build_deck.js appraisal_data.json output.pptx
```

If deps are missing: `npm install -g pptxgenjs react react-dom react-icons sharp`.

Then build the comp explorer from the same data file:

```bash
node <skill_path>/scripts/build_explorer.js appraisal_data.json <address>_comps.html
```

No dependencies. Add `--fragment` when publishing through an Artifact tool (it supplies its own page skeleton); add `--strict` on unattended runs so any WARN exits non-zero. The explorer shows the deck's exact numbers at rest. When the buyer unchecks a comp, it renormalizes the remaining weights, recomputes the weighted comp value, adds the same condition total, re-rates confidence (it can only drop), widens the range on the thin-comp path, and re-reads the verdict per methodology §8. It never recomputes from raw median $/sq ft: that is the shortcut this skill exists to avoid. The recompute logic lives in `scripts/explorer_math.js`, which the builder uses both to validate and to write into the page, so the two cannot drift.

QA before delivery (rendered images do not display back in this environment):
1. Extract text with python-pptx and confirm every slide has its expected content.
2. Run programmatic bounds checks: no shape extends past 13.333 × 7.5, comp-grid rows fit the table area.
3. Spot-check the math: recompute one comp's net adjustment and the weighted value by hand.
4. Run the explorer builder and read its output. It warns when the recomputed value does not reproduce the deck's point value or base within $1,000, when the deck verdict disagrees with methodology §8, when a comp's coordinates disagree with its `distance_mi` (bad geocode), when coordinates are missing (the map turns into a notice), and when a screened-out sale has no reason.

The builder prints `WARN:` lines for any broken arithmetic or layout contract. Treat every WARN as a fix-before-delivery item; nothing is blocked for you.

Then deliver. Write the deck to the working directory as `<address>_appraisal.pptx` and hand it to the user with `SendUserFile` (Cowork) or `present_files` (claude.ai), whichever is available. Do not assume `/mnt/user-data/outputs/` exists.

Deliver the explorer alongside it. If the runtime has an Artifact tool, build with `--fragment` and publish it as an artifact so the buyer gets a link that works on a phone; otherwise send the standalone `.html` file. One line in the delivery message is enough: "The explorer lets you drop any comp and see what the value does without it." The explorer is optional only when the buyer asked for the deck alone.

## Output Standards — 9 slides, always this order

1. Title (dark) — address, "Buyer's Valuation Brief", date
2. Value Conclusion — range band, point value, confidence badge, vs-list verdict
3. Subject Profile — public record facts + interview condition inputs side by side
4. Comparable Sales — comp grid with sold price, $/sqft, net adjustment, adjusted value, source tier
5. Adjustment Schedule — the rates applied and their basis
6. Condition Adjustments — interview-derived line items with dollar impacts
7. Reconciliation — comp weighting, AVM cross-check band, sensitivity low/high cases
8. Value vs List Price — delta, verdict headline, negotiation anchors, adjusted $/sq ft strip (comps, range band, point, list), bottom line
9. Sources, Confidence & Caveats (dark)

Slides 1 and 9 are dark marine. All others white.


## Running as part of a dossier

`property-intel-report` Stage 5 may invoke this skill as the second or third step of a full dossier run. When it does:

- `property_facts.json` is already populated. Read it first; expect to need 8-12 research calls, not 25-35. If you find yourself re-researching facts the cache should hold, the cache write failed — say so rather than silently burning the calls.
- Your interview questions were already folded into the dossier's single combined batch. Do not ask again. Read the answers from the conversation and proceed.
- Write your headline outputs back to the cache before finishing so the reconciliation note can use them.
- Deliver your own files normally. The orchestrator writes the reconciliation note; you do not.
- Write `value` (point, low, high, confidence, method) back to `property_facts.json`. The insurance skill uses it for context and the reconciliation note compares it against the intel deck's comp screen.

## Design System

Locked, shared with property-intel-report. Do not modify:

- Palette: marine `#0A2540`, teal `#1C7293`, coral `#E36414`, green `#2A9D8F`, crimson `#B23A48`, amber `#C9A227`
- Fonts: Georgia (headlines), Calibri (body)
- Layout: 13.333 × 7.5 widescreen
- Card shadows, hairline borders, accent left bars

Icons: only react-icons/fa names already validated in the build script. Unvalidated names fail at runtime.

## Honesty Rules (non-negotiable)

- Every sold price carries a source and tier. Tier 3 (AVM/estimate) prices are NEVER comps.
- **Comp count: 3 to 5 in the grid.** Research more, carry the strongest 5. If fewer than 3 usable comps exist, do not force the grid: render the 1-2 you have, set confidence Low, widen the range to at least ±15%, lean on the AVM band as explicit context, and put the reason on the comp slide in one sentence. A thin-comp appraisal that says so is worth more than a fabricated tight number.
- All estimated values are labeled "est." in the data file and render that way.
- The point value is always presented inside its range. Confidence is always shown.
- The deck footer states this is a valuation estimate, not a licensed appraisal (USPAP), on slides 2 and 9.
- Interview answers the buyer was unsure about are labeled "assumed" in condition adjustments.

## Reference Files

- `references/property_facts.md` — shared cross-skill facts cache, source tiers, domain ownership
- `references/rates_and_anchors.md` — every rate and dollar figure, each with an `as_of` date
- `references/methodology.md` — adjustment schedule, weighting, confidence rubric, range rules
- `references/interview.md` — the one-batch question set and answer-to-adjustment mapping
- `references/data_sources.md` — comp sources by reliability tier
- `references/data_schema.md` — full JSON schema, field by field
- `scripts/build_explorer.js` + `scripts/explorer_math.js` + `assets/comp_explorer.html` — interactive comp explorer, built from the same JSON
