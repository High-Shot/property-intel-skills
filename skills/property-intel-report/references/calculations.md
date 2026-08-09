# Calculations

The synthesis stage requires several explicit calculations. Each is documented here with the formula, sample values, and common adjustments.

## 1. Principal & Interest

Standard 30-year fixed amortization:

```
PMT = P × r × (1+r)^n / ((1+r)^n - 1)

where:
  P = loan principal
  r = monthly interest rate = APR / 12
  n = number of payments = 360 for 30-yr
```

**Per-$100K shortcut** — a sanity check only. If the current rate falls outside 5.00%–7.50%, compute PMT from the formula rather than extrapolating.

| 30-yr Rate | $/mo per $100K |
|------------|----------------|
| 5.00%      | $537           |
| 5.50%      | $568           |
| 6.00%      | $600           |
| 6.30%      | $619           |
| 6.50%      | $632           |
| 7.00%      | $665           |
| 7.50%      | $699           |

**Example:** $292,000 loan at 6.30% → 2.92 × $619 = **$1,807/mo**.

## 2. PMI

Required when LTV > 80%. Typical range 0.30%–1.00% of loan balance annually depending on credit. Default and vintage in `rates_and_anchors.md` §1.

```
PMI/mo = loan_balance × 0.007 / 12
```

**Example:** $328,500 loan → $328,500 × 0.007 / 12 = **$192/mo**.

PMI drops off automatically at 78% LTV by federal law (Homeowners Protection Act of 1998). Some lenders cancel earlier on borrower request at 80%.

## 3. Property Tax (post-sale projection)

Sellers often have homestead, senior, or disability exemptions that reset on sale. Compute the post-sale tax:

```
post_sale_tax = assessed_value × millage_rate
millage_rate ≈ current_tax / current_assessed_value (with seller's exemption)
```

If you can't get the millage rate cleanly, estimate post-sale tax at:

```
post_sale_tax ≈ current_tax × (1 + exemption_lift)
```

where `exemption_lift` is the value in `rates_and_anchors.md` §2. Use the parcel's actual millage whenever it is retrievable; this fallback is a last resort.

**Example:** Seller pays $1,388/yr with homestead. Post-sale estimate: $1,388 × 1.30 = $1,800/yr → **$150/mo**.

For the 5-year projection, grow this number at the rate in `rates_and_anchors.md` §2. If the parcel's actual trailing 5-year tax growth was higher, use that instead.

## 4. Insurance estimates

**`property-insurance-brief` owns this domain.** See the ownership table in `property_facts.md`.

If `property_facts.json` carries an `insurance` block, use `premium_low` / `premium_high` from it and cite the sibling skill. Do not recompute and do not publish a different number — two decks for one buyer must not disagree on the premium.

If no sibling run exists, use the orientation bands in `rates_and_anchors.md` §3, label every figure est., and add a line to the carry slide: *"Insurance is the widest band in this estimate. Run property-insurance-brief for a sourced range and a quote spec."*

**Flood: do not price by FEMA zone.** NFIP Risk Rating 2.0 (effective October 2021) prices per structure using elevation, distance to water, rebuild cost, and flood frequency — not the zone letter. The zone still drives the *mandatory purchase* requirement for federally backed mortgages, so report it for that purpose. For cost, use the band in `rates_and_anchors.md` §3 and say it is an orientation band pending a quote. Any table in an older version of this skill that priced flood as X / AE / VE is obsolete; do not reintroduce it.

For the 5-year projection, grow combined insurance at the rates in `rates_and_anchors.md` §4.

## 5. Normalized comp $/sqft analysis

Compute $/sqft for every comp:

```
psf = sale_price / living_sqft
```

Then compute adjusted base for the subject:

```
1. comp_avg_psf = average of comp $/sqft
2. Apply premiums to remove (subtract):
   - Waterfront (creek, lake, bay direct): -10% to -20% — comps with water frontage carry a premium the subject doesn't get
   - Newer build: -5% per ~15 years newer (newer comps cost more per sqft)
   - Larger lot: -3% per acre over 1 if the comp has more land
   - Recent remodel: -10% to -15% if the comp is renovated
3. Adjusted base = comp_avg_psf × Π(1 - p_i)   ← compound the strips, never sum them
4. Apply fixer discount to subject:
   - Cosmetic only: -5% to -10%
   - "Buyer to verify all" listing language: -15%
   - Major systems unknown: -20% to -25%
5. Implied subject psf range = [adjusted_base × (1 - fixer_low), adjusted_base]
6. Implied fair value = implied_psf_range × subject_sqft
```

**Strips compound; they do not sum.** For n stripped premiums at percents p_i:

```
adjusted = base × Π(1 - p_i)
```

Summing the percentages and subtracting once over-strips.

**Worked example.** Five comps at $173, $250, $237, $195, $167 per sqft.

```
comp_avg  = (173 + 250 + 237 + 195 + 167) / 5 = 1022 / 5 = $204 / sqft
strip 15% waterfront  →  204 × 0.85 = $173 / sqft
strip 10% newer build →  173 × 0.90 = $156 / sqft   ← adjusted base
fixer discount -25%   →  156 × 0.75 = $117 / sqft   ← low end
range: $117 – $156 / sqft
for a 2,875 sqft subject: $336K – $449K
```

Note step 1. The average is computed from the comps shown, then verified against them. Do not carry forward an average that does not reproduce from the list — every number downstream inherits the error.

## 6. 5-year monthly carry projection

```
year_n_pi      = year_1_pi  (fixed)
year_n_tax     = year_1_tax × (1 + tax_growth)^(n-1)
year_n_ins     = year_1_ins × (1 + ins_growth)^(n-1)
year_n_total   = pi + tax + ins
delta          = year_5_total - year_1_total
cumulative_5yr = sum_{n=1..5} (year_n_total - year_1_total) × 12
```

For the deck, show year 1 through year 5 as 5 stacked bars, plus the year-1 → year-5 delta as the right callout.

## 7. Recommended opening offer

```
opening_low  = implied_fair_value_high × 0.90
opening_high = implied_fair_value_high × 0.94
```

That is 6% to 10% below the fair-value high. Round to nearest $5K. Always express as a range so the buyer has negotiating posture.

Example, continuing §5: implied fair value high of $449K → $449K × 0.90 = $404K, × 0.94 = $422K → opening offer **$405K–$420K** after rounding. Show this arithmetic in the deck's rationale lines.

This is mechanical, not strategic. Adjust upward if competing offers are likely; adjust downward if condition issues are surfaced or the listing has been on market 60+ days with multiple cuts.

## 8. Time-on-market stress signal

An unsourced in-house heuristic for negotiating leverage. It has no empirical backing; use it to rank one listing against another, never as a published figure.

```
cuts          = price_history_points - 1        (the first point is the original ask)
days          = today - first_listing_date       (this cycle only)
cuts_per_30   = cuts / (days / 30)
signal        = days × cuts × cuts_per_30
```

Low = strong seller. High = motivated seller, real leverage on the offer.

Two counting rules that are easy to get wrong and were wrong in an earlier example:

- **Cuts = points minus one.** Twelve price points is eleven reductions. The slide title, the callout, and the red-flag body must all use the same number.
- **Days on market is measured from the first listing date of the current cycle to today**, not to the last price cut. If the deck's prepared date is later than the last cut, days on market is still counted to the prepared date.
