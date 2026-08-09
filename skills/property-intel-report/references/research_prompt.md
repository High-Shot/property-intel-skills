# Research Prompt Template

Default path is parallel `WebSearch` + `WebFetch` using the query set below. If a dedicated deep-research tool exists on this runtime (for example `launch_extended_search_task`), this prompt can be passed to it verbatim instead. Do not assume such a tool exists. Substitute placeholders with actual values before sending.

---

## Placeholders

- `{{ADDRESS}}` — full street address
- `{{CITY}}` — city
- `{{STATE}}` — 2-letter state
- `{{ZIP}}` — ZIP code
- `{{COUNTY}}` — county (research this first if unknown — county-level data sources are critical)

## Prompt

```
Compile a comprehensive due-diligence intelligence report on the residential property at:

{{ADDRESS}}, {{CITY}}, {{STATE}} {{ZIP}}
County: {{COUNTY}}

The report is for a buyer evaluating whether to purchase. Cover the following twelve domains exhaustively. For every fact, cite the source. When sources conflict, surface both and note the conflict.

---

1. PROPERTY RECORD
   - Parcel ID, legal description, lot dimensions, total acreage
   - Year built, square footage (living + total), bedrooms, bathrooms
   - Foundation type, construction type, exterior material
   - HVAC age, roof age, septic/sewer, water source (well/municipal)
   - Permitted improvements: roof, HVAC, septic, additions
   - Open or closed code violations
   - Source priority: County GIS / Parcel Viewer > County Assessor > Zillow public records

2. OWNERSHIP & LEGAL
   - Current owner of record (last deed)
   - Sale history with dates and prices going back 25+ years
   - Outstanding mortgages, liens, judgments
   - Easements, covenants, restrictions, encroachments
   - HOA presence and dues if any
   - Source priority: County Probate / Recorder of Deeds > Title companies > Zillow

3. TAX & FINANCIAL
   - Current annual property tax (with and without homestead/senior exemptions)
   - Tax history 6+ years to compute trailing growth rate
   - Assessed value vs market value
   - Special assessments or improvement districts
   - Source priority: County Revenue Commission / Tax Assessor

4. LISTING HISTORY
   - Current list price and days on market
   - Every price change with date — go back to first listing
   - Prior listing cycles (withdrawn, expired, contingent that fell through)
   - Original list price and total reduction
   - Listing agent and brokerage
   - Source priority: MLS feeds via Realtor.com, Zillow, Redfin, Homes.com

5. COMPARABLE SALES
   - 5-7 nearby comps sold in the last 18 months OR currently active
   - For each: address, sqft, lot, year built, beds/baths, sale price (or list), waterfront/non, $/sqft
   - Note any premiums (waterfront, view, remodeled)
   - Source priority: Redfin > Zillow > Homes.com > public sale records

6. SCHOOLS
   - Elementary, middle, high school assignments for the parcel
   - GreatSchools rating (out of 10), Niche letter grade
   - Distance to each
   - Student count, student-teacher ratio, state assessment scores
   - Source priority: GreatSchools.org > Niche K-12 > district website > the local district / state DOE

7. CLIMATE & ENVIRONMENTAL RISK
   - FEMA flood zone for the parcel (X, AE, VE, etc.) — pull FIRMette
   - First Street Foundation Risk Factor scores: Flood, Fire, Wind, Heat, Air
   - Augurisk multi-hazard composite for the city
   - EPA Radon Zone (1, 2, or 3)
   - Wildfire WUI status if applicable
   - Hurricane / tornado / earthquake exposure
   - Source priority: FEMA MSC > First Street > Augurisk > EPA

8. UTILITIES & INFRASTRUCTURE
   - Electric provider (investor-owned, co-op, municipal)
   - Natural gas availability
   - Water source (private well, water authority, municipal)
   - Sewer (septic with permit history, municipal sewer, lagoon)
   - Internet: ISPs available, max speeds, fiber presence — FCC National Broadband Map
   - Cell coverage by carrier
   - Solid waste / recycling
   - Source priority: FCC Broadband Map, utility provider directories, county records

9. NEIGHBORHOOD & MARKET
   - ZIP-level median sale price, $/sqft, YoY trend
   - Walk Score, Bike Score, Transit Score
   - 5-year and 10-year appreciation in the ZIP
   - Demographics, median household income
   - Source priority: Redfin neighborhood data, NeighborhoodScout, Census ACS

10. INSURANCE LANDSCAPE
    - Whether wind/hurricane policy is separate (Beach Pool / Citizens / state pool)
    - Typical premium ranges for HO + wind + flood for this build year and value
    - CLUE report availability (5-yr claim history)
    - Carriers writing in the ZIP
    - Recent rate changes for the state
    - Source priority: state insurance department, industry trade press

11. CURRENT MORTGAGE RATE
    - Freddie Mac PMMS 30-yr fixed rate as of this week
    - Trailing 6-month range
    - Source: freddiemac.com/pmms

12. COMPETING ACTIVE INVENTORY
    - 4-5 active listings within ±15% of the subject's list price in the same ZIP
    - For each: address, list price, beds/baths, sqft, $/sqft, key differentiator
    - Source: Redfin / Zillow / Homes.com

---

## Output format

Produce a structured artifact with the 12 domains as top-level sections. Within each, organize as bullet lists with the source URL or reference next to each datum. When a fact is estimated, label "(est.)". When a source is conflicting, show both with attribution.

Avoid prose narrative. Avoid recommendations. The output is raw intelligence — synthesis happens downstream.
```

---

## Fallback: WebSearch batch (if deep research unavailable)

If no dedicated deep-research tool is available, run these searches in parallel and synthesize:

```
"{{ADDRESS}}" "{{CITY}}" zillow
"{{ADDRESS}}" "{{CITY}}" redfin
"{{ADDRESS}}" "{{CITY}}" homes.com
"{{ADDRESS}}" "{{CITY}}" tax assessor
"{{ADDRESS}}" "{{CITY}}" parcel
"{{COUNTY}} county GIS parcel viewer"
"{{COUNTY}} county revenue commission tax search"
"{{COUNTY}} county recorder of deeds"
"{{COUNTY}} county building permits"
"{{ZIP}} median sale price redfin"
"{{ZIP}} active listings under {{LIST_PRICE_PLUS_15}}"
"{{CITY}} {{STATE}} schools greatschools"
"{{CITY}} {{STATE}} augurisk"
"{{ADDRESS}} riskfactor.com"
"{{ZIP}} FEMA flood map"
"{{STATE}} radon zones EPA"
"{{ZIP}} FCC broadband map"
"Freddie Mac PMMS 30 year fixed current"
"{{STATE}} hurricane wind insurance pool"
"{{COUNTY}} {{STATE}} septic permit search"
```

Then for each promising URL, `WebFetch` for the detail.
