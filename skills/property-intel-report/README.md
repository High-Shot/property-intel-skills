# Property Intelligence Report

Buyer's decision brief for a residential property. Produces a 16-slide PowerPoint covering all-in monthly carry, normalized comps, a 5-year cost projection, climate and hazard exposure, an itemized diligence budget, competing inventory, red flags, a phased action plan, offer strategy with walk-away triggers, and printable question scripts.

This is the front door of a three-skill family:

| Skill | Answers | Owns |
|---|---|---|
| **property-intel-report** | What am I buying and what could go wrong? | Parcel record, permits, hazard, schools, diligence budget, competing inventory |
| **property-appraisal** | What is it worth? | Market value, comp adjustments, offer anchors |
| **property-insurance-brief** | How do I insure it? | Premiums, deductibles, coverage spec, flood cost |

All three read and write a shared `property_facts.json` so the same house is researched once. See `references/property_facts.md`.

## Pipeline

```
INTAKE  →  RESEARCH  →  SYNTHESIZE  →  RENDER  →  [DOSSIER]
(address)  (cache +     (property_     (PPTX +    (optional:
            web)         data.json)     QA)        siblings +
                                                   reconciliation)
```

## Full dossier mode

Stage 5 runs only when the user asks for the complete picture ("everything on this house," "full workup," "all three"). A plain "analyze this house" delivers this deck and stops.

When it does run: this deck ships first, then `property-appraisal`, then `property-insurance-brief`. Order matters — the appraisal's Cov A anchor feeds the insurance brief. Both read the `property_facts.json` written in Stage 2, so each costs 8-12 research calls instead of 25-35. The two sibling interviews are folded into one combined batch at the start, capped at 12 questions, so the user is interrupted once rather than three times.

All four files deliver together with a reconciliation note under 200 words covering the carry-vs-sourced-premium delta, the list-vs-value gap, the value-vs-Cov-A distinction, and the one finding that most moves the buy/walk call. That note is the reason a dossier beats three separate runs.

If a sibling fails, deliver what exists, name what is missing, and give the command to run it separately. Never hold a finished deck for an unfinished one.

## Running it

```bash
NODE_PATH=$(npm root -g) \
  node scripts/build_deck.js property_data.json output.pptx
```

Deps: `npm install -g pptxgenjs react react-dom react-icons sharp`

Deliver with `SendUserFile` (Cowork) or `present_files` (claude.ai). Do not assume `/mnt/user-data/outputs/` exists.

## The builder validates your data

`build_deck.js` runs a validation pass before rendering and prints `WARN:` lines. Every check corresponds to a defect that shipped in a previous worked example:

- The comp average must reproduce from the comps shown.
- Premium strips must compound, not sum.
- Price cuts must equal price points minus one.
- The cumulative 5-year figure must equal the sum of the year deltas times 12.
- Each carry scenario's total must equal its components.
- Array lengths must be at or under their layout ceilings.
- Slide titles must not hardcode a count.
- No phone numbers, no people-search aggregators, no AVM-sourced comps.

Warnings are non-fatal by design — the deck still renders so you can look at it. **Treat every WARN as fix-before-delivery.** Nothing is blocked for you.

## Worked example

`examples/willow_bend/property_data.json` is a synthetic, arithmetically verified input file for a 1986 fixer-upper. It builds clean with zero warnings. Every number in it recomputes from its own inputs, and the fair-value walk shows its arithmetic rather than asserting a result.

It is synthetic on purpose. Never ship an example containing a real parcel ID, MLS number, phone number, or a third party's records.

## Reference files

| File | What it holds |
|---|---|
| `references/property_facts.md` | Shared cross-skill facts cache, source tiers, domain ownership |
| `references/rates_and_anchors.md` | Every rate and dollar anchor, each with an `as_of` date |
| `references/calculations.md` | Formulas. **Governs on any conflict with SKILL.md** |
| `references/data_schema.md` | Full JSON schema, count contracts, arithmetic contracts |
| `references/data_sources.md` | Public data sources by domain, with a volatility note |
| `references/diligence_budget_template.md` | Baseline inspection costs (vintage 2025-Q4) |
| `references/research_prompt.md` | Deep-research prompt template, if such a tool exists on the runtime |

## Honesty posture

Cite a real source for every number. Label estimates "est." AVMs are never comps. Do not pad a slide to hit a count. Every figure on a slide must survive recomputation from the numbers next to it.
