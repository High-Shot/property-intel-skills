# Authoritative Data Sources

A directory of public sources by domain. Use for verification and to build the "Sources" slide. Listed roughly in order of authority.

## Mortgage Rates

- **Freddie Mac Primary Mortgage Market Survey (PMMS)** — `freddiemac.com/pmms` — weekly 30-yr and 15-yr fixed average. The standard reference. Updates Thursdays.
- **FRED MORTGAGE30US** — `fred.stlouisfed.org/series/MORTGAGE30US` — historical chart of PMMS.
- **Mortgage News Daily** — daily index, more reactive than weekly survey.

## Property & Parcel Data

- **County GIS / Parcel Viewer** — every county has one. Search `<county> <state> GIS` or `<county> <state> parcel viewer`. Source of truth for parcel boundaries, zoning, lot dimensions.
- **County Revenue Commission / Tax Assessor** — annual tax records, assessed value, exemptions.
- **County Probate / Recorder of Deeds** — sale history, deeds, mortgages, liens. Often called "Landmark WEB" or similar e-record portals.
- **Zillow / Redfin / Homes.com** — convenient aggregators of public records but secondary. Verify against county for parcel ID and tax.

## Listing History & Comps

- **Redfin** — best for listing history transparency, $/sqft, AVM.
- **Zillow** — broadest coverage, includes some withdrawn / expired data.
- **Homes.com** — useful AVM and sometimes more detailed deed records.
- **Realtor.com** — MLS-feed direct, often shows current contingent / pending status.
- **Local MLS feeds** (broker sites) — raw MLS data when available.

## Schools

- **GreatSchools.org** — 1-10 ratings, the standard reference.
- **Niche K-12** — letter grades + parent reviews + demographics.
- **State DOE** — state assessment scores, official state ratings.
- **District website** — boundary maps, attendance zones.

## Climate & Environmental Risk

- **FEMA Flood Map Service Center** — `msc.fema.gov` — official flood zone (X, AE, VE, etc.) and FIRMette.
- **First Street Foundation** — `riskfactor.com` / `firststreet.org` — parcel-level Flood, Fire, Wind, Heat, Air factor scores 1-10. Used by Zillow, Redfin, Realtor.com.
- **Augurisk** — `augurisk.com` — city / census-block multi-hazard composite. Storm, flood, wildfire, earthquake, crime, healthcare.
- **EPA Radon Zones** — `epa.gov/radon/find-information-about-local-radon-zones-and-state-contact-information` — Zone 1 (highest) to Zone 3 (lowest).
- **NOAA hurricane database (HURDAT2)** — historical hurricane tracks.
- **EPA ECHO** — `echo.epa.gov` — environmental violations, releases, hazardous sites by location.

## Insurance

- **State Department of Insurance** — premium trends, carriers writing in state.
- **Insurance Information Institute** — `iii.org` — industry-level data.
- **CLUE Report** — buyer can request from seller; 5-7 yr claim history. C.L.U.E. = Comprehensive Loss Underwriting Exchange.
- **State wind pools / Beach Plans** — hurricane-coast states (FL, AL, MS, LA, TX, NC, SC). Often called "Citizens", "Beach Pool", "Wind Pool".

## Permits & Code

- **County / city permit portal** — search `<county> <state> citizenserve` or `<county> <state> permit search`. Coverage typically post-2010 or post-2020.
- **County Building Department** — older permits often available only by request.
- **County Health Department** — septic permits and Approval-for-Use records (in states where septic is regulated by health, not building).

## Utilities & Infrastructure

- **FCC National Broadband Map** — `broadbandmap.fcc.gov` — ISPs and speeds available at the address.
- **Utility provider directories** — state PSC websites list electric, gas, water authorities by service area.
- **Walk Score** — `walkscore.com` — walk, bike, transit scores.

## Neighborhood & Market

- **Redfin neighborhood pages** — median sale, $/sqft, days-on-market, YoY trend by ZIP and neighborhood.
- **NeighborhoodScout** — appreciation rates, demographics, crime.
- **Census American Community Survey (ACS)** — official demographics, income, housing characteristics.
- **City-Data** — aggregated neighborhood profiles.

## Person & Property Lookups

- **Spokeo, BeenVerified, TruePeopleSearch** — neighbor records, prior occupants. Note: many disallow programmatic fetching.
- **NSOPW.gov** — national sex offender registry.
- **State court records** — civil case lookup (varies by state).

---

## Source authority hierarchy

When sources conflict, prefer in this order:

1. **County records** (GIS, Revenue, Probate)
2. **State agencies** (DOE, DOI, EPA-state)
3. **Federal agencies** (FEMA, EPA, FCC)
4. **Industry standards** (Freddie Mac, GreatSchools, First Street)
5. **Aggregators** (Zillow, Redfin, Homes.com)
6. **Crowd-sourced** (Niche reviews, City-Data forums)

The aggregators are convenient but they scrape. They get tax records, parcel IDs, and sale prices wrong roughly 5-10% of the time. For the offer slide, never cite an aggregator alone for a contested fact.

## Source volatility

URLs and portal behavior in this file are point-in-time observations, not durable facts. Before relying on any of them:

- If a documented URL 404s or redirects, search for the current one rather than reporting the data as unavailable.
- FRED series IDs, agency deep links, and vendor partnerships change. Cite what you actually retrieved, not what this file predicted you would.
- People-search aggregators (Spokeo, BeenVerified, TruePeopleSearch) are tier 3 and carry privacy exposure. Do not use a neighbor's personal records to infer a fact about the subject property, and never put a private individual's name, phone number, or record in a deliverable.
- The "aggregators get sqft wrong roughly 5-10% of the time" figure is an in-house impression, not a measured rate. Treat it as "sometimes wrong, always cross-check," not as a statistic.
