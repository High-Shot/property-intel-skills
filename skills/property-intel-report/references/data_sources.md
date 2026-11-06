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

## Tax & Assessment (slide 6)

- **County revenue commission / assessor / tax collector.** The parcel's appraised value, assessed value, assessment class, exemptions in force (homestead, senior, disability, current use), and bills by year. Most counties show 5-10 years of bills online. Look for a delinquency flag or tax-sale certificate on the same page.
- **State revenue department millage table** (Alabama: ADOR). Mills by authority (state, county, school, city, special district). Sum them; the total should reproduce the bill within the exemption credit.
- **Special assessments and districts.** Fire district dues, improvement districts, drainage or road assessments. They ride on the tax bill and are easy to miss.
- **Post-sale reset.** Homestead and senior exemptions end at sale. Recompute the bill at the purchase price with the buyer's own homestead, and say the filing deadline.

## Deeds, Mortgages, Liens (slide 7)

- **County probate judge / recorder of deeds index**, searched by parcel and by owner. Deed type (warranty, quitclaim, executor's, foreclosure), recording date, and consideration or deed tax where recorded. Record transfer TYPE, never a person's name, in any deliverable.
- **Recorded mortgages** and their satisfactions. Original amount and date give an estimated remaining balance (standard amortization at the PMMS rate of that year, labeled est.), and therefore the seller's equity: the single best read on how far a seller can cut.
- **Liens, judgments, lis pendens.** Same index. A lis pendens means litigation touching the property; a mechanics' lien means unpaid work.
- **Recorded plat and covenants.** Easements (drainage, utility, access), setbacks, and deed restrictions. HOA declarations if any.

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

Open or expired permits transfer to the buyer. Flag any permit without a final inspection, and compare permitted work against what the listing claims was done (a "new roof" with no roof permit, a bonus room with no permit).


- **County / city permit portal** — search `<county> <state> citizenserve` or `<county> <state> permit search`. Coverage typically post-2010 or post-2020.
- **County Building Department** — older permits often available only by request.
- **County Health Department** — septic permits and Approval-for-Use records (in states where septic is regulated by health, not building).

## Site & Surroundings (slide 9)

- **USDA Web Soil Survey** — `websoilsurvey.nrcs.usda.gov` — soil series, drainage class, shrink-swell, septic absorption suitability. The reason a slab cracks or a drainfield fails.
- **USFWS National Wetlands Inventory** — `fws.gov/program/national-wetlands-inventory` — mapped wetlands on or next to the parcel. Wetland acreage is not buildable and is worth less.
- **USGS 3DEP / National Map** — ground elevation at the pad. **NOAA SLOSH / National Hurricane Center storm surge maps** — surge category by location on hurricane coasts.
- **County or city zoning map and future land use map** — what the parcel and its neighbors may become.
- **Planning commission and zoning board agendas and minutes** — rezonings, subdivisions, commercial site plans within about a mile. The single best read on what changes next door.
- **State DOT work program / STIP** — funded road projects near the parcel.
- **Noise** — airport noise contours, rail lines, highway proximity (DOT noise maps where published).
- **Historical aerial imagery** (USGS EarthExplorer, county GIS) — prior use of the land, fill, old structures.

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

## County portals that block fetches

Many county assessor, probate and permit portals refuse `WebFetch` (session tokens, search forms, image-only records). Before marking a county fact unavailable: search for the portal's direct parcel URL pattern, then use an available browser tool to run the search the way a person would, respecting any browser rules the user has set. If no browser is available, say which portal blocked the fetch and give the buyer the exact search to run. Never fill the gap from an aggregator and label it tier 1.

### Baldwin County, AL (worked example)

The revenue commission's property search (AssuranceWeb, reached from the county's Property Tax Calculator page) works in a browser: search by address, then Details. It shows appraised and assessed value, exemption code, tax district, building sketch areas (living vs adjusted sq ft), exterior and roof materials, year built and remodeled, improvements by year (pools, garages), tax paid by year back to the 1990s, and tax sales. Web search for this portal returns SEO spam; go through the county site.

Deeds, mortgages and liens: the Judge of Probate's records search (Neumo, `baldwin.al.publicsearch.us`, also reached from the parcel page's DEED SEARCH link). What works, tested 2026-11:
- **Advanced Search, Grantor = current owner name** returns every instrument the owner signed: mortgages, releases, liens. Quick Search by name returns nothing.
- **Quick Search by document number** works for some numbers and not others; when it fails, open the record from an Advanced Search result instead.
- The record summary shows type, dates, parties, legal description, marginal references (a later release of a mortgage shows here) and, on deeds and bills of sale, **consideration**. Mortgage amounts are not indexed: read them from page 1 of the document image (the note amount in the Documents section).
- A Fairhope Single Tax leasehold transfers by **bill of sale**, not deed. The "LEASE IN#" number on the parcel is the colony's lease reference and does not search as a probate document number.
- Seller equity estimate: newest unreleased mortgage amount, amortized from its note date at a rate labeled est., against the expected price less about 6% selling costs. Say it is an estimate.
- Permits: the City of Fairhope has no public online permit search found as of 2026-11. Ask the city building department, or ask the seller for permit cards.

## Source volatility

URLs and portal behavior in this file are point-in-time observations, not durable facts. Before relying on any of them:

- If a documented URL 404s or redirects, search for the current one rather than reporting the data as unavailable.
- FRED series IDs, agency deep links, and vendor partnerships change. Cite what you actually retrieved, not what this file predicted you would.
- People-search aggregators (Spokeo, BeenVerified, TruePeopleSearch) are tier 3 and carry privacy exposure. Do not use a neighbor's personal records to infer a fact about the subject property, and never put a private individual's name, phone number, or record in a deliverable.
- The "aggregators get sqft wrong roughly 5-10% of the time" figure is an in-house impression, not a measured rate. Treat it as "sometimes wrong, always cross-check," not as a statistic.
