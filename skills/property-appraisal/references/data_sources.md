# Comp and Data Sources by Reliability Tier

Every sold price in the comp grid carries a source and a tier. The tier drives comp weighting (methodology §3) and the confidence rubric (§6).

## Tier 1 — Record-grade sold prices (weight score 5)

- County deed / recorder records (deed stamps, transfer tax) — where fetchable
- County revenue/assessor sale history pages
- Redfin sold-property pages (MLS-fed; sold price and date are MLS data) — often render via WebFetch
- Realtor.com sold pages (MLS-fed)
- Movoto sold pages (MLS-fed)
- Homes.com sold pages (MLS-fed)

MLS-fed portal sold pages count as Tier 1 because the sold price comes from the MLS feed, not an estimate. Confirm the page says "Sold" with a date and price, not "Est. sold price".

## Tier 2 — Search-snippet or secondary sold prices (weight score 3)

- Sold prices visible only in search snippets (page would not fetch)
- Zillow sold data when only partially visible (Zillow blocks most fetches)
- Aggregator sites reporting a sale without MLS sourcing
- News/press or public listing archives

Use when Tier 1 is unreachable. Note "price via search snippet, page unfetchable" in the comp's source field.

## Tier 3 — Estimates (NEVER comps; cross-check only)

- Zestimate, Redfin Estimate, Realtor.com estimate, First American/other AVMs
- "Estimated sold price" fields on any portal
- Price-per-sqft extrapolations

These populate the AVM cross-check band on the reconciliation slide and nothing else.

## Subject property record

- County assessor/appraisal district (parcel, sqft, year, lot)
- Portal property pages (Redfin/Realtor/Movoto) for listing facts
- Prior listing history: Redfin price history table is usually the most complete fetchable record

## Market condition (for the time adjustment)

- Redfin Data Center / city market pages (median sale $/sqft trend, months of inventory, median DOM)
- Realtor.com market trends pages
- Zillow Home Value Index via search snippets

## Known regional constraints

- **Baldwin County, AL**: Revenue Commission and GIS portals are JavaScript-interactive and do not respond to web fetch. Tax and parcel figures must come via search snippets or portal pages, labeled "est." where unverified, with a verify-at-the-Revenue-Commission note.
- Zillow blocks most direct fetches; treat anything Zillow as snippet-grade unless a page actually renders.
- If a portal page fetch returns a bot wall, try the same address on Movoto and Homes.com before downgrading the comp to Tier 2.

## Search patterns that work

- `<street address> sold` — surfaces sold pages across portals
- `<subdivision name> <city> recently sold homes` — comp discovery
- `<city> <state> median sale price per square foot <current year>` — market trend
- Plain-text queries only. No site:, quote, or minus operators.

## County portal quirks

Many county assessor, revenue, and GIS portals are JavaScript-interactive and do not respond to automated fetch. Known examples include Baldwin County, AL (Revenue Commission and GIS). This list is never complete, and portals change.

When a county portal will not fetch:

1. Try a search-engine snippet for the specific parcel figure before giving up.
2. Try the state or regional aggregator for the same field.
3. If neither works, label the figure an estimate, name the source you did use, and say on the caveats slide that the county record could not be retrieved directly.

Do not report a field as unavailable without trying steps 1 and 2, and do not silently substitute a tier-3 figure for a county record.

## Source volatility

Scraping observations in this file ("Zillow blocks most direct fetches," "portal X is JavaScript-interactive") are point-in-time, not durable facts. Re-test rather than assuming. Vendor availability changes too; do not treat any single aggregator as guaranteed to exist.
