---
name: property-intel-report
description: "Generate a buyer's intelligence report and decision-support deck for any residential property. Use this skill whenever the user provides an address and asks for analysis, due diligence, evaluation, or a buyer's brief on a home. Also trigger on phrases like 'should I buy', 'property report', 'evaluate this listing', 'analyze this house', 'due diligence on', or when given a Zillow, Redfin, or MLS link with intent to analyze. This is the front door of the property skill family: start here when the request is general. Use property-appraisal instead if the user only wants a value number or CMA, and property-insurance-brief if they only want coverage or premiums. Produces a 16-slide PowerPoint covering all-in monthly carry, normalized comp analysis, 5-year cost projection, climate risk, itemized inspection budget, competing inventory, red flags, phased action plan, offer strategy with walk-away triggers, and printable question scripts for the listing agent, neighbors, and inspector."
---

# Property Intelligence Report

This skill produces a buyer's decision brief for any residential property. The output is a 16-slide PowerPoint that synthesizes public records, market data, and climate/risk intelligence into a single document the buyer can take into the negotiation.

The deck is decision-support, not a data dump. Every slide answers a buyer question: can I afford this, is the price right, what am I actually buying, what could go wrong, what is my move.

## The Pipeline

```
INTAKE  →  RESEARCH  →  SYNTHESIZE  →  RENDER  →  [DOSSIER]
(address) (cache +     (JSON file)    (PPTX)     (optional:
           web data)                              siblings +
                                                  reconciliation)
```

Stages 1-4 are the deck. Stage 5 runs only when the user asked for the complete picture.

Run each stage in order. Do not skip the research stage and try to compose the JSON from priors — every property has unique facts (price history, parcel details, recent comps, climate scores) that must come from current public sources.

## Stage 1: Intake

Ask the user only what is missing. Required at minimum: full street address with city, state, ZIP. If they pasted a Zillow/Redfin/MLS URL, parse the address from it.

Do NOT ask for buyer profile (down payment, household income, primary vs investment). The deck always renders four standard scenarios: 10% / 20% / 25% down + all cash. The user can request variations.

If the user provides a target purchase price (e.g., "I'm thinking $X"), use that for monthly carry calculations. Otherwise use list price.

## Stage 2: Research

**First, check the shared cache.** Before any web call, look for `property_facts.json` per `references/property_facts.md`. If a sibling skill already researched this address, reuse every non-stale field and research only the gaps. Say once in the run summary how many facts you reused. At the end of this stage, merge what you learned back into the cache.

Then research the gaps with parallel `WebSearch` and `WebFetch` calls covering the source list at `references/data_sources.md`. Aim for 30+ tool calls on a cold start (fewer when the cache is warm). Less and the synthesis will be thin.

If a dedicated deep-research tool is available on this runtime (for example `launch_extended_search_task`), you may use it instead — the prompt template is at `references/research_prompt.md`. Do not assume it exists; `WebSearch`/`WebFetch` is the default path.

After research returns, you should have:
- Property record (parcel ID, lot, year built, sqft, beds/baths)
- Ownership and tax history
- Listing price history (every cut, every withdrawal)
- 5-7 nearby comps with $/sqft, lot, year, sale price
- Schools with ratings and distance
- Climate risk scores (Augurisk city + First Street parcel)
- FEMA flood zone for the parcel
- Permit history, septic permits, code violations
- Current Freddie Mac PMMS 30-yr rate (FRED series `MORTGAGE30US` is the usual mirror; if either has moved, use any named weekly national average and cite it)
- 4-5 competing listings at adjacent price points in the same ZIP

Do not research insurance premiums or a defensible market value here. Those belong to the sibling skills — see the ownership table in `references/property_facts.md`.

## Stage 3: Synthesize

Convert the research output into `property_data.json` matching the schema at `references/data_schema.md`. The schema mirrors the 16 slides one-for-one — fill every field.

Synthesis is where Claude does the work the buyer is paying for. Specifically:

All rates, percentages, and dollar anchors used below live in `references/rates_and_anchors.md` with an `as_of` date on each. Read that file rather than the numbers in this summary, and re-verify any anchor older than six months during Stage 2. `references/calculations.md` holds the formulas; where this file and calculations.md ever disagree, calculations.md governs.

**Monthly carry calculation.** Compute P&I at the current PMMS rate using `PMT = P * r * (1+r)^n / ((1+r)^n - 1)` for n=360, r=APR/12. Add PMI, property tax (project post-sale reassessment, not seller's homestead-protected number), homeowners insurance, wind/hurricane (separate policy in coastal hurricane zones), and flood. Take every rate from `rates_and_anchors.md`.

If `property_facts.json` carries an `insurance` block from a `property-insurance-brief` run, use those figures and cite them. Otherwise use the orientation bands in `rates_and_anchors.md` and label them est.

**Normalized comp analysis.** Compute $/sqft for every comp. **Verify the average against the listed values before using it** — this is the step the old worked example got wrong. Then strip premiums *sequentially*, not additively, using the schedule in `calculations.md`. Apply fixer discount last, based on listing language and price-cut history. Implied fair value range = adjusted base × subject sqft.

This is a screen, not a valuation. If `property_facts.json` has a `value` block from `property-appraisal`, publish that number and label this walk as the screen that supports it. If the two disagree by more than 5%, say so on the comp slide.

**5-year cost projection.** Hold P&I fixed. Grow tax and insurance at the rates in `rates_and_anchors.md`, using the parcel's actual trailing tax growth from research where it is higher. Output year-1 and year-5 monthly totals plus the delta. The cumulative delta is the sum of the four year-over-year deltas × 12; compute it, do not estimate it.

**Diligence budget.** Use `references/diligence_budget_template.md` as the baseline. Adjust line items by region (e.g., wind mitigation inspection only in hurricane states, sewer scope only on municipal sewer, water test only on private well).

**Competing inventory.** Pull up to 4 active listings within ±15% of the subject's list price in the same ZIP. Show $/sqft for each so the buyer can see relative value. Thin rural ZIPs often have fewer than 4; render what exists and state the search radius and count on the slide rather than widening the band silently or inventing a listing.

**Question scripts.** Customize per property. Every script question must reference a fact that actually appears in your research (e.g., "This listing was withdrawn twice before the current cycle — what happened each time?" — not a generic "ask about the listing history"). Before delivery, check each question against the price history and research notes: a question citing a price, date, or event that does not appear in your data is a fabrication, and it will be the first thing the listing agent notices.

**Offer strategy.** Compute the opening offer with the formula in `calculations.md` §7 (not a rule of thumb from memory) and show the arithmetic in the rationale lines. Define three trigger sets: walk-away conditions, reduce-further conditions, go-to-ask conditions.

Save the JSON to `property_data.json` in your working directory.

## Stage 4: Render

Run the deck builder from your working directory:

```bash
NODE_PATH=$(npm root -g) \
  node <skill_path>/scripts/build_deck.js property_data.json output.pptx
```

If Node deps are missing, install:
```bash
npm install -g pptxgenjs react react-dom react-icons sharp
```

QA before delivery (rendered images do not display back in this environment):

1. Extract text with python-pptx and confirm all 16 slides carry their expected content, including both tables (slide 10 diligence budget, slide 11 inventory).
2. Run programmatic bounds checks: no shape extends past 13.333 × 7.5.
3. Recompute by hand: the comp average from the listed comp $/sqft values, the fair-value walk applied sequentially, the price-cut count (points minus one), days on market from the first listing date, and the cumulative 5-year delta (sum of year deltas × 12). These are the numbers the worked example previously got wrong; check yours.
4. Confirm every question script references a fact that actually appears in the price history or research.

Then deliver. Write the deck to the working directory as `<address>_property_report.pptx` and hand it to the user with `SendUserFile` (Cowork) or `present_files` (claude.ai), whichever is available on this runtime. Do not assume `/mnt/user-data/outputs/` exists; if the runtime uses it, `mkdir -p` it first.

## Stage 5 (optional): Full dossier

Run this only when the user asked for the complete picture — "everything on this house," "full workup," "the whole package," "all three," or an explicit request for value and insurance alongside the brief. A plain "analyze this house" is **not** a dossier request; deliver this deck and stop.

When it is a dossier request, deliver this deck first, then run the siblings in this order:

1. **`property-appraisal`** — produces the defensible value number.
2. **`property-insurance-brief`** — produces the coverage spec and premium range.

Order matters. The appraisal's Cov A anchor feeds the insurance brief, and the insurance premium feeds nothing downstream, so running it last means no rework.

Both read the `property_facts.json` you wrote in Stage 2, so each costs roughly 8-12 research calls instead of 25-35. If a sibling is re-researching facts the cache already holds, the cache write failed — check it before letting the run continue and burn the calls.

**Interviews still happen.** The appraisal and insurance skills each ask one batch of questions. Combine them into a single batch at the start of the dossier run rather than interrupting the user twice: ask the appraisal's condition questions and the insurance skill's coverage questions together, capped at 12 total, cutting anything the cache already answered. If the run is unattended, both skills build on documented defaults per their own unattended rules; do not stall the chain.

### The reconciliation note

Deliver all four files together (this deck, the appraisal deck, the insurance deck, the spec-sheet PDF) with a short cover note that reconciles the three headline numbers against each other. This is the part a buyer cannot do themselves, and it is the reason the dossier is worth more than three separate runs:

- **Carry vs premium.** This deck's monthly carry used an insurance estimate. The insurance brief produced a sourced range. State the delta and which number to plan against. If the sourced range moves monthly carry by more than $75, say so explicitly — that is a real change to affordability.
- **List vs value.** This deck's comp screen produced a fair-value range. The appraisal produced a point value with a confidence rating. The appraisal governs. If the two disagree by more than 5%, name the reason (usually comp selection or a condition adjustment the screen could not see).
- **Value vs Cov A.** These are different numbers and buyers conflate them constantly. Market value includes the lot; Cov A is rebuild cost only. Say both, and say why they differ on this property.
- **The one thing that changes the decision.** One sentence. Not a summary of the three decks — the single finding that most moves the buy/walk call.

Keep the note under 200 words. The decks carry the detail.

If a sibling skill fails or is unavailable, deliver what you have, say which piece is missing and why, and give the user the one-line command to run it separately. Never hold a finished deck hostage to an unfinished one.

## Output Standards

The deck must always be 16 slides in this order:

1. Title (dark, address + tagline)
2. Executive Summary — Good / Bad / Ugly (3-column card layout)
3. At a Glance — six big-number cards
4. Total Monthly Carry — four scenarios side-by-side
5. Price Trajectory — line chart + callouts
6. Normalized Comp Analysis — bar chart + fair-value walk
7. 5-Year Cost Projection — stacked bar chart + delta callout
8. Schools — three school cards
9. Climate & Risk — six risk cards
10. Itemized Diligence Budget — table with totals
11. Competing Inventory — subject + 4 alternatives
12. Top Red Flags — 6 numbered cards
13. Question Scripts — 3 columns (agent / neighbors / inspector)
14. Action Plan — 4 phases (pre-offer → at-offer → inspection → pre-closing)
15. Offer Strategy — opening + walk-away / reduce / go-to-ask triggers (dark)
16. Sources & Caveats (dark)

Slides 1, 15, and 16 use the dark marine background. All other slides are white. This sandwich structure gives the deck visual rhythm.

## Design System

Locked. Do not modify per-property:

- Palette: marine `#0A2540`, teal `#1C7293`, coral `#E36414`, green `#2A9D8F`, crimson `#B23A48`, amber `#C9A227`
- Fonts: Georgia (headlines), Calibri (body)
- Layout: 13.333 × 7.5 widescreen
- Card shadows, hairline borders, accent-color left bars

The build script enforces this. The data file controls only content.

## Honesty Rules

These are non-negotiable:

- Cite a real source for every number. If a value is estimated, label it "est." in the data file and the slide will render it that way.
- **Never source a comp from an AVM.** Zestimate, Redfin Estimate, and Realtor.com estimates are tier 3. They are sanity context, never a comp $/sqft. Comps come from recorded sales.
- Do not invent comps. If research returned 3 comps, use 3 and state the count on the slide. The skill handles 3-7.
- Do not invent climate scores. If the parcel-level First Street score is not retrievable, use the city-level Augurisk score and label it as such.
- Do not pad a fixed-count slide with filler to hit its count. Every slide with a count range renders what is true; see "Count contracts" below.
- Default to ranges, not point estimates, for inspection costs and insurance.
- **Every number on a slide must survive recomputation from the numbers next to it.** A comp average must equal the average of the comps shown. A cut count must equal points minus one. Days on market must match the first listing date. Check these before delivery.
- The "BOTTOM LINE" line on the offer strategy slide must be the buyer's actual situation in one sentence — not a marketing tagline.

## Count contracts

The schema specifies counts so slides lay out cleanly. Treat them as ceilings with a floor, not quotas:

- Render fewer than the stated count when the property genuinely has fewer, and put the reason on the slide ("Three comps met the criteria within one mile; the fourth-nearest was 3.2 mi and excluded.").
- Never fabricate a red flag, a climate risk, a school, or a competing listing to fill a grid.
- The climate slide's six categories are a national superset. Categories that do not apply to the region render as a single "not applicable in this market" card, not as six cards of filler.
- Slide titles must not hardcode a count that the data may not produce. Use "What to Resolve Before You Sign," not "Six Things to Resolve."

## Worked Example

`examples/willow_bend/property_data.json` is a complete, arithmetically verified input file for a 1986 fixer-upper on a synthetic address. Every number in it recomputes from its own inputs. Use it as a reference for field structure, tone, and level of detail — and copy its habit of showing the arithmetic, not just the result.

It is synthetic on purpose. Do not ship a worked example containing a real parcel ID, MLS number, phone number, or a neighbor's records.

## Reference Files

Read these as needed:

- `references/property_facts.md` — the shared cross-skill facts cache, source tiers, and the ownership table
- `references/rates_and_anchors.md` — every rate and dollar anchor, each with an `as_of` date
- `references/calculations.md` — formulas for P&I, PMI, fair-value walk, 5-yr projection (governs on any conflict)
- `references/data_schema.md` — full JSON schema with field-by-field documentation
- `references/data_sources.md` — authoritative public data sources by domain
- `references/diligence_budget_template.md` — baseline inspection costs, regional adjustments
- `references/research_prompt.md` — deep-research prompt template, if such a tool is available
