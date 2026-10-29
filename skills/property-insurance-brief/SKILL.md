---
name: property-insurance-brief
description: "Build a homeowners insurance coverage decision brief and quote-request package for a residential property. Use this skill whenever the user asks what insurance will cost on a house, asks to estimate homeowners insurance, asks about wind or flood coverage, deductible choices, FORTIFIED credits, or asks 'what should I ask insurance agents', 'help me get insurance quotes', 'build my coverage spec', or provides an address with intent to insure it. Handles coastal markets (percentage wind deductibles, wind pools, mitigation credits) and inland markets (flat deductible, hail and wind endorsements). Use property-intel-report instead for a full buyer's brief, or property-appraisal for a value number. Also use it when the user has real quotes in hand or a carrier intake form to fill. Produces an 11-slide PowerPoint coverage brief plus a PDF spec sheet (page 1 quote worksheet, page 2 carrier intake answers) the buyer hands to three agents so every quote prices the identical spec."
---

# Property Insurance Brief (Coverage Decision Brief + Quote Spec Sheet)

This skill produces a coverage decision brief for a residential property, packaged as an 11-slide PowerPoint plus a printable PDF spec sheet. Page 1 is the quote-request worksheet. Page 2 is the carrier intake sheet: the property answers in the order a carrier's own intake form asks them, each marked verified, listing, buyer, or CONFIRM. The buyer uses the deck to understand and choose coverage, and hands the spec sheet to three agents so every quote comes back on the identical spec and every carrier rates the same facts.

It is the third skill in the family. `property-intel-report` answers "what am I buying and what could go wrong." `property-appraisal` answers "what is it worth." This skill answers "how do I insure it without overpaying or underinsuring." Do not duplicate the siblings' content (comps, diligence budget, permits, schools) here. Do pull their outputs in: FEMA zone, BFE, lidar freeboard, roof age and permit status, and replacement-relevant facts flow from the intel report when both skills run on the same property.

This is educational decision support, not insurance advice, and no figure in it is a quote. Only a carrier can quote. The deck and the PDF both say so.

## The 5-Stage Pipeline

```
INTAKE  →  RESEARCH  →  INTERVIEW  →  SYNTHESIZE  →  RENDER
(address)  (market +    (one batch    (insurance     (PPTX +
            property)    of questions)  JSON)          PDF)
```

Run in order. The interview comes AFTER research so questions can reference facts ("the roof permit shows 2019 — any hail claims since?") and skip anything research already answered.

## Stage 1: Intake

Required: full street address with city, state, ZIP. If a `property-intel-report` or `property-appraisal` run exists for this address, read `property_facts.json` (see `references/property_facts.md`) rather than re-researching: year built, sqft, construction, roof age and permit status, FEMA zone, BFE/freeboard, distance to coast, and the value estimate (Cov A anchor) all live there as typed fields. Everything harvested skips research and the interview.

**Set `market_profile` at intake.** `"coastal"` when the property sits in a named-storm market where carriers write percentage wind or hurricane deductibles. `"inland"` everywhere else. This is the single switch that decides whether slide 5 renders, what the primer covers, and which levers apply. When in doubt, check whether quotes in this territory carry a separate wind deductible at all; if they do not, the profile is inland.

**Real quotes come first.** If the buyer has real quotes, ingest them before anything else and write each to `insurance.quotes[]` in `property_facts.json` (schema in `references/property_facts.md`). From each quote extract: carrier, agency, and channel (admitted vs surplus lines); territory and protection class; Cov A-F limits; every deductible in dollars, noting whether the hurricane deductible is a percentage or a **flat dollar figure**; total cost including every fee and tax (never just the property premium); minimum earned premium terms; the full forms/endorsements schedule with each limit and premium; and the facts the carrier rated on (year built, construction, roof year).

Then:
1. **Premium range from quotes.** A real quote on this address outranks every published anchor. Set `premium_low`/`premium_high` from the quotes, normalized to the spec: subtract endorsements the spec did not ask for, and say which. Compute `rate_per_1k_cov_a` (total / Cov A × 1000). A quote on a nearby property in the same territory and protection class is a basis line for this one.
2. **Storm-day cash from the quote.** If the carrier wrote a flat hurricane deductible, the brief uses that dollar figure, not pct × Cov A. Record it in `insurance.wind_deductible_flat` and on the wind option as `flat` (see `references/data_schema.md`).
3. **Roof and water terms.** Pull roof coverage endorsements (roof limits or sublimits, ACV or age schedules) and water damage limits into the comparison. A roof limit below a full re-roof cost is a red flag; ask whether it caps the roof payment.
4. **Carrier defaults vs the spec.** Unrequested quotes come back on carrier defaults (seen in coastal AL: Cov C 25%, MedPay $1,000, water backup $5,000, animal liability capped at $5,000). List every line where the quote is below the spec.
5. **Rated facts vs the cache.** If a quote's year built, construction, or roof year differs from the cache, flag it; a mis-rated quote can be voided at claim time.
6. **Spec drift.** If two quotes differ on Cov A, deductible form, endorsements, or risk data, flag it explicitly. Compare at fixed terms, not on totals. That inconsistency is the problem this skill exists to fix.

When a carrier's intake form is shared (screenshots or a link), use its field order for page 2 of the spec sheet. Never copy the applicant identifiers it asks for (SSN, driver's license number, date of birth) into any file, cache, or memory; say once that those go only into the agent's secure portal.

## Stage 2: Research

**First, check the shared cache.** Before any web call, look for `property_facts.json` per `references/property_facts.md`. A `property-intel-report` or `property-appraisal` run on this address will already carry year built, sqft, construction, roof age and source, FEMA zone, BFE, freeboard, distance to coast, and the value estimate (your Cov A anchor). Read them as fields; do not re-parse them out of a sibling deck's slide copy. Merge what you learn back into the cache at the end of this stage.

Then research the gaps with parallel `WebSearch` + `WebFetch`. Target 15-25 tool calls on a cold start and closer to 8 when the cache is warm (the market layer is shared across properties in the same territory). If a dedicated deep-research tool exists on this runtime, you may use it instead; do not assume it does. The full source list is in `references/data_sources.md`. Priorities in order:

1. **Property facts for the spec sheet** (skip any already harvested): year built, sqft, construction type, roof year/material (permit-verified beats listing-claimed), distance to coast, FEMA zone. Then the carrier intake fields per `references/interview.md` § Carrier intake answers: roof shape (hip vs gable, a major wind factor), wind mitigation level and shutters, HVAC and water heater year and location, plumbing material, wiring, panel brand, alarm, detached structures, pond. Anything without a tier-1 or inspection source is written as unconfirmed, never guessed. Read an inspection report first if one exists.
2. **Market structure for this territory**: wind/hurricane deductible norms and which deductible steps carriers actually quote here, the three placement channels (admitted carriers, surplus lines / E&S such as Lloyd's, and the wind pool, e.g. AIUA in coastal AL) with their consequences (surplus lines: state tax on premium, minimum earned premium, fully earned fees, no guaranty fund), state mitigation credit programs (FORTIFIED, Strengthen Alabama Homes), regulator premium comparison tools.
3. **Premium anchors**: state DOI premium comparison data for a matching profile, state-average premium for a comparable dwelling value from a named source. These set the honest range on slide 8; they are never presented as quotes.
4. **Flood picture**: NFIP pricing context for the property's zone. Zone and freeboard come from the intel report where it ran; otherwise FEMA MSC.
5. **Replacement cost anchor**: local rebuild $/sqft context to sanity the Cov A estimate. Labeled est. until a carrier estimator runs.

## Stage 3: Interview (one batch, mandatory)

Ask the buyer ONE batch of questions before synthesizing. Never drip-feed. The question set, phrasing rules, and the answer-to-spec mapping are in `references/interview.md`.

Rules:
- 3 questions max. Cut anything research or a sibling-skill run already answered, and say so.
- Never ask about the deductible or flood. Standing rules: 2% wind deductible on every coastal property (`chosen: "default"`, 1% and 5% quoted beside it), $2,500 AOP inland, and flood quoted only when the lender requires it (SFHA zones A or V). See `references/interview.md` § Standing rules. Exception: when a real quote in hand writes a flat-dollar hurricane deductible, the option set shows that flat option (as the default if the buyer has not chosen) beside the 2% request, because the flat figure is what the buyer will actually pay on storm day.
- Intake facts (dogs, trampoline, claims, mortgaged) ride on the existing questions. After the buyer has walked the house, one optional follow-up about panel brand, water heater, and pipe material is allowed (see interview.md).
- If the buyer answers "I don't know," apply the neutral default from interview.md and mark the resulting spec line as a default, not a selection.
- If the buyer skips the interview entirely, build the spec on all defaults, say so on the caveats slide, and flag the wind deductible as unchosen.

**Representing "unchosen."** A wind deductible the buyer did not pick carries `chosen: "default"`, not `chosen: true`. The slide renders it as the shown default rather than as a selection, and the caveats slide must carry a line saying the buyer has not chosen. The builder warns if a default is set without that caveat. Never fake a selection to satisfy a layout contract.

**Unattended runs.** If this is a scheduled or otherwise unattended run with no user present, do not wait. Post the question batch so it is on the record, then build immediately on documented defaults, mark every defaulted spec line, set the wind deductible to `chosen: "default"`, and open the delivery message with: *"Built without the buyer interview. The wind deductible is the biggest coverage decision here and it is currently a default, not your choice. Answer the questions above and I will rebuild the spec."* An unanswered interview never stalls a run.

## Stage 4: Synthesize

Build `insurance_data.json` per `references/data_schema.md`. Read the worked example at `examples/illustrative_fairhope/insurance_data.json` IN FULL before constructing any new data file — array lengths are layout contracts and mismatches break slides.

Key rules (the schema's validation section is authoritative):
- Exactly 4 primer cards and exactly 6 coverage_spec stats.
- **Coastal profile:** exactly 3 wind_deductible options, exactly one carrying `chosen: true` (buyer selected) or `chosen: "default"` (unchosen). The three options are the deductible steps carriers actually quote in this market (from real quotes when available), not a fixed 1/2/5.
- **Inland profile:** omit `wind_deductible` entirely. Slide 5 becomes "Deductibles in Dollars" and shows the flat all-other-perils choice plus any separate wind/hail deductible the territory uses. Do not invent a percentage.
- 7-9 coverage_lines rows, 4-6 lever items, 6-8 agent questions, 4-6 red flags, 3-4 flood facts. Lever 1 is the state mitigation program on a coastal profile; where no such program exists, drop it and say so on the slide rather than padding to six.
- Wind deductible dollar figures must equal pct × Cov A. Compute, don't copy. A flat-dollar option instead carries `flat`, `dollars` equal to it, and `pct` = flat / Cov A to two decimals. The builder warns on either mismatch.
- `spec_sheet.quote_columns.rows` is the fixed 10-row set in the schema, including roof terms and water damage limits.
- `spec_sheet.carrier_intake` (page 2) follows the carrier form's order, 4-6 sections, 30-40 rows, each with a `status`. Unverified rows are `"unconfirmed"` and render CONFIRM. No identifier rows; the PDF builder exits non-zero on them.
- Every dollar figure the buyer didn't choose carries "est." in the string. Chosen levels (deductibles, liability limit) are selections, no label.
- Every `premium_range.basis_lines` entry names its source. No source, no line. **One sourced anchor beats three padded ones** — states without a DOI premium comparison tool will yield fewer, and that is the honest outcome. Fewer than 3 requires the caveats slide to say why.
- Colors are named palette tokens; icons are the validated react-icons/fa names listed in the schema. Unvalidated icon names fail at runtime.

Save to `insurance_data.json` in your working directory.

## Stage 5: Render

Two outputs from the same JSON:

```bash
NODE_PATH=$(npm root -g) \
  node <skill_path>/scripts/build_deck.js insurance_data.json output.pptx
python3 <skill_path>/scripts/build_spec_sheet.py insurance_data.json spec_sheet.pdf
```

If node deps are missing: `npm install -g pptxgenjs react react-dom react-icons sharp`. If reportlab is missing: `pip install reportlab pypdf --break-system-packages`.

The deck builder prints WARN lines for any layout or arithmetic contract violation; treat every WARN as a fix-before-delivery item. The PDF builder measures both columns of each page against the footer floor before drawing and exits non-zero with a specific message if either would overflow, so a non-zero exit means trim rows or shorten values, not retry. Exit code 3 means an identifier row (SSN, license, DOB) is present: remove it.

QA before delivery (rendered images do not display back in this environment):
1. Extract text with python-pptx and confirm all 11 slides carry their expected content, including both tables (slide 4 coverage lines, slide 9 quote grid).
2. Run programmatic bounds checks: no shape extends past 13.333 × 7.5.
3. Recompute the deductible dollars from pct × Cov A by hand (coastal), or confirm the flat dollar figures match the spec sheet (inland).
4. Extract the PDF text with pdfplumber and confirm page 1 carries the property block, coverage block, all three quote columns, and the footer disclaimer; and, when `carrier_intake` is present, page 2 carries every intake section. The PDF is 1 page without intake, 2 with it.
5. If real quotes exist, recompute each `rate_per_1k_cov_a` and confirm the premium range and storm-day dollars match the quotes, not the published anchors.

Write both to your working directory as `<address>_insurance_brief.pptx` and `<address>_spec_sheet.pdf`, then deliver with `SendUserFile` (Cowork) or `present_files` (claude.ai), deck first. Do not assume `/mnt/user-data/outputs/` exists.

## Output Standards — 11 slides, always this order

1. Title (dark) — address, "Homeowners Insurance Brief", companion tag
2. How Insurance Is Priced Here — 4-card primer. Coastal profile: wind/non-wind split, placement channels, mitigation credits. Inland profile: perils, deductible structure, local rate drivers
3. Your Coverage Spec at a Glance — 6 stat cards
4. Coverage Line by Line — table, every line explained with the chosen level
5. Deductible Math — coastal: the three percentage steps carriers quote here, in dollars, chosen option highlighted. Inland: the flat all-other-perils choice and any separate wind/hail deductible
6. Flood: The Separate Policy — zone, freeboard, NFIP ballpark, recommendation
7. Price Levers Ranked — 5-6 levers with status on this property
8. Estimated Premium Range — honest range with named-source basis lines
9. Quote Spec Sheet (preview) — the PDF's content, previewed in the deck
10. Agent Script & Quote Red Flags (dark)
11. Sources & Caveats (dark)

Slides 1, 10, 11 are dark marine, mirroring the intel report's dark sandwich. All others white.

Slide 5 renders on both profiles; only its content differs. The deck is always 11 slides.

Plus the standalone `spec_sheet.pdf`, letter portrait. Page 1: property block and coverage spec left, three blank hand-fillable quote columns right (10 rows). Page 2, when intake data exists: carrier intake answers in two columns with a status tag per row.


## Running as part of a dossier

`property-intel-report` Stage 5 may invoke this skill as the second or third step of a full dossier run. When it does:

- `property_facts.json` is already populated. Read it first; expect to need 8-12 research calls, not 25-35. If you find yourself re-researching facts the cache should hold, the cache write failed — say so rather than silently burning the calls.
- Your interview questions were already folded into the dossier's single combined batch. Do not ask again. Read the answers from the conversation and proceed.
- Write your headline outputs back to the cache before finishing so the reconciliation note can use them.
- Deliver your own files normally. The orchestrator writes the reconciliation note; you do not.
- Write the `insurance` block back to `property_facts.json` as numbers, not display strings: `market_profile`, `cov_a_est`, `premium_low`, `premium_high`, `wind_deductible_options_pct` (e.g. `[1, 2, 5]`, empty on an inland profile), `wind_deductible_pct`, `wind_deductible_chosen` (`true` or `"default"`, matching the deck), `wind_deductible_flat` (dollars when the carrier quotes flat, else null; `wind_deductible_pct` then holds the effective percent), `aop_deductible`, `flood_premium_low`, `flood_premium_high`, `flood_required`, `quotes[]` for every real quote, and optionally a one-line `wind_note`. Write the intake facts to `structure` and `buyer.insurance_intake` with provenance. The dossier dashboard renders these and cross-checks them against `insurance_data.json`; a deck and a cache that disagree is a fix-before-delivery warning.
- Your Cov A anchors to **rebuild cost**, not to the appraisal's market value. If a `value` block is present, use it as context, never as Cov A.

## Design System

Locked, shared with property-intel-report and property-appraisal. Do not modify:

- Palette: marine `#0A2540`, teal `#1C7293`, coral `#E36414`, green `#2A9D8F`, crimson `#B23A48`, amber `#C9A227`
- Fonts: Georgia (headlines), Calibri (body); PDF uses the closest built-ins (Times-Bold / Helvetica)
- Layout: 13.333 × 7.5 widescreen; PDF letter portrait
- Card shadows, hairline borders, accent left bars

Icons: only the react-icons/fa names listed in the schema. Unvalidated names fail at runtime.

## Honesty Rules (non-negotiable)

- No figure in this package is ever presented as a quote. The range on slide 8 is orientation, sourced line by line.
- Every premium anchor names its source (state DOI comparison, named rate study). No source, no line.
- The Cov A dwelling figure is labeled est. until a carrier replacement-cost estimator runs.
- Wind deductible dollars are computed from the chosen Cov A, never copied from another property.
- Spec lines built on defaults (buyer said "I don't know" or skipped) are labeled as defaults, and the caveats slide says which ones.
- The footer disclaimer ("educational decision support, not insurance advice; only a carrier can quote") renders on every slide and on every PDF page.
- A real quote beats every estimate. When one exists, the brief says so and uses it; a published anchor that disagrees with it is context, not a competing number.
- The carrier intake page never shows a guess as verified. Carriers rate on what the sheet says.
- Applicant identifiers (SSN, driver's license number, date of birth) never appear in any output, cache, or memory, even when a carrier form asks for them.

## Reference Files

- `references/property_facts.md` — shared cross-skill facts cache, source tiers, domain ownership
- `references/rates_and_anchors.md` — every rate, program name, and dollar figure, each with an `as_of` date, including real-quote anchors (rate per $1K Cov A)
- `references/data_schema.md` — full JSON schema, slide map, and validation contracts
- `references/interview.md` — the one-batch question set and answer-to-spec mapping
- `references/data_sources.md` — premium anchors, mitigation programs, and property-fact sources by reliability
