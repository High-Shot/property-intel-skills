# Insurance Data Sources by Reliability

Every premium figure on slide 8 names its source in `basis_lines`. Every property fact on the spec sheet is permit- or record-grade where possible, listing-claimed where not, and labeled.

## Tier 0 — Real quotes for the subject property (strongest anchor)

Quotes the buyer already holds beat every published source. Extract the total walk-out cost (premium + policy fee + inspection fee + agency fee + surplus lines tax), never the property premium alone — real fee stacks add 15-25% to the headline number. Record the channel (admitted vs surplus lines), minimum earned premium, and the forms schedule. Two quotes on different specs are not comparable; normalize to the spec sheet before using either as an anchor.

## Tier 1 — Regulator and program sources (anchor-grade)

- **State DOI premium comparison tools** — e.g. ALDOI ComparePremiums (real filed HO-3 premiums by company, coverage profile, and territory). The primary anchor for the premium range. Match the closest published profile and say which one.
- **State mitigation programs** — Strengthen Alabama Homes (FORTIFIED grants), state wind-mitigation credit schedules. Credit percentages here are regulator-mandated, quotable as ranges.
- **IBHS FORTIFIED** — the standard itself; what Roof vs Silver vs Gold requires.
- **FEMA Map Service Center** — flood zone and BFE (or via property-intel-report when it ran).
- **NFIP / FloodSmart** — flood pricing structure and Risk Rating 2.0 context. Zone-based ballparks are labeled est. pending an actual quote.

## Tier 2 — Named rate studies and market data (context-grade)

- State-average premium studies with a named publisher and year (Insurify, Bankrate, NerdWallet, Policygenius rate analyses). Usable as a basis line only with publisher and year in the label.
- Insurance trade press for market-structure facts (wind pool population, carrier exits) — direction, not dollars.

## Tier 3 — Unattributed figures (never used)

- Premium numbers with no named source, forum anecdotes, lead-gen site "average cost" widgets with no methodology. These never appear in the deck, even labeled.

## Property facts for the spec sheet

Priority order per the family's primary-sources rule:

1. **Permit records** — roof age, HVAC, additions (permit-verified beats everything).
2. **County assessor/appraisal district** — year built, sqft, construction.
3. **property-intel-report output** — FEMA zone, BFE, lidar freeboard, distance to coast, permit findings. Harvest, don't re-research.
4. **Listing/portal pages** — construction and roof claims, labeled "per listing, unverified" until a record confirms.

## Territory specifics: coastal Alabama (worked example)

This section is one territory's detail, kept as a model for the level of specificity to gather elsewhere. Every figure in it is dated in `rates_and_anchors.md`. Do not apply these numbers to another state.


- **Surplus lines is a mainstream channel here, not an exception.** Lloyd's syndicates via local MGAs and wholesalers write much of the coastal book. Consequences the brief must explain: 6% AL surplus lines tax on premium, 25% minimum earned premium is common (cancel early, still owe a quarter), fees fully earned, no Alabama Insurance Guaranty Association backing if the carrier fails. Surplus Line Association of Alabama and ALDOI are the sources.

- **AIUA** (Alabama Insurance Underwriting Association) — the beach/wind pool for Baldwin and Mobile counties. Whether a property is quoted voluntary vs pool is a slide 2 primer fact and an agent-script question.
- **ALDOI ComparePremiums** covers Baldwin County territories directly; use the closest dwelling-value profile.
- **Baldwin County portals** (Revenue Commission, GIS) are JavaScript-interactive and do not respond to web fetch. County-sourced facts come via search snippets or the intel report, labeled est. where unverified.
- FORTIFIED credits in coastal AL are among the largest in the country; ALDOI publishes mitigation-discount comparisons showing 50%+ wind-premium reductions in Baldwin County cities. Always check whether the roof already qualifies before pricing a retrofit.

## Search patterns that work

- `<state> department of insurance homeowners premium comparison` — finds the DOI tool
- `<state> average homeowners insurance <dwelling value> <year>` — named rate studies
- `<county> wind pool AIUA eligibility` — pool vs voluntary context
- `FORTIFIED roof insurance discount <state>` — mitigation credit data
- Plain-text queries only. No site:, quote, or minus operators.

## What to gather in a territory you have not covered

The coastal Alabama section above is a worked example of the depth required. In a new territory, gather the equivalent:

1. **Placement channels.** Which carriers are admitted here, whether surplus lines / E&S is routine, and whether a residual market or wind pool exists. Name it.
2. **Surplus lines consequences**, if applicable: the state's surplus-lines tax rate, typical minimum earned premium, fully earned fees, and the absence of guaranty-fund protection.
3. **Deductible structure.** Whether carriers write percentage wind or hurricane deductibles at all, and which steps they actually quote. This sets `market_profile`.
4. **Mitigation credit programs.** The state or institute program by name, its tiers, and a filed credit figure with its source. If none exists, record that it does not — a missing lever is information.
5. **Premium anchors.** The state DOI premium comparison tool if one exists, plus one named rate study. If the state has neither, say so on the caveats slide rather than padding the basis lines.

## Source volatility

State programs get renamed, defunded, and re-tiered. Surplus-lines tax rates are statutory and change. Filed credit schedules change annually. Regulator comparison tools move. Treat every program name and rate in this file as dated, not permanent — the dates are in `rates_and_anchors.md`, and anything older than six months is re-verified at run time or labeled stale.
