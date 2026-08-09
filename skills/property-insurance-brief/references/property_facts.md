# Shared Property Facts Cache

The three property skills (`property-intel-report`, `property-appraisal`, `property-insurance-brief`) research the same house. Without a cache they collect the same facts three times, spend 70-90 web calls on one property, and publish decks that contradict each other.

`property_facts.json` is the fix. Whichever skill runs first writes it. Every skill that runs afterward reads it before touching the web.

## Protocol

**At the start of Stage 2 (Research), before any web call:**

1. Look for `property_facts.json` in the working directory, in the conversation's uploaded files, and in the attached project. Match on normalized address (lowercase, strip punctuation, collapse whitespace).
2. If found, load it. For every field you need that is already present **and** not stale (see below), skip that research item and say so once in the run summary: "Reusing 11 facts from the earlier intel-report run; researching 6 new."
3. Research only the gaps.
4. At the end of Stage 2, merge everything you learned back into `property_facts.json` and rewrite it. Never drop another skill's fields.

**Staleness.** A cached field is stale if `retrieved` is more than 30 days old, or if it is in the `market` block and more than 7 days old. Market data moves; a parcel's year built does not. Re-research stale fields and update their provenance.

**Where it lives.** The working directory by default, which means the cache spans one session. If the runtime has an attached project or another durable store and the user is likely to revisit this address across days, also write a copy there under `property-facts/<normalized-address>.json` and read from it at intake. Do not create durable storage the user did not ask for; a session-scoped cache is the default and is enough for a single sitting.

**Conflicts.** If your research contradicts a cached value, keep the higher-tier source (tier 1 beats tier 2 beats tier 3), update `provenance`, and add a line to the deck's caveats naming the disagreement. Never silently overwrite a tier-1 fact with a tier-3 one.

## Schema

```json
{
  "schema_version": "1.0",
  "normalized_address": "1090 willow bend rd fairhope al 36532",
  "written_by": ["property-intel-report"],
  "last_updated": "YYYY-MM-DD",

  "address": {
    "street": "", "city": "", "state": "", "zip": "",
    "county": "", "parcel_id": "", "mls": ""
  },

  "structure": {
    "year_built": 0, "sqft": 0, "beds": 0, "baths": 0, "stories": 0,
    "construction": "", "foundation": "", "exterior": "",
    "roof_material": "", "roof_age_yrs": 0,
    "roof_source": "permit | listing | assumed",
    "hvac_age_yrs": 0, "water_source": "", "sewer": "",
    "lot_acres": 0, "garage_bays": 0, "pool": false
  },

  "hazard": {
    "fema_zone": "", "bfe_ft": null, "freeboard_ft": null,
    "distance_to_coast_mi": null, "wind_zone": "",
    "first_street": {"flood": null, "fire": null, "wind": null, "heat": null},
    "radon_zone": null
  },

  "market": {
    "list_price": 0, "original_list_price": 0, "price_cuts": 0,
    "days_on_market": 0, "last_sale_price": 0, "last_sale_date": "",
    "median_psf": 0, "psf_yoy_pct": 0,
    "months_inventory": null, "median_dom": null,
    "mortgage_rate_pct": 0, "rate_source": "", "rate_date": ""
  },

  "comps": [
    {"address": "", "sold_price": 0, "sold_date": "", "sqft": 0,
     "psf": 0, "lot_acres": 0, "year_built": 0, "beds": 0, "baths": 0,
     "distance_mi": 0, "source": "", "tier": 1, "notes": ""}
  ],

  "value": {
    "point": 0, "low": 0, "high": 0, "confidence": "",
    "from_skill": "", "method": "", "as_of": ""
  },

  "insurance": {
    "cov_a_est": 0, "premium_low": 0, "premium_high": 0,
    "wind_deductible_pct": null, "flood_required": null,
    "from_skill": "", "as_of": ""
  },

  "provenance": {
    "structure.year_built": {"source": "Baldwin Co. Revenue Commission",
                             "tier": 1, "retrieved": "YYYY-MM-DD"}
  }
}
```

Omit any block you did not research. Do not write a key with a placeholder value — absent means "not researched," `null` means "researched and unavailable." That distinction is what lets the next skill know whether to try again.

## Source tiers

- **Tier 1** — county recorder, assessor, tax authority, permit office, FEMA MSC, MLS closed-sale record, Freddie Mac PMMS.
- **Tier 2** — Redfin/Zillow/Realtor.com *recorded sale* data, GreatSchools, First Street, state DOI filings, reputable local reporting.
- **Tier 3** — AVMs (Zestimate, Redfin Estimate), people-search aggregators, listing-agent marketing copy.

Tier 3 is context only. It is never a comp and never a sourced anchor.

## Ownership: who owns which number

When more than one skill could produce the same figure, one owns it. The others cite it.

| Domain | Owner | Everyone else |
|---|---|---|
| Market value, comp adjustments, offer anchors | `property-appraisal` | Cite `value.*` from the cache. If absent, produce a screen-level range and label it a screen, not a valuation. |
| Premiums, deductibles, coverage spec, flood cost | `property-insurance-brief` | Cite `insurance.*`. If absent, say "wind and flood are the swing factors here; run property-insurance-brief for the spec and range" and give no number. |
| Parcel record, permits, hazard, schools, diligence budget, competing inventory | `property-intel-report` | Read from the cache; do not re-research. |

If you publish a figure another skill owns and the cache has its value, use theirs. Two decks for one buyer must not disagree.
