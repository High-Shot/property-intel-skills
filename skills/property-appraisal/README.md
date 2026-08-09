# property-appraisal

Buyer's valuation brief for any residential property. One of three property skills. `property-intel-report` covers diligence and risk, `property-insurance-brief` covers coverage and premiums, and this one produces the value number. **This skill owns market value** — the other two cite it rather than computing their own.

All three read and write a shared `property_facts.json` so the same house is researched once. See `references/property_facts.md`.

## What it does

Give it an address. It researches sold comps and property records, then asks you one batch of 8-12 condition questions (roof, HVAC, kitchen, baths, defects, extras) that public data can't answer, and produces a 9-slide PowerPoint:

1. Title
2. Value Conclusion — point value, range, confidence badge, list-price verdict
3. Subject Profile — public record vs interview inputs
4. Comparable Sales — comp grid with adjustments, weights, and source tiers
5. Adjustment Schedule — the rates applied and their basis
6. Condition Adjustments — interview-derived dollar impacts, tagged verified/assumed/reported
7. Reconciliation — value walk, AVM cross-check band, low/high sensitivity cases
8. Value vs List — verdict and three negotiation anchor numbers
9. Sources & Caveats

## Guardrails baked in

- Every sold price carries a source tier. AVM estimates are never comps, only a cross-check band.
- Point value never appears without a range and a confidence rating (High ±4%, Medium ±7%, Low ±10-12%).
- Unknown condition inputs get neutral assumptions, tagged "assumed" on the slide.
- Seller-reported claims are taken at half weight until verified.
- The build script **checks** the math and prints `WARN:` lines: comp weights sum to 1, base value matches the weighted comp sum, point value equals base plus condition total, no tier-3 comps, comp count within layout. Warnings are non-fatal by design so the deck still renders and you can look at it. **Treat every WARN as fix-before-delivery.** Nothing is blocked for you.
- The deck states on slides 2 and 9 that this is a valuation estimate, not a licensed (USPAP) appraisal.
- Comps: 3-5 in the grid. Fewer than 3 available means confidence Low, a wider range, and the shortage stated on the slide — never a padded grid.
- Unattended runs never stall on the interview: they build on neutral assumptions, drop confidence a level, and say so.

## Build command

```bash
NODE_PATH=$(npm root -g) \
  node scripts/build_deck.js appraisal_data.json output.pptx
```

Deps: `npm install -g pptxgenjs react react-dom react-icons sharp`

Deliver with `SendUserFile` (Cowork) or `present_files` (claude.ai). Do not assume `/mnt/user-data/outputs/` exists.

## Files

- `SKILL.md` — the 5-stage pipeline (intake → research → interview → synthesize → render)
- `references/methodology.md` — adjustment schedule, weighting, confidence rubric
- `references/interview.md` — the one-batch question set and dollar mappings
- `references/property_facts.md` — shared cross-skill facts cache, source tiers, domain ownership
- `references/rates_and_anchors.md` — every rate and dollar figure, each with an `as_of` date
- `references/data_sources.md` — comp sources by reliability tier, county portal quirks
- `references/data_schema.md` — JSON schema
- `scripts/build_deck.js` — 9-slide deck builder, shares the intel report's design system
- `examples/sample_appraisal_data.json` — synthetic worked example
