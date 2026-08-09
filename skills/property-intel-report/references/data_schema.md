# property_data.json — Schema Reference

The deck builder consumes a single JSON file with the structure below. Every field maps to a slide. Fill all required fields. Optional fields are marked.

Color tokens accepted as named strings: `marine`, `teal`, `coral`, `green`, `crimson`, `amber`, `steel`. Or pass raw hex without `#`.

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
    "prepared_label": "PREPARED <MONTH YEAR>"   // generated from the run date, never hardcoded                  // defaults to current month/year
  },

  "exec_summary": {
    "headline": "The Good. The Bad. The Ugly.",
    "good": [ "string", "..." ],     // 5-7 items
    "bad":  [ "string", "..." ],
    "ugly": [ "string", "..." ]
  },

  "at_a_glance": {
    "title": "The Property in Numbers",
    "stats": [
      { "big": "$389,000", "label": "CURRENT LIST PRICE", "sub": "Down from $519,900",
        "color": "coral" },
      { "big": "2,875",    "label": "LIVING SQUARE FEET", "sub": "$135 / sqft",
        "color": "teal" },
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
      { "big": "12",        "label": "Price cuts" },
      { "big": "79 days",   "label": "On market this cycle" },
      { "big": "2 cycles",  "label": "Listings withdrawn" }
    ],
    "source_note": "Sources: Zillow MLS history."
  },

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
    "source_note": "Comp $/sqft from Redfin AVMs..."
  },

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
    "cumulative_note": "Cumulative 5-yr extra cost over flat baseline: ~$7,400.",
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

  "climate": {
    "title": "What Insurance Will Actually Cost You",
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
    "source_note": "Sources: Augurisk, EPA Radon Zones, First Street, FEMA MSC."
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
    "title": "The Number, The Walk-Away, The Upside",
    "opening": "$355K – $365K",
    "rationale_lines": [
      // 1-3 lines, render in italics next to opening number
      "Supported by normalized comp analysis",
      "(see slide 6) — fair value $290K-$388K",
      "with 25% fixer condition discount."
    ],
    "walk_away":      [ "string", "..." ],   // 3-4 items
    "reduce_further": [ "string", "..." ],   // 3-4 items
    "go_to_ask":      [ "string", "..." ],   // 3-4 items
    "bottom_line": "This is a value play, not a turnkey buy. Buy the lot and the schools — pay accordingly for the house."
  },

  "sources": {
    "title": "Show Your Work",
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
| Cumulative 5-yr | Must equal the sum of the four year-over-year deltas x 12 |
| Carry totals | Each scenario's `total` must equal pi + pmi + tax + ins + wind + flood |
| Year carries | `year1_carry` and `year5_carry` must equal their own components |

## Hygiene contracts

Also enforced by the builder:

- No phone number anywhere in the data file.
- No people-search aggregator (Spokeo, BeenVerified, TruePeopleSearch) in any source list. Tier 3, and a privacy exposure. Never use a neighbor's records to infer a fact about the subject.
- `comps.source_note` must not source comps from an AVM.
- No hardcoded prepared date. Generate it from the run date.
