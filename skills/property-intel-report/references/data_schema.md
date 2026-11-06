# property_data.json — Schema Reference

Slide map: 1 title · 2 exec summary · 3 at a glance · 4 monthly carry (+ five-year strip from `projection`) · 5 price trajectory · 6 tax & assessment (`tax_record`) · 7 title, liens & permits (`title_record`) · 8 schools · 9 site & surroundings (`climate`) · 10 diligence budget · 11 competing inventory · 12 red flags · 13 question scripts · 14 action plan · 15 offer strategy · 16 sources & caveats.

The deck builder consumes a single JSON file with the structure below. Every field maps to a slide. Fill all required fields. Optional fields are marked.

Color tokens accepted as named strings: `marine`, `teal`, `coral`, `green`, `crimson`, `amber`, `steel`. Since v1.2 the builder ignores color on decorative cards (stat cards, carry scenarios, schools, diligence groups, scripts, action phases): chrome is ink, and coral is reserved for the opening offer. Color still renders where it means something: exec summary good/caution/bad, climate risk levels, encumbrance status, red flags, offer triggers. Write labels in sentence case; the builder sentence-cases all-caps text anyway.

Icon tokens are React-Icons / Font Awesome names: `FaWind`, `FaWater`, `FaTree`, `FaShieldAlt`, `FaBolt`, `FaFire`, `FaCheckCircle`, `FaExclamationTriangle`, `FaTimesCircle`, etc. Find any FA icon name at react-icons.github.io/react-icons.

```jsonc
{
  "property": {
    "address": "1090 Willow Bend Road",   // required
    "city": "Fairhope",                      // required
    "state": "AL",                           // required, 2-letter
    "zip": "36532",                          // required
    "mls": "391218",                         // optional
    "parcel": "4709310001070"                // optional
  },

  "title": {
    "eyebrow": "PROPERTY INTELLIGENCE REPORT",
    "tagline": "A buyer's diligence brief on a 1986 fixer-upper, 2.4 acres near Fish River.",
    "status_tag": "STATUS: PENDING · BACKUP OFFER PLAY",  // optional, renders coral pill
    "prepared_label": "PREPARED <MONTH YEAR>"   // generated from the run date, never hardcoded
  },

  "exec_summary": {
    "headline": "Strengths, Problems, and Deal Risks",
    "good": [ "string", "..." ],     // 5-7 items
    "bad":  [ "string", "..." ],
    "ugly": [ "string", "..." ]
  },

  "at_a_glance": {
    "title": "The Property in Numbers",
    "stats": [
      { "big": "$389,000", "label": "Current list price", "sub": "Down from $519,900",
        "src": "MLS · T1" },     // src: short source tag in mono, the family signature (source · tier)
      { "big": "2,875",    "label": "Living square feet", "sub": "$135 / sqft", "src": "County record · T1" },
      // up to 6 cards, 3 cols x 2 rows. Fewer renders fine
    ],
    "source_note": "Sources: MLS, Zillow public records."   // optional
  },

  "monthly_carry": {
    "title": "What You Actually Pay Each Month",
    "subtitle": "Based on $X negotiated purchase, current Freddie Mac PMMS rate of Y%...",
    "scenarios": [
      // Exactly 4 cards: 10% / 20% / 25% / cash, always in this order.
      // The one true fixed count here: the four scenarios are standard, not property-dependent.
      { "label": "10% DOWN", "color": "crimson",
        "down": 36500, "loan": 328500,
        "pi": 2034, "pmi": 192, "tax": 145, "ins": 350, "wind": 225, "flood": 80,
        "total": 3026,
        "note": "PMI required until 78% LTV." },
      // ... 20% (coral), 25% (amber), cash (green)
      // For values that don't apply (no PMI, no loan), pass null or "—"
    ],
    "source_note": "Tax estimate uses post-sale reassessment..."
  },

  "price_history": {
    "title": "<N> Cuts, <D> Days, Minus <P>%",
    "subtitle": "From $519,900 to $389,000 — 25% off original.",
    "points": [
      { "label": "Jun 2025",  "price": 519900 },
      { "label": "Jul 14",    "price": 499900 },
      // ... typically 6-12 points
    ],
    "callouts_label": "THE NUMBERS",
    "callouts": [
      // up to 5 stat cards in the dark right rail. Render only the ones the price
      // history supports; a 5-day-old listing at original price has none of them.
      { "big": "-$130,900", "label": "Total reduction" },
      { "big": "-25.2%",    "label": "Off original ask" },
      { "big": "11",        "label": "Price cuts" },        // points minus one
      { "big": "308 days",  "label": "On market this cycle" },  // from the first listing date
      { "big": "2 cycles",  "label": "Listings withdrawn" }
    ],
    "source_note": "Sources: Zillow MLS history."
  },

  "tax_record": {                          // SLIDE 6. Source: county revenue commission / assessor (tier 1)
    "title": "A Homestead Bill That Resets at Closing",
    "subtitle": "...",
    "stats": [                             // up to 4 cards: appraised, assessed, tax paid, post-sale est.
      { "big": "$318,000", "label": "COUNTY APPRAISED (2025)", "sub": "Revenue commission market value", "color": "teal" },
      { "big": "$1,740",   "label": "POST-SALE EST. / YR",     "sub": "+$29/mo vs the seller's bill",   "color": "coral" }
    ],
    "history_title": "Annual tax paid · up 8% a year since 2020",
    "history": [ { "year": 2020, "tax": 945 }, { "year": 2025, "tax": 1388 } ],   // oldest first, up to 10
    "millage_label": "MILLAGE STACK (UNINCORPORATED)",
    "millage": [ { "authority": "State of Alabama", "mills": 6.5 } ],         // up to 6; must sum to millage_total
    "millage_total": 43.65,
    "exemptions": [ { "name": "Homestead (seller's)", "effect": "Ends at sale. File your own by Dec 31." } ],  // up to 3
    "reset": {                             // the number the slide exists to show
      "current_annual": 1388, "post_sale_annual": 1740, "monthly_delta": 29,   // (post - current) / 12
      "math": "$389K x 10% x 43.65 mills = $1,698, plus $42 fire district dues"
    },
    "flag": "Special assessment: $42/yr fire dues. No delinquency or tax-sale history.",  // optional, one line, crimson
    "source_note": "Sources: Baldwin County Revenue Commission, ADOR millage table."
  },

  "title_record": {                        // SLIDE 7. Sources: probate / recorder indexes, permit portal, recorded plat
    "title": "A Clean Chain, One Loose Permit",
    "subtitle": "...",
    "deed_chain": [                        // newest first, up to 5. Transfer TYPE, never a person's name
      { "date": "2011-06", "type": "Warranty deed, individual", "price": "$205,000", "note": "Current owner; 15-year hold" }
    ],
    "encumbrances": [                      // up to 4: mortgages (with est. remaining and seller equity), liens, judgments, lis pendens
      { "item": "Mortgage (2011)", "status": "OPEN", "detail": "$164,000 original; est. $95K remaining...", "color": "amber" },
      { "item": "Liens and judgments", "status": "NONE FOUND", "detail": "Probate index searched by parcel.", "color": "green" }
    ],
    "permits": [ { "year": "2019", "work": "Accessory shed", "status": "Expired, no final" } ],   // up to 6
    "permits_note": "",                    // shown when permits is empty
    "mismatches": [ { "field": "Bedrooms", "record": "3", "listing": "4 (bonus room)" } ],    // up to 3; each needs a caveat
    "easements": "Recorded plat shows a 20-ft drainage easement...",
    "footer": "Pre-offer screen from public records. The title commitment and survey govern.",
    "source_note": "Sources: Baldwin County Probate, county permit portal, recorded plat."
  },

  // Not rendered as its own slide. The comp screen is kept as data so its arithmetic can be
  // checked, and its conclusion is cited in offer.rationale_lines. property-appraisal owns
  // the value; when its value block exists, the rationale cites that number instead.
  "comps": {
    "title": "What the Subject Should Cost",
    "subtitle": "Normalized $/sqft analysis...",
    "chart_title": "$ per sqft  ·  Willow Bend Road corridor",
    "entries": [
      // 3-7 bars, subject last with a shorter label. Minimum 3 comps + subject.
      // If research returned 3, render 3 and state the count on the slide. Never pad.
      { "label": "12013\n(2012, creek)", "psf": 173 },
      { "label": "Subject\n1090",       "psf": 135 }
    ],
    "fair_value_walk": [
      // 5-6 lines. Last one styled as the conclusion (coral text).
      { "label": "Comp average",                      "value": "$176 / sqft" },
      { "label": "Strip waterfront premium",          "value": "-15%" },
      { "label": "Strip newer-build premium",         "value": "-10%" },
      { "label": "Adjusted base (1986, no water)",    "value": "$135 / sqft" },
      { "label": "Apply fixer discount (-25%)",       "value": "$101 / sqft" }
    ],
    "implied_range": "$290K – $388K",
    "implied_takeaway": "Subject's $389K ask sits at the top of fair value...",
    "source_note": "Comp $/sqft from recorded sales (county probate, MLS closed records). Never an AVM."
  },

  // Rendered as the "IN FIVE YEARS" strip under the carry cards on slide 4, not its own slide.
  "projection": {
    "title": "What This Property Costs Over Time",
    "subtitle": "Tax has grown X% in Y years and insurance is escalating...",
    "chart_title": "Monthly carry by component  ·  $/month",
    "years": [
      // 5 entries, year 1 through year 5
      { "label": "Year 1\n<YYYY>", "pi": 1807, "tax": 145, "ins": 655 },
      { "label": "Year 2",       "pi": 1807, "tax": 154, "ins": 701 },
      { "label": "Year 3",       "pi": 1807, "tax": 163, "ins": 750 },
      { "label": "Year 4",       "pi": 1807, "tax": 173, "ins": 802 },
      { "label": "Year 5\n<YYYY+4>", "pi": 1807, "tax": 183, "ins": 858 }
    ],
    "year1_carry": 2607,
    "year5_carry": 2848,
    "delta_label": "+$241/mo",
    "delta_sub": "by year 5  ·  +9.2% nominal",
    "cumulative_note": "Cumulative 5-yr extra cost over flat baseline: $7,008 (year deltas $55 + $113 + $175 + $241, x 12).",
    "source_note": "Assumes 6% annual tax growth, 7% insurance growth..."
  },

  "schools": {
    "title": "School Assignments",
    "subtitle": "Top-decile public schools — primary resale-floor driver.",
    "list": [
      // up to 3 schools. Elementary/middle/high is the common case; K-8, four-tier,
      // and consolidated rural districts differ. Render the assigned schools that
      // exist and label the tier structure. Custom colors optional.
      { "name": "J. Larry Newton School", "grades": "PK – 6",
        "rating": "9", "rating_sub": "/10 GreatSchools",
        "distance": "2.4 mi",
        "facts": "846 students  ·  17:1 ratio  ·  State 92/A",
        "tagline": "A− on Niche",
        "color": "green" }
      // ... 2 more
    ],
    "source_note": "Sources: GreatSchools.org, Niche, district website."
  },

  "climate": {                            // SLIDE 9 — Site & Surroundings: hazard scores + site facts
    "title": "Climate, Site & Surroundings",
    "subtitle": "...",
    "risks": [
      // up to 6 cards, 3 cols x 2 rows. The six categories are a national superset.
      // Categories that do not apply in the region collapse into ONE "not applicable
      // in this market" card, never six cards of filler.
      { "icon": "FaWind",   "label": "STORM (HURRICANE)", "level": "73 / 100  ·  SEVERE",
        "color": "crimson", "body": "Augurisk Storm Risk: 73%..." },
      { "icon": "FaWater",  "label": "FLOOD",             "level": "46 / 100  ·  MODERATE",
        "color": "amber",   "body": "Augurisk: 46% moderate. FEMA MSC confirms FEMA Zone X..." },
      { "icon": "FaTree",   "label": "WILDFIRE",          "level": "27 / 100  ·  LOW",
        "color": "green",   "body": "Augurisk: 27% low..." },
      { "icon": "FaShieldAlt", "label": "RADON",          "level": "LOW",
        "color": "green",   "body": "EPA Zone 3 (lowest tier)..." },
      { "icon": "FaBolt",   "label": "EARTHQUAKE",        "level": "15 / 100  ·  LOW",
        "color": "green",   "body": "Augurisk: 15% low..." },
      { "icon": "FaFire",   "label": "LEAD / ASBESTOS",   "level": "LOW",
        "color": "green",   "body": "Built post-1978..." }
    ],
    // risks: compact cards, body 140 chars max. Score the hazard; never price it (the insurance brief owns cost).
    "site": [
      // up to 6 rows, each with a source. The facts a listing never shows. flag: true renders crimson.
      { "label": "Soils",             "value": "Fine sandy loam, moderately well drained; moderate septic suitability.", "source": "USDA Web Soil Survey" },
      { "label": "Wetlands",          "value": "Forested wetland mapped on 0.4 ac along the creek; not buildable.", "source": "USFWS NWI", "flag": true },
      { "label": "Elevation / surge", "value": "Pad about 38 ft; outside every storm-surge category.", "source": "USGS 3DEP, NOAA SLOSH (est.)" },
      { "label": "Zoning / land use", "value": "Unzoned county; future land use rural residential.", "source": "County GIS" },
      { "label": "Nearby development","value": "72-lot subdivision approved 0.6 mi north (2025).", "source": "Planning commission minutes", "flag": true },
      { "label": "Roads",             "value": "No state road project within 1 mi.", "source": "State DOT work program" }
    ],
    "source_note": "Sources: Augurisk, EPA Radon Zones, First Street, FEMA MSC, USDA, USFWS, USGS, NOAA, county planning."
  },

  "diligence": {
    "title": "Itemized Pre-Closing Costs",
    "subtitle": "Line-item reality of what you'll spend before contract close.",
    "groups": [
      { "category": "INSPECTIONS", "color": "coral",
        "rows": [
          { "item": "General home inspection",   "note": "Required baseline.", "low": 400, "high": 600 },
          { "item": "Septic tank pump + drainfield", "note": "Mandatory for this property.", "low": 400, "high": 700 },
          { "item": "Sewer scope",               "note": "N/A — septic.", "low": null, "high": null }
        ]
      },
      { "category": "STRUCTURAL & SURVEY", "color": "teal", "rows": [ ... ] },
      { "category": "LENDER & TITLE",      "color": "green", "rows": [ ... ] }
    ],
    "total_low": 4725,
    "total_high": 8500,
    "source_note": "Plan for the high end on a fixer-upper..."
  },

  "inventory": {
    "title": "What Else $310K-$415K Buys in 36532",
    "subtitle": "...",
    "subject": {
      "address": "1090 Willow Bend Rd",
      "price": "$389,000",
      "bed_bath": "4 / 3",
      "sqft": "2,875",
      "lot": "2.4 ac",
      "year": "1986",
      "psf": "$135",
      "note": "Fixer condition. 2.4 acres. No HOA. Top schools."
    },
    "alternatives": [
      // up to 4 cards in a 2x2 grid. Thin rural ZIPs often have fewer qualifying
      // actives; render what exists and state the search band and count on the slide.
      // All show price as string for flexibility ("$365K est.").
      { "address": "265 Royal Ln", "price": "$415,000",
        "bed_bath": "3 / 2", "sqft": "2,162", "psf": "$192",
        "note": "Smaller, fewer beds, but newer condition. Closer to town." }
      // ... 3 more
    ],
    "source_note": "Sources: Redfin active listings..."
  },

  "red_flags": {
    "title": "What to Resolve Before You Sign",
    "items": [
      // up to 6 items. A clean, correctly-priced listing may have three.
      // Never invent a red flag to fill the grid; never hardcode the count in the title.
      { "title": "Severe price-cut pattern", "body": "<N> reductions in 12 months..." }
    ],
    "footer_note": "This list is non-exhaustive."
  },

  "scripts": {
    "title": "Bring These Into the Negotiation",
    "subtitle": "Print this slide. Work the script.",
    "agent":     [ "string", "..." ],   // 8-10 questions
    "neighbors": [ "string", "..." ],   // 6-8 questions
    "inspector": [ "string", "..." ],   // 6-8 priorities
    "footer_note": "The questions you don't ask in writing are the issues you find at closing."
  },

  "action": {
    "title": "A Phased Diligence Plan",
    "phases": [
      // Exactly 4 phases.
      { "title": "PRE-OFFER",   "time": "Under 24 hours", "color": "teal",
        "items": [ "Confirm listing status...", "..." ] },
      { "title": "AT OFFER",    "time": "1–3 days",       "color": "coral",  "items": [ ... ] },
      { "title": "INSPECTION",  "time": "10–14 days",     "color": "amber",  "items": [ ... ] },
      { "title": "PRE-CLOSING", "time": "Final week",     "color": "green",  "items": [ ... ] }
    ]
  },

  "offer": {
    "title": "Opening Offer and Walk-Away Triggers",
    "opening": "$355K – $365K",
    "rationale_lines": [
      // 1-3 lines, render in italics next to opening number
      "Supported by normalized comp analysis",
      "comp screen: fair value $290K-$388K",
      "with 25% fixer condition discount."
    ],
    "walk_away":      [ "string", "..." ],   // 3-4 items
    "reduce_further": [ "string", "..." ],   // 3-4 items
    "go_to_ask":      [ "string", "..." ],   // 3-4 items
    "bottom_line": "This is a value play, not a turnkey buy. Buy the lot and the schools — pay accordingly for the house."
  },

  "sources": {
    "title": "Where Every Number Came From",
    "list": [ "Freddie Mac PMMS...", "Baldwin County GIS...", "..." ],
    "caveats": [ "Monthly carry uses PMMS; your rate will differ...", "..." ]
  }
}
```

## Validation rules

The build script does not validate aggressively. Common errors and how to avoid them:

- **Slide overflow.** Keep array lengths at or under the documented ceilings (e.g., max 7 exec summary items per column, max 6 climate cards, max 4 inventory alternatives). Going over pushes content off the slide. Going under is fine and often correct — say why on the slide.
- **Long body text.** Risk card body, red flag body, exec summary items: keep each item under 200 characters or it overflows the card.
- **Colors.** Use the named palette tokens. Random hex will render but breaks visual consistency.
- **Numeric vs string for money.** `monthly_carry.scenarios[].pi` etc. accept numbers (formatted as `$1,234`) or the literal `"—"` string for non-applicable lines. `inventory.subject.price` and `alternatives[].price` are always strings (so you can write `"$365K est."`).
- **Icon names.** Must match a `react-icons/fa` export exactly. Misspelled names throw at runtime.

## Count contracts: how to read them

Every count above except `monthly_carry.scenarios` (always 4) and `projection.years` (always 5) is a **ceiling with a floor**, not a quota.

- Under the ceiling is fine and often correct. State the reason on the slide: "Three comps met the one-mile criterion; the fourth-nearest was 3.2 mi and was excluded."
- Never fabricate an item to fill a grid. A padded red-flag card, a filler climate card, or an invented competing listing is worse than a shorter slide.
- Slide titles must never hardcode a count. `build_deck.js` warns on number-words in `red_flags.title`, `climate.title`, and `schools.title`.

## Arithmetic contracts

`build_deck.js` validates these and prints a WARN for each violation. Every one corresponds to a defect that shipped in a previous worked example. Treat a WARN as fix-before-delivery.

| Contract | Rule |
|---|---|
| Comp average | `fair_value_walk[0]` must equal the mean of `comps.entries` excluding the subject |
| Premium strips | Adjusted base must equal the average compounded through each strip, not the average minus their sum |
| Price cuts | The cut callout must equal `price_history.points.length - 1` |
| Days on market | Measured from the first listing date of the current cycle to the prepared date |
| Cumulative 5-yr | Must equal the sum of each year's increase over year 1, x 12 |
| Carry totals | Each scenario's `total` must equal pi + pmi + tax + ins + wind + flood |
| Year carries | `year1_carry` and `year5_carry` must equal their own components |
| Millage | `tax_record.millage` must sum to `millage_total` |
| Tax reset | `reset.monthly_delta` = (post_sale_annual - current_annual) / 12; carry tax x 12 must be within $12 of post_sale_annual |
| Open permits | An open or expired permit on slide 7 must appear in a red flag |
| Record vs listing | Every mismatch on slide 7 needs a caveat naming it |
| Names | The deed chain shows transfer types, never a person's name |

## Hygiene contracts

Also enforced by the builder:

- No phone number anywhere in the data file.
- No people-search aggregator (Spokeo, BeenVerified, TruePeopleSearch) in any source list. Tier 3, and a privacy exposure. Never use a neighbor's records to infer a fact about the subject.
- `comps.source_note` must not source comps from an AVM.
- No hardcoded prepared date. Generate it from the run date.
