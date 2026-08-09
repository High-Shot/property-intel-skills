# appraisal_data.json Schema

Mirrors the 9 slides. Fill every field. Numbers are raw (no $ or commas); the build script formats. Strings ending in "est." render with the estimate label. Null/missing optional fields render as "—".

```json
{
  "property": {
    "address": "123 Main St",                  // street only, for the title slide
    "city_state_zip": "Daphne, AL 36526",
    "list_price": 425000,                       // number, or null if off-market
    "beds": 4, "baths": 2.5, "sqft": 2350,
    "lot_acres": 0.42, "year_built": 1998,
    "parcel_id": "05-46-03-...",                // or "unavailable"
    "report_date": "<Month D, YYYY>"   // generated from the run date, never hardcoded
  },

  "value_conclusion": {                          // SLIDE 2
    "point_value": 408000,
    "range_low": 390000,
    "range_high": 426000,
    "confidence": "Medium",                      // High | Medium | Low
    "confidence_reason": "4 comps, 3 Tier 1, one 9 months old; buyer walked the property.",
    "vs_list_verdict": "Priced above value",     // one of the four verdicts in methodology §8
    "vs_list_detail": "List is $17K (4.2%) above the indicated point value."
  },

  "subject_profile": {                           // SLIDE 3
    "public_facts": [                            // 6-8 rows
      { "label": "Square feet", "value": "2,350 (county record)" },
      { "label": "Last sale", "value": "$310,000 — Mar 2019" }
    ],
    "interview_inputs": [                        // 6-8 rows, from the interview
      { "label": "Roof", "value": "2012 architectural shingle (14 yrs)", "impact": "negative" },
      { "label": "Kitchen", "value": "Full remodel 2023, ~$45K", "impact": "positive" }
      // impact: positive | negative | neutral | assumed
    ],
    "walked": true                               // from Q0
  },

  "comps": [                                     // SLIDE 4 — 3 to 5 entries
    {
      "address": "456 Oak Ln",
      "sold_date": "Apr 2026",
      "sold_price": 415000,
      "sqft": 2280,
      "ppsf": 182,                               // sold_price / sqft, rounded
      "distance_mi": 0.4,
      "source": "Redfin sold page (MLS)",
      "source_tier": 1,                          // 1 or 2 only — never 3
      "key_diffs": "Similar age; smaller lot; original kitchen",
      "net_adjustment": 12000,                   // signed number
      "adjusted_value": 427000,
      "weight": 0.30                             // all weights sum to 1.0
    }
  ],

  "adjustment_schedule": [                       // SLIDE 5 — 5-8 rows, only rates actually used
    {
      "item": "Market/time",
      "rate": "+0.3%/month",
      "basis": "<County> median $/sqft up X.X% YoY (Redfin Data Center)",
      "applied_to": "All comps by months since sale"
    },
    {
      "item": "GLA (sqft)",
      "rate": "$78/sqft",
      "basis": "40% of market $195/sqft",
      "applied_to": "Comps 1, 3, 4"
    }
  ],

  "condition_adjustments": [                     // SLIDE 6 — from the interview
    {
      "item": "Roof (14 yrs)",
      "finding": "Original 2012 shingle; 3 yrs remaining life est.",
      "amount": -13000,                          // signed
      "tag": "verified",                         // verified | assumed | reported-unverified | est.
      "note": "Replacement midpoint $16K prorated"
    }
  ],
  "condition_total": -4000,                      // signed sum

  "reconciliation": {                            // SLIDE 7
    "base_indicated_value": 412000,              // weighted comp value, before condition
    "narrative": "Comps 1 and 3 carry 60% of the weight...", // 2-4 sentences: weighting logic, any relaxations, AVM divergence explanation
    "avm_checks": [                              // 2-3 entries
      { "source": "Zestimate", "value": 421300 },
      { "source": "Redfin Estimate", "value": 402800 }
    ],
    "sensitivity": {
      "low_case": 385000,
      "low_note": "Assumed HVAC age resolves at 15+ yrs; weakest comp removed",
      "high_case": 422000,
      "high_note": "Time adjustment at top of range; assumed items resolve favorably"
    }
  },

  "value_vs_price": {                            // SLIDE 8
    "list_price": 425000,
    "point_value": 408000,
    "delta": -17000,                             // point_value - list_price (signed)
    "delta_pct": -4.0,
    "verdict_headline": "Priced above value",
    "anchor_points": [                           // exactly 3
      { "label": "Walk-away ceiling", "value": 390000, "note": "Range low — below this you have margin" },
      { "label": "Fair value", "value": 408000, "note": "Point value — a clean deal" },
      { "label": "Seller's premium", "value": 425000, "note": "List — paying $17K above indicated value" }
    ],
    "bottom_line": "One sentence, the buyer's actual situation."
  },

  "sources": [                                   // SLIDE 9 — 5-8 rows
    { "category": "Sold comps", "detail": "Redfin and Movoto sold pages (MLS-fed), pulled <Mon D YYYY>" },
    { "category": "Market trend", "detail": "Redfin Data Center, <County>, <Month YYYY> release" }
  ],
  "caveats": [                                   // 3-6 strings
    "This is a valuation estimate, not a USPAP licensed appraisal.",
    "<County> tax figures are estimates; verify at the Revenue Commission.",
    "Condition inputs tagged "assumed" are listed here by name; the count must match the number of rows actually tagged — see slide 6 tags."
  ]
}
```

## Field rules

- `comps[].weight` must sum to 1.0 ±0.01.
- `comps[].source_tier` is 1 or 2. A tier-3 price is a schema violation.
- `condition_total` must equal the sum of `condition_adjustments[].amount`.
- `point_value` should equal `base_indicated_value + condition_total` (rounded to nearest $1,000). If they differ, the build script prints a warning.
- `range_low`/`range_high` must bracket `point_value` per the confidence rubric widths.
- Max 5 comps, max 8 condition adjustments, max 8 schedule rows — layout limits.

## Thin-comp path

The grid holds 3-5 comps. When research cannot produce 3:

- Render the 1-2 comps that exist. Do not duplicate a comp, do not stretch the radius past the point of comparability to reach a count, and never promote an AVM into the grid.
- Set `confidence` to Low and widen `value_conclusion` to at least ±15%.
- Put one sentence on the comp slide naming the constraint: "Two closed sales met the criteria within 3 miles in 12 months; rural market, thin volume."
- Give the AVM band more visual weight in reconciliation, still labeled as a cross-check and never blended into the comp math.

A short, honest grid beats a padded one. The builder warns above 5 comps, not below 3.

## Date handling

No date is ever hardcoded in this schema. `report_date`, source pull dates, and data-release labels are generated from the run date at synthesis time. A literal month and year in a schema example is a placeholder, not a default — if you see one, it is a defect.
