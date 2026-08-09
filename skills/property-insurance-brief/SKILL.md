---
name: property-insurance-brief
description: "Build a homeowners insurance coverage decision brief and quote-request package for a residential property. Use this skill whenever the user asks what insurance will cost on a house, asks to estimate homeowners insurance, asks about wind or flood coverage, deductible choices, FORTIFIED credits, or asks 'what should I ask insurance agents', 'help me get insurance quotes', 'build my coverage spec', or provides an address with intent to insure it. Handles coastal markets (percentage wind deductibles, wind pools, mitigation credits) and inland markets (flat deductible, hail and wind endorsements). Use property-intel-report instead for a full buyer's brief, or property-appraisal for a value number. Produces an 11-slide PowerPoint coverage brief plus a one-page PDF quote spec sheet the buyer hands to three agents so every quote prices the identical spec."
---

# Property Insurance Brief (Coverage Decision Brief + Quote Spec Sheet)

This skill produces a coverage decision brief for a residential property, packaged as an 11-slide PowerPoint plus a printable one-page PDF quote-request worksheet. The buyer uses the deck to understand and choose coverage, and hands the spec sheet to three agents so every quote comes back on the identical spec.

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

If the buyer already has real quotes in hand, ingest them before anything else. From each quote extract: carrier and channel (admitted vs surplus lines), Cov A-F limits, deductibles with dollar figures, total cost including every fee and tax (never just the property premium), minimum earned premium terms, and the full forms/endorsements schedule. Real quotes are anchor-grade for the premium range, and their forms lists get checked against the red-flag patterns (e.g. an RCV roof headline with an age-triggered ACV roof form attached). If two quotes differ on Cov A, deductible, or risk data, flag the spec drift explicitly — that inconsistency is the problem this skill exists to fix.

## Stage 2: Research

**First, check the shared cache.** Before any web call, look for `property_facts.json` per `references/property_facts.md`. A `property-intel-report` or `property-appraisal` run on this address will already carry year built, sqft, construction, roof age and source, FEMA zone, BFE, freeboard, distance to coast, and the value estimate (your Cov A anchor). Read them as fields; do not re-parse them out of a sibling deck's slide copy. Merge what you learn back into the cache at the end of this stage.

Then research the gaps with parallel `WebSearch` + `WebFetch`. Target 15-25 tool calls on a cold start and closer to 8 when the cache is warm (the market layer is shared across properties in the same territory). If a dedicated deep-research tool exists on this runtime, you may use it instead; do not assume it does. The full source list is in `references/data_sources.md`. Priorities in order:

1. **Property facts for the spec sheet** (skip any already harvested): year built, sqft, construction type, roof age/material (permit-verified beats listing-claimed), distance to coast, FEMA zone.
2. **Market structure for this territory**: wind/hurricane deductible norms and which deductible steps carriers actually quote here, the three placement channels (admitted carriers, surplus lines / E&S such as Lloyd's, and the wind pool, e.g. AIUA in coastal AL) with their consequences (surplus lines: state tax on premium, minimum earned premium, fully earned fees, no guaranty fund), state mitigation credit programs (FORTIFIED, Strengthen Alabama Homes), regulator premium comparison tools.
3. **Premium anchors**: state DOI premium comparison data for a matching profile, state-average premium for a comparable dwelling value from a named source. These set the honest range on slide 8; they are never presented as quotes.
4. **Flood picture**: NFIP pricing context for the property's zone. Zone and freeboard come from the intel report where it ran; otherwise FEMA MSC.
5. **Replacement cost anchor**: local rebuild $/sqft context to sanity the Cov A estimate. Labeled est. until a carrier estimator runs.

## Stage 3: Interview (one batch, mandatory)

Ask the buyer ONE batch of questions before synthesizing. Never drip-feed. The question set, phrasing rules, and the answer-to-spec mapping are in `references/interview.md`.

Rules:
- 8-12 questions max. Cut anything research or a sibling-skill run already answered, and say so.
- First question is always the deductible-tolerance question. Coastal: "After a hurricane, how large a check could you write without hardship?" — it drives the wind deductible, the single biggest coverage decision in a named-storm market. Inland: "After a major hail or wind event, how large a check could you write without hardship?" — same purpose against the flat or hail deductible.
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
- Wind deductible dollar figures must equal pct × Cov A. Compute, don't copy. The builder recomputes them.
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

The deck builder prints WARN lines for any layout or arithmetic contract violation; treat every WARN as a fix-before-delivery item. The PDF builder measures both columns against the footer floor before drawing and exits non-zero with a specific message if either would overflow — so a non-zero exit means trim rows or shorten values, not retry.

QA before delivery (rendered images do not display back in this environment):
1. Extract text with python-pptx and confirm all 11 slides carry their expected content, including both tables (slide 4 coverage lines, slide 9 quote grid).
2. Run programmatic bounds checks: no shape extends past 13.333 × 7.5.
3. Recompute the deductible dollars from pct × Cov A by hand (coastal), or confirm the flat dollar figures match the spec sheet (inland).
4. Extract the PDF text with pdfplumber and confirm the property block, coverage block, all three quote columns, and the footer disclaimer are present on page 1 of 1.

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

Plus the standalone `spec_sheet.pdf`: one page, letter portrait, property block and coverage spec left, three blank hand-fillable quote columns right.


## Running as part of a dossier

`property-intel-report` Stage 5 may invoke this skill as the second or third step of a full dossier run. When it does:

- `property_facts.json` is already populated. Read it first; expect to need 8-12 research calls, not 25-35. If you find yourself re-researching facts the cache should hold, the cache write failed — say so rather than silently burning the calls.
- Your interview questions were already folded into the dossier's single combined batch. Do not ask again. Read the answers from the conversation and proceed.
- Write your headline outputs back to the cache before finishing so the reconciliation note can use them.
- Deliver your own files normally. The orchestrator writes the reconciliation note; you do not.
- Write `insurance` (cov_a_est, premium_low, premium_high, wind_deductible_pct, flood_required) back to `property_facts.json`. The reconciliation note compares your sourced range against the intel deck's carry estimate.
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
- The footer disclaimer ("educational decision support, not insurance advice; only a carrier can quote") renders on every slide and on the PDF.

## Reference Files

- `references/property_facts.md` — shared cross-skill facts cache, source tiers, domain ownership
- `references/rates_and_anchors.md` — every rate, program name, and dollar figure, each with an `as_of` date
- `references/data_schema.md` — full JSON schema, slide map, and validation contracts
- `references/interview.md` — the one-batch question set and answer-to-spec mapping
- `references/data_sources.md` — premium anchors, mitigation programs, and property-fact sources by reliability
