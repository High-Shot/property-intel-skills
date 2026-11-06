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
  "schema_version": "1.3",
  "normalized_address": "1090 willow bend rd fairhope al 36532",
  "written_by": ["property-intel-report"],
  "last_updated": "YYYY-MM-DD",

  "address": {
    "street": "", "city": "", "state": "", "zip": "",
    "county": "", "parcel_id": "", "mls": "",
    "lat": null, "lng": null
  },

  "structure": {
    "year_built": 0, "sqft": 0, "beds": 0, "baths": 0, "stories": 0,
    "construction": "", "foundation": "", "exterior": "",
    "roof_material": "", "roof_age_yrs": 0,
    "roof_source": "permit | listing | assumed",
    "hvac_age_yrs": 0, "water_source": "", "sewer": "",
    "lot_acres": 0, "garage_bays": 0, "pool": false,
    "roof_shape": "hip | gable | mixed", "roof_year": 0,
    "wind_mitigation": "none | FORTIFIED Roof | Silver | Gold",
    "hurricane_shutters": "", "electrical_panel": "", "panel_ineligible": false,
    "wiring": "", "plumbing_material": "",
    "water_heater_year": 0, "water_heater_in_attic": false, "water_heater_tankless": false,
    "hvac_year": 0, "monitored_alarm": false,
    "detached_structures": "", "pond": false
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
    "mortgage_rate_pct": 0, "rate_source": "", "rate_date": "",
    "tax_annual_post_sale": 0, "hoa_monthly": 0, "fha_loan_limit": 0
  },

  "record": {
    "appraised_value": 0, "assessed_value": 0, "appraisal_year": 0,
    "tax_current_annual": 0, "millage_total": 0,
    "exemptions": [""], "special_assessments": [{"name": "", "annual": 0}],
    "tax_history": [{"year": 0, "tax": 0}], "tax_delinquent": false,
    "deed_chain": [{"date": "YYYY-MM", "type": "", "price": null}],
    "mortgages": [{"recorded": "YYYY-MM", "original": 0, "est_remaining": null}],
    "liens_found": false, "lis_pendens_found": false,
    "permits": [{"year": "", "work": "", "status": ""}],
    "mismatches": [{"field": "", "record": "", "listing": ""}],
    "easements": "", "zoning": ""
  },

  "comps": [
    {"address": "", "sold_price": 0, "concessions": 0, "sold_date": "", "sqft": 0,
     "psf": 0, "lot_acres": 0, "year_built": 0, "beds": 0, "baths": 0,
     "distance_mi": 0, "lat": null, "lng": null,
     "source": "", "tier": 1, "notes": ""}
  ],

  "value": {
    "point": 0, "low": 0, "high": 0, "confidence": "",
    "anchors": {"walk_away_ceiling": 0, "fair_value": 0, "list": 0},
    "from_skill": "", "method": "", "as_of": ""
  },

  "insurance": {
    "market_profile": "coastal | inland",
    "cov_a_est": 0, "premium_low": 0, "premium_high": 0,
    "wind_deductible_options_pct": [1, 2, 5],
    "wind_deductible_pct": null, "wind_deductible_chosen": "true | default",
    "aop_deductible": 0,
    "flood_premium_low": null, "flood_premium_high": null, "flood_required": null,
    "wind_deductible_flat": null,
    "wind_note": "",
    "from_skill": "", "as_of": "",
    "quotes": [
      {"carrier": "", "agency": "", "channel": "admitted | surplus | pool",
       "quote_id": "", "quote_date": "YYYY-MM-DD", "form": "HO3",
       "territory": "", "protection_class": "",
       "cov_a": 0, "cov_b": 0, "cov_c": 0, "cov_d": 0, "cov_e": 0, "cov_f": 0,
       "aop_deductible": 0, "non_hurricane_wind_deductible": 0,
       "wind_deductible_flat": null, "wind_deductible_pct": null,
       "total_annual": 0, "rate_per_1k_cov_a": 0, "min_earned_premium_pct": null,
       "roof_terms": "", "water_damage_limit": null, "water_backup_limit": null,
       "endorsements": [{"name": "", "limit": null, "premium": 0}],
       "rated_on": {"year_built": 0, "construction": "", "roof_year": 0},
       "flags": [""]}
    ]
  },

  "repairs": {
    "from_skill": "property-appraisal", "as_of": "YYYY-MM-DD",
    "basis": "From the buyer's walkthrough, priced at cure cost",
    "items": [
      {"item": "", "detail": "", "low": 0, "high": 0,
       "full_low": null, "full_high": null, "full_detail": "",
       "moisture": false, "category": "repair | upgrade"}
    ]
  },

  "buyer": {
    "financing": {"loan_type": "fha | conv", "down_pct": 0, "planned_offer": null},
    "insurance_intake": {"occupancy": "primary", "prior_claims_5yr": null, "dogs": "",
                         "trampoline": false, "mortgaged": true, "home_business": false}
  },

  "dossier": {
    "note": {
      "headline": "",
      "items": [{"label": "", "body": "", "key": false}],
      "as_of": "YYYY-MM-DD"
    }
  },

  "provenance": {
    "structure.year_built": {"source": "Baldwin Co. Revenue Commission",
                             "tier": 1, "retrieved": "YYYY-MM-DD"}
  }
}
```

Omit any block you did not research. Do not write a key with a placeholder value — absent means "not researched," `null` means "researched and unavailable." That distinction is what lets the next skill know whether to try again.

## Dashboard fields

The dossier dashboard (`property-intel-report` Stage 5) reads only this cache. Each field is written by the skill that owns it, as a number, never a display string like `"$3,200"`.

| Field | Written by | Dashboard use |
|---|---|---|
| `market.list_price`, `market.mortgage_rate_pct`, `rate_source`, `rate_date` | `property-intel-report` | Offer slider bounds, P&I. Rate goes stale after 7 days |
| `market.tax_annual_post_sale`, `market.hoa_monthly` | `property-intel-report` | Carry, held fixed across offer prices |
| `value.point`, `value.low`, `value.high`, `value.confidence` | `property-appraisal` | Value tile, slider marks, value vs rebuild |
| `insurance.*` numeric fields above | `property-insurance-brief` | Carry insurance range, deductible dollars, Cov A |
| `market.fha_loan_limit` | `property-intel-report` | FHA county-limit check in the carry and repair panels |
| `repairs.*` | `property-appraisal` | Repair panel: minimum vs full scope, upgrades, 203(k) Limited fit, financed-repair carry. Written only when the buyer walked it |
| `buyer.financing` | `property-intel-report` (from the conversation) | Default loan type, down payment, and a "your plan" mark on the price slider. Omit when the buyer has not said |
| `dossier.note` | `property-intel-report` Stage 5 | The reconciliation note, rendered at the top of the dashboard |

A missing field shows as a notice in its panel, never as a guess.

## The public record block (1.3)

`record` is what the county knows that the portals do not show: appraised and assessed value, the millage stack, exemptions in force, special assessments, tax paid by year, delinquency, the deed chain (transfer type and price, never an owner's name), recorded mortgages with an estimated remaining balance, liens and lis pendens, permits with their status, and every place the record disagrees with the listing. `property-intel-report` writes it; the other two read it. The appraisal uses `deed_chain` for the subject's sale history; the insurance brief uses the roof, HVAC and water-heater permits for the carrier intake page and marks them verified.

## Insurance quotes and carrier intake (1.3)

`insurance.quotes[]` holds every real quote the buyer has, one object per quote, as numbers. `total_annual` is premium plus every fee and tax. `rate_per_1k_cov_a` = `total_annual / cov_a * 1000`, rounded to cents; the insurance builder recomputes it. When a carrier writes a flat-dollar hurricane deductible, `wind_deductible_flat` holds the dollars and `wind_deductible_pct` holds the effective percent (flat / Cov A). `rated_on` is what the carrier priced; if it disagrees with `structure`, the brief flags it, since a mis-rated quote can be voided at claim time.

The `structure` intake fields (roof shape through pond) and `buyer.insurance_intake` feed page 2 of the spec sheet. Each carries provenance like any other field; a field with no tier-1 or inspection source renders CONFIRM, never verified. Applicant identifiers (SSN, driver's license number, date of birth) are never written here or anywhere else.

`repairs.items[].low/high` are cure costs before the appraisal's moisture multiplier; the appraisal's condition slide carries the value impact, this block carries the cash the buyer spends. `full_low`/`full_high` hold the fuller scope when the buyer named one ("downstairs carpet at least, ideally all"). `category: "upgrade"` marks optional improvements (a kitchen refresh) that the panel shows only when the buyer ticks "include upgrades."

## Source tiers

- **Tier 1** — county recorder, assessor, tax authority, permit office, FEMA MSC, MLS closed-sale record, Freddie Mac PMMS.
- **Tier 2** — Redfin/Zillow/Realtor.com *recorded sale* data, GreatSchools, First Street, state DOI filings, reputable local reporting.
- **Tier 3** — AVMs (Zestimate, Redfin Estimate), people-search aggregators, listing-agent marketing copy.

Tier 3 is context only. It is never a comp and never a sourced anchor.

## Ownership: who owns which number

When more than one skill could produce the same figure, one owns it. The others cite it.

| Domain | Owner | Everyone else |
|---|---|---|
| Market value, comps, comp adjustments, offer anchors (`value.anchors`) | `property-appraisal` | Cite `value.*` from the cache. The intel deck has no comp slide; its offer slide builds the opening from `value.high` and cites the anchors. If absent, the intel deck runs a screen, keeps it to one rationale line, and labels it a screen. |
| Premiums, deductibles, coverage spec, flood cost | `property-insurance-brief` | Cite `insurance.*`. The intel carry slide uses `premium_low`-`premium_high`; when absent it uses the orientation band labeled est. The intel climate/site slide scores hazards but never prices them. |
| Hazard scores and site (FEMA zone, First Street, soils, surge, wetlands, zoning, development) | `property-intel-report` | The insurance brief reads zone, distance to coast and elevation from `hazard.*` and reports the zone for the flood mandate only. |
| Monthly carry | `property-intel-report` (deck), dossier dashboard (live) | The dashboard recomputes from the cache; the two must agree within the dashboard's cross-check. |
| Parcel record, tax and assessment, deed chain, liens, permits, hazard and site, schools, diligence budget, competing inventory | `property-intel-report` | Read `record.*`, `structure.*`, `hazard.*` from the cache; do not re-research. The insurance brief takes the roof permit year from `record.permits`. |

If you publish a figure another skill owns and the cache has its value, use theirs. Two decks for one buyer must not disagree.
