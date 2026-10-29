# property-insurance-brief

Homeowners insurance coverage decision brief and quote-request package for residential property buyers. Third skill in the property family:

| Skill | Question it answers |
|---|---|
| property-intel-report | What am I buying and what could go wrong? |
| property-appraisal | What is it actually worth? |
| **property-insurance-brief** | How do I insure it without overpaying or underinsuring? |

## Outputs

One JSON, two files:

1. **11-slide PowerPoint** — coverage primer, spec at a glance, line-by-line explanations, wind deductible math in dollars, flood picture, ranked price levers, an honestly-sourced premium range, agent script, and red flags.
2. **One-page PDF spec sheet** — property facts and the requested coverage spec on the left, three blank quote columns on the right. The buyer hands one to each of three agents so every quote prices the identical spec.

## Pipeline

Intake → Research → one-batch Interview → Synthesize (`insurance_data.json`) → Render (PPTX + PDF). See SKILL.md.

## Structure

```
property-insurance-brief/
├── SKILL.md
├── README.md
├── scripts/
│   ├── build_deck.js          # 11-slide PPTX (pptxgenjs)
│   └── build_spec_sheet.py    # spec sheet PDF: quote worksheet + carrier intake page (reportlab)
├── references/
│   ├── data_schema.md         # JSON schema, slide map, validation contracts
│   ├── interview.md           # one-batch question set + answer-to-spec mapping
│   └── data_sources.md        # premium anchors and fact sources by reliability
└── examples/
    └── illustrative_fairhope/
        └── insurance_data.json  # worked example — read in full before any new build
```

## Build commands

```bash
NODE_PATH=$(npm root -g) \
  node scripts/build_deck.js insurance_data.json output.pptx
python3 scripts/build_spec_sheet.py insurance_data.json spec_sheet.pdf
```

## Honesty rules

No figure is ever a quote. Premium anchors name their sources line by line. Cov A is labeled est. until a carrier estimator runs. Defaulted (uninterviewed) spec lines are flagged on the caveats slide. The not-insurance-advice disclaimer renders on every slide and the PDF.

## Market profile

Set `market_profile` at intake: `"coastal"` or `"inland"`.

Coastal markets get percentage wind deductibles, placement channels (admitted / surplus lines / wind pool), and state mitigation credits. Inland markets get a flat all-other-perils deductible plus any separate wind or hail deductible, and a different lever set. Slide 5 renders on both; only its content changes. The builder warns if `wind_deductible` is populated on an inland profile.

## The three-state `chosen` flag

- `true` — the buyer selected it.
- `"default"` — nobody selected it; this is the neutral default because the interview was skipped or answered "I don't know". The caveats slide must say so, and the builder warns if it does not.
- `false` — not the shown option.

Exactly one option carries `true` or `"default"`. Never fake a selection to satisfy a layout contract.

## What the builders enforce

`build_deck.js` prints `WARN:` lines for layout and arithmetic contract violations. Non-fatal by design so the deck still renders; treat every WARN as fix-before-delivery.

`build_spec_sheet.py` measures both columns against the footer floor **before drawing** and exits non-zero with a specific message naming which block overflowed and by how much. A non-zero exit means trim rows or shorten values, not retry.

## Sibling skills

| Skill | Answers | Owns |
|---|---|---|
| property-intel-report | What am I buying and what could go wrong? | Parcel, permits, hazard, schools, diligence budget |
| property-appraisal | What is it worth? | Market value, comp adjustments, offer anchors |
| **property-insurance-brief** | How do I insure it? | **Premiums, deductibles, coverage spec, flood cost** |

All three read and write a shared `property_facts.json`. See `references/property_facts.md`. When this skill runs after a sibling, read year built, sqft, construction, roof age, FEMA zone, BFE, freeboard, and distance to coast from the cache as typed fields — never re-parse them from a sibling deck's slide copy.

Note that market value is **not** Cov A. Cov A anchors to rebuild cost.
