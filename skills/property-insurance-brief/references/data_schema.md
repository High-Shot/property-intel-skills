# insurance_data.json — Schema Reference

The build pipeline consumes a single JSON file and produces TWO outputs:

1. `output.pptx` — the 11-slide coverage decision brief
2. `spec_sheet.pdf` — the standalone one-page quote request / comparison worksheet

One interview, one JSON, two files. The `spec_sheet` section feeds both the PDF and the slide 9 preview.

Design system is locked and shared with property-intel-report and property-appraisal. Color tokens as named strings: `marine`, `teal`, `coral`, `green`, `crimson`, `amber`, `steel`. Icon tokens are react-icons/fa names already validated in the sibling build scripts (`FaWind`, `FaWater`, `FaShieldAlt`, `FaHome`, `FaUmbrella`, `FaBolt`, `FaCheckCircle`, `FaExclamationTriangle`, `FaDollarSign`, `FaFileAlt`). Unvalidated names fail at runtime.

## Slide map

| Slide | JSON section | Background |
|---|---|---|
| 1. Title | `title` | dark |
| 2. How Coastal Insurance Is Priced | `primer` | white |
| 3. Your Coverage Spec at a Glance | `coverage_spec` | white |
| 4. Coverage Line by Line | `coverage_lines` | white |
| 5. Wind Deductible Math | `wind_deductible` | white |
| 6. Flood: The Separate Policy | `flood` | white |
| 7. Price Levers Ranked | `levers` | white |
| 8. Estimated Premium Range | `premium_range` | white |
| 9. Quote Spec Sheet (preview) | `spec_sheet` | white |
| 10. Agent Script & Quote Red Flags | `agent_script` | dark |
| 11. Sources & Caveats | `sources` | dark |

Dark sandwich (1, 10, 11) mirrors the intel report's (1, 15, 16).

```jsonc
{
  "property": {
    "address": "123 Example Lane",      // required
    "city": "Fairhope",                  // required
    "state": "AL",                       // required, 2-letter
    "zip": "36532",                      // required
    "year_built": "1998",                // required for the spec sheet
    "sqft": "2,400",                     // string, required for spec sheet
    "construction": "Brick veneer",      // required for spec sheet
    "roof": "Architectural shingle, 2019 (permit-verified)",  // required
    "distance_to_coast": "4.1 mi to Mobile Bay",              // required in coastal markets
    "fema_zone": "X",                    // from intel report if available
    "bfe_note": "Zone X, no BFE. Lidar freeboard +12 ft."     // optional
  },

  "title": {
    "eyebrow": "HOMEOWNERS INSURANCE BRIEF",
    "tagline": "A coverage decision brief and quote-request package for a coastal Alabama buyer.",
    "status_tag": "COMPANION TO PROPERTY INTEL REPORT",   // optional coral pill
    "prepared_label": "PREPARED <MONTH YEAR>"   // generated from the run date, never hardcoded                // defaults to current month/year
  },

  "primer": {
    "title": "Why Coastal Quotes Vary So Much",
    "subtitle": "Same house, same coverage — premiums can differ by more than 100% across carriers (ALDOI).",
    "cards": [
      // Exactly 4 cards, 2×2. Each explains one structural fact of the market.
      { "icon": "FaWind",      "label": "WIND VS NON-WIND",     "color": "crimson",
        "body": "Coastal policies split into wind/hurricane and all-other-perils. Wind is the majority of your premium here and carries its own percentage deductible." },
      { "icon": "FaShieldAlt", "label": "THREE MARKETS, ONE HOUSE", "color": "amber",
        "body": "Coastal risks place three ways: admitted carriers, surplus lines (e.g. Lloyd's), or the AIUA wind pool. Surplus lines adds the state's surplus-lines tax and a minimum earned premium (rates in rates_and_anchors.md; verify for the state), and no guaranty fund." },
      { "icon": "FaHome",      "label": "MITIGATION IS THE LEVER", "color": "green",
        "body": "FORTIFIED certification and roof age move coastal premiums more than any coverage choice. State DOI filings show material wind-mitigation reductions where a certification program exists (cite the actual filing and figure)." },
      { "icon": "FaDollarSign","label": "DEFAULTS ARE EXPENSIVE", "color": "teal",
        "body": "Agents quote conservative defaults when you specify nothing. This brief exists so every quote comes back on YOUR spec." }
    ],
    "source_note": "Sources: ALDOI premium comparison, AL Coastal Insurance Shopper's Guide (Smart Home America)."
  },

  "coverage_spec": {
    "title": "Your Coverage Spec at a Glance",
    "subtitle": "Built from your interview answers. This is what every agent quotes against.",
    "stats": [
      // 6 big-number cards, 3×2 — same component as intel report's at_a_glance.
      { "big": "$385,000", "label": "DWELLING (COV A)", "sub": "Replacement cost basis, est.", "color": "marine" },
      { "big": "2%",       "label": "WIND DEDUCTIBLE",  "sub": "= $7,700 out of pocket",       "color": "crimson" },
      { "big": "$2,500",   "label": "AOP DEDUCTIBLE",   "sub": "All other perils",             "color": "coral" },
      { "big": "50%",      "label": "PERSONAL PROPERTY","sub": "Of Cov A · replacement cost",  "color": "teal" },
      { "big": "$300K",    "label": "LIABILITY",        "sub": "Umbrella deferred",            "color": "green" },
      { "big": "NO",       "label": "FLOOD (SEPARATE)", "sub": "Zone X, not lender-required",  "color": "amber" }
    ],
    "source_note": "Dwelling basis is an estimate until a carrier replacement-cost estimator runs."
  },

  "coverage_lines": {
    "title": "Every Line, Explained",
    "subtitle": "What each coverage does and the level you chose.",
    "rows": [
      // 7-9 rows. Table layout: line / chosen level / one-line plain-English what-it-does.
      { "line": "Dwelling (Cov A)", "chosen": "$385,000 est. replacement cost",
        "what": "Rebuild cost of the structure. Not the purchase price — land doesn't burn." },
      { "line": "Other structures (Cov B)", "chosen": "10% of Cov A (default)",
        "what": "Detached garage, fence, shed." },
      { "line": "Personal property (Cov C)", "chosen": "50% of Cov A, replacement cost endorsement",
        "what": "Your stuff. Replacement cost pays new-for-old; ACV deducts depreciation." },
      { "line": "Loss of use (Cov D)", "chosen": "20% of Cov A (default)",
        "what": "Rent and living costs if the house is uninhabitable after a covered loss." },
      { "line": "Liability (Cov E)", "chosen": "$300,000",
        "what": "Lawsuits for injury or damage you cause. Cheapest coverage per dollar on the policy." },
      { "line": "Medical payments (Cov F)", "chosen": "$5,000",
        "what": "Small no-fault medical bills for guests." },
      { "line": "Water backup", "chosen": "Add — $10,000",
        "what": "Sewer/sump backup. Excluded by default on most policies." },
      { "line": "Ordinance or law", "chosen": "Add — 25% of Cov A",
        "what": "Cost of rebuilding to CURRENT code. Matters on any pre-2006 coastal home." }
    ],
    "source_note": ""
  },

  "wind_deductible": {
    "title": "The Wind Deductible, In Dollars",
    "subtitle": "Percentage deductibles hide the real number. Here it is against your $385K dwelling coverage.",
    "options": [
      // Exactly 3 cards — the three deductibles actually offered in this market (commonly 1/2/5, sometimes 2/3/5 per real quotes). Chosen one gets "chosen": true → renders with accent border + pill.
      { "pct": "1%", "dollars": "$3,850", "chosen": false, "color": "green",
        "note": "Lowest storm-day exposure, highest premium." },
      { "pct": "2%", "dollars": "$7,700", "chosen": "default", "color": "coral",
        "note": "Standard spec on every property. Meaningful premium relief vs 1%." },   // standing rule: 2% is never asked
      { "pct": "5%", "dollars": "$19,250", "chosen": false, "color": "crimson",
        "note": "Cheapest premium. One named storm claim costs more than years of savings." }
    ],
    "framing": "Every spec carries the standard 2% wind deductible: $7,700 out of pocket on this house after a named storm. 1% and 5% are quoted beside it.",
    "detail_note": "Named-storm vs hurricane vs wind/hail deductible triggers differ by carrier. The spec sheet forces each quote to state its trigger.",
    "source_note": ""
  },

  "flood": {
    "title": "Flood Is Always a Separate Policy",
    "subtitle": "No homeowners policy covers rising water. Here's this property's picture.",
    "facts": [
      // 3-4 stat cards fed by the intel report when both skills run on the same property.
      { "big": "Zone X",  "label": "FEMA FLOOD ZONE",  "sub": "Outside SFHA — not lender-required", "color": "green" },
      { "big": "+12 ft",  "label": "LIDAR FREEBOARD",  "sub": "Est. elevation above nearest flood source", "color": "teal" },
      { "big": "~$500-900/yr", "label": "NFIP BALLPARK", "sub": "Zone X standard-rated, est. — quote to confirm", "color": "amber" }
    ],
    "body": "Zone X means flood coverage is optional and cheap — which is exactly when it's worth quoting. Storm surge and rain-driven flooding don't respect zone lines, and 'preferred risk' pricing exists because the actuarial risk is low, not zero.",
    "recommendation": "Not quoting flood: Zone X, so the lender does not require it. An NFIP quote is one call away if you want it.",   // standing rule: quote flood only in an SFHA (A/V)
    "source_note": "Zone and freeboard from property-intel-report research (FEMA MSC, USGS lidar)."
  },

  "levers": {
    "title": "What Actually Moves the Premium",
    "subtitle": "Ranked by impact for this property. Direction is sourced; magnitudes are ranges, not promises.",
    "items": [
      // 5-6 ranked rows: rank / lever / status on this property / impact.
      { "rank": "1", "lever": "FORTIFIED certification", "status": "Not certified. Roof (2019) may qualify for FORTIFIED Roof retrofit.",
        "impact": "Largest single wind-premium discount where a state mitigation program exists; ALDOI-mandated credits. Strengthen Alabama Homes grants may offset retrofit cost.", "color": "green" },
      { "rank": "2", "lever": "Wind deductible choice", "status": "2% selected.",
        "impact": "Each step 1% → 2% → 5% trades premium for storm-day cash exposure. Quoted three ways on the spec sheet.", "color": "coral" },
      { "rank": "3", "lever": "Roof age & material", "status": "2019 architectural shingle, permit-verified.",
        "impact": "Roof age cliffs are carrier- and state-specific; ~10 years is a common threshold but verify against the actual quotes in hand. Verify each quote used 2019, not year built.", "color": "teal" },
      { "rank": "4", "lever": "Bundling & payment", "status": "Auto policy available to bundle.",
        "impact": "Multi-policy and paid-in-full discounts are routine asks. Zero coverage cost.", "color": "amber" },
      { "rank": "5", "lever": "Insurance score & claims history", "status": "No claims, no lapses (per interview).",
        "impact": "One of the largest pricing factors in wind-exposed markets. Nothing to fix here — just make sure quotes reflect it.", "color": "marine" }
    ],
    "source_note": "Sources: ALDOI wind-mitigation comparisons, Strengthen Alabama Homes, IBHS FORTIFIED."
  },

  "premium_range": {
    "title": "A Rough Range, Honestly Labeled",
    "subtitle": "This is context for quote-shopping, not a quote. Coastal spreads are wide by nature.",
    "range_low": "$3,200",
    "range_high": "$6,500",
    "range_label": "EST. ANNUAL PREMIUM — HOMEOWNERS ONLY, EXCL. FLOOD",
    "basis_lines": [
      // 3-5 lines walking the anchor points. Every line names its source.
      { "label": "ALDOI comparison, $300K Cov A profile, Baldwin County territory", "value": "anchor" },
      { "label": "State avg for $300K dwelling (<named rate study>, <year>)", "value": "$3,287/yr" },
      { "label": "Coastal Baldwin uplift vs state avg", "value": "direction: up" },
      { "label": "Wind mitigation (if FORTIFIED pursued)", "value": "range shifts down materially" }
    ],
    "caveat": "Real quotes on this spec will land inside OR outside this range. That's the point of getting three of them on identical assumptions.",
    "source_note": "Sources: ALDOI ComparePremiums (HO-3 profiles), Insurify AL rate data. All figures est."
  },

  "spec_sheet": {
    // Feeds BOTH the standalone PDF and the slide 9 preview thumbnail.
    "headline": "Quote Request & Comparison Worksheet",
    "instruction": "Give one copy to each of three agents. Every quote must price THIS spec. Differences go in the notes row, not silently into the price.",
    "property_block": [
      // Left column, top: property facts. Label/value pairs, 6-9 rows.
      { "label": "Address",           "value": "123 Example Lane, Fairhope, AL 36532" },
      { "label": "Year built / sqft", "value": "1998 · 2,400 sqft" },
      { "label": "Construction",      "value": "Brick veneer" },
      { "label": "Roof",              "value": "Architectural shingle, 2019 (permit-verified)" },
      { "label": "Distance to coast", "value": "4.1 mi to Mobile Bay" },
      { "label": "FEMA flood zone",   "value": "X (flood quoted separately)" },
      { "label": "Occupancy",         "value": "Primary residence" },
      { "label": "Claims / lapses",   "value": "None / none" }
    ],
    "coverage_block": [
      // Left column, bottom: the requested spec. Label/value pairs, 8-10 rows.
      { "label": "Dwelling (Cov A)",   "value": "$385,000 est. RC — run your estimator, show the number" },
      { "label": "Wind/hurricane ded.","value": "2% — ALSO quote 1% and 5%" },
      { "label": "AOP deductible",     "value": "$2,500" },
      { "label": "Personal property",  "value": "50% Cov A, replacement cost" },
      { "label": "Liability / MedPay", "value": "$300,000 / $5,000" },
      { "label": "Water backup",       "value": "$10,000" },
      { "label": "Ordinance or law",   "value": "25% Cov A" },
      { "label": "Roof settlement",    "value": "Replacement cost — state if ACV or schedule applies" },
      { "label": "FORTIFIED credit",   "value": "State the credit if roof qualifies" }
    ],
    "quote_columns": {
      // Right side: 3 blank columns the agent/buyer fills in by hand.
      "column_headers": ["QUOTE 1", "QUOTE 2", "QUOTE 3"],
      "rows": [
        "Carrier & channel (admitted / surplus)",
        "Total cost ($ premium + all fees + taxes)",
        "Wind deductible ($ and trigger)",
        "AOP deductible ($)",
        "Roof settlement (RCV or age-ACV form?)",
        "Min. earned premium %",
        "FORTIFIED credit applied?",
        "Notable exclusions",
        "Deviations from spec"
      ]
    },
    "footer": "Estimates in this packet are labeled and sourced. Quotes below are the real numbers. Prepared with the buyer's coverage brief, <Month YYYY>."
  },

  "agent_script": {
    "title": "Work the Script",
    "subtitle": "Questions that separate a good policy from a cheap-looking one.",
    "questions": [
      // 6-8 items, left column (dark slide).
      "Is the wind deductible triggered by 'named storm,' 'hurricane,' or 'wind/hail'? Show me the definition page.",
      "Is roof settlement replacement cost, ACV, or a payment schedule by age?",
      "Does this policy have a cosmetic damage exclusion for metal roofs or siding?",
      "What FORTIFIED credit applies if I certify the roof, in dollars on THIS quote?",
      "Is this voluntary market or the AIUA wind pool? If pool, what did the voluntary carriers decline?",
      "What does the same policy cost with 1% and 5% wind deductibles?",
      "Which discounts are already in this number — bundle, paid-in-full, alarm, claims-free?"
    ],
    "red_flags_label": "RED FLAGS IN A QUOTE",
    "red_flags": [
      // 4-6 items, right column.
      "Dwelling coverage suspiciously below the replacement-cost estimate — underinsurance disguised as savings.",
      "ACV roof settlement on a shingle roof — the discount comes out of your first claim.",
      "No wind deductible dollar figure shown, only a percentage.",
      "Flood 'included' claims — homeowners policies exclude flood; something else is being sold.",
      "A quote delivered without a single question asked about the property."
    ],
    "footer_note": "A quote you can't compare is a quote you can't trust."
  },

  "sources": {
    "title": "Show Your Work",
    "list": [
      "ALDOI ComparePremiums — real HO-3 premiums by company and territory",
      "Alabama Coastal Insurance Shopper's Guide — Smart Home America / ALDOI",
      "Strengthen Alabama Homes — FORTIFIED grant program",
      "IBHS FORTIFIED Home standard",
      "FEMA Map Service Center — flood zone",
      "property-intel-report research file for this address (when run)"
    ],
    "caveats": [
      "All premium figures are estimates for orientation, not quotes. Only a carrier can quote.",
      "This brief is educational decision support, not insurance advice; the buyer selects coverage.",
      "Replacement cost estimate is provisional until a carrier estimator runs.",
      "Rates, credits, and carrier appetite change frequently; figures dated as of preparation."
    ]
  }
}
```

## Validation rules

- **Array lengths are layout contracts.** Exactly 4 primer cards, exactly 6 coverage_spec stats, exactly 3 wind_deductible options, 7-9 coverage_lines rows, 5-6 lever items, 6-8 script questions, 4-6 red flags. Overflow pushes content off the slide.
- **Body text limits.** Card bodies and lever impact lines under 200 characters.
- **`chosen` flag.** Exactly one wind_deductible option must have `chosen: true`.
- **Every dollar figure the buyer didn't choose is an estimate** and must carry "est." in the string. Chosen coverage levels (deductibles, liability limit) are selections, not estimates — no label.
- **`premium_range.basis_lines`** must name a source per line. No source, no line.
- **Spec sheet quote_columns.rows** are fixed labels (9 rows) — do not add rows without checking the PDF fits one page. Quotes compare on TOTAL cost (premium + fees + taxes), never on property premium alone; surplus lines channel and minimum earned premium are grid rows because they change what the number means.
- **Colors and icons**: named palette tokens and validated FA names only.

## market_profile

Top-level string, set at intake. `"coastal"` or `"inland"`. It decides three things:

| | coastal | inland |
|---|---|---|
| `wind_deductible` | required, exactly 3 options | omit the key entirely |
| Slide 5 | percentage steps in dollars | flat AOP deductible plus any separate wind/hail deductible |
| Lever 1 | state mitigation program (FORTIFIED or equivalent) | drop it if no program exists; 4 levers is fine |

The builder warns if `wind_deductible` is populated on an inland profile. Default when the key is absent is `"coastal"`, for backward compatibility with existing data files.

## The `chosen` flag

Three states, not two:

- `chosen: true` — the buyer selected this option in the interview.
- `chosen: "default"` — nobody selected it. This is the neutral default shown because the interview was skipped or answered "I don't know." The caveats slide **must** carry a line saying so; the builder warns if it does not.
- `chosen: false` — not the shown option.

Exactly one option carries `true` or `"default"`. Never fake a selection to satisfy the layout.

## Basis lines

Floor of 1, ceiling of 5. Every line names its source; no source, no line.

Three sourced anchors is the good case. States without a DOI premium comparison tool will yield fewer, and one honest anchor beats three padded ones. Below 3, the caveats slide must say why the anchor set is thin. The builder warns if it does not.

## Date handling

No date is ever hardcoded. `prepared_label`, footer dates, and rate-study years are generated from the run date or from the actual study cited. A literal month and year in this document is a placeholder.
