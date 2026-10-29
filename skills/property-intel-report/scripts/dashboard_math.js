/**
 * Dossier dashboard math. Single source of truth.
 *
 * build_dashboard.js requires this module to validate, then copies the same
 * function source into the page. Keep every function self-contained (no
 * references to module scope) because its text is injected verbatim.
 *
 * Only deterministic math lives here: loan payment, PMI, deductible dollars,
 * break-even on quotes the buyer types in. Premiums, value, and tax are read
 * from property_facts.json as the owning skill wrote them. Nothing here
 * interpolates or invents a premium.
 */

// Monthly principal and interest.
function pmt(principal, ratePct, years) {
  if (!(principal > 0)) return 0;
  var r = ratePct / 100 / 12, n = years * 12;
  return r === 0 ? principal / n : principal * r / (1 - Math.pow(1 + r, -n));
}

// FHA annual MIP rate (decimal) by term and LTV. Base loans above F.fha.mip_high_balance use the higher tier.
function fhaAnnualMip(F, ltv, years, base) {
  var m = F.fha, hi = base > m.mip_high_balance;
  if (years > 15) return ltv > 0.95 ? (hi ? m.mip30_high_gt95 : m.mip30_gt95) : (hi ? m.mip30_high_le95 : m.mip30_le95);
  return ltv > 0.90 ? (hi ? m.mip15_high_gt90 : m.mip15_gt90) : (hi ? m.mip15_high_le90 : m.mip15_le90);
}

// F: dashboard facts (see build_dashboard.js).
// s: { price, downPct, ratePct, years, cash, loanType: "conv"|"fha", financed: repair dollars added to the loan }.
// Down payment is taken on price + financed repairs, the way renovation loans size the base.
function computeCarry(F, s) {
  var financed = s.cash ? 0 : (s.financed || 0);
  var cost = s.price + financed;
  var fha = !s.cash && s.loanType === "fha";
  var downPct = fha ? Math.max(s.downPct, F.fha.min_down_pct) : s.downPct;
  var down = s.cash ? s.price : Math.round(cost * downPct / 100);
  var base = Math.max(0, cost - down);
  var ufmip = fha ? Math.round(base * F.fha.ufmip_rate) : 0;
  var loan = base + ufmip;
  var pi = pmt(loan, s.ratePct, s.years);
  var ltv = cost ? base / cost : 0;
  var mipRate = fha ? fhaAnnualMip(F, ltv, s.years, base) : 0;
  var mi = fha ? base * mipRate / 12 : (ltv > 0.8 ? base * F.pmi_rate / 12 : 0);
  var tax = F.tax_annual != null ? F.tax_annual / 12 : null;
  var hoa = F.hoa_monthly || 0;
  var insLo = F.premium_low != null ? F.premium_low / 12 : null;
  var insHi = F.premium_high != null ? F.premium_high / 12 : null;
  var flLo = F.flood_premium_low != null ? F.flood_premium_low / 12 : null;
  var flHi = F.flood_premium_high != null ? F.flood_premium_high / 12 : null;
  var fixed = pi + mi + (tax || 0) + hoa;
  var missing = [];
  if (tax == null) missing.push("tax");
  if (insLo == null) missing.push("insurance");
  return {
    down: down, downPct: downPct, base: base, ufmip: ufmip, loan: loan, ltv: ltv, financed: financed,
    fha: fha, mipRate: mipRate, overLimit: fha && F.fha.loan_limit ? base > F.fha.loan_limit : false,
    pi: pi, pmi: mi, tax: tax, hoa: hoa,
    insLo: insLo, insHi: insHi, flLo: flLo, flHi: flHi,
    low: fixed + (insLo || 0) + (flLo || 0),
    high: fixed + (insHi || 0) + (flHi || 0),
    missing: missing
  };
}

// Repair budget from the appraisal's walkthrough list. scope: "min" | "full". withUpgrades: include upgrade items.
// Full scope uses each item's full_low/full_high when present, else its low/high.
function repairBudget(F, scope, withUpgrades) {
  var items = ((F.repairs && F.repairs.items) || []).filter(function (r) { return r.category !== "upgrade" || withUpgrades; });
  var lo = 0, hi = 0;
  var rows = items.map(function (r) {
    var full = scope === "full" && r.full_low != null;
    var a = full ? r.full_low : r.low, b = full ? r.full_high : r.high;
    lo += a; hi += b;
    return { item: r.item, detail: full ? (r.full_detail || r.detail) : r.detail, low: a, high: b, category: r.category || "repair", moisture: !!r.moisture };
  });
  var cont = F.k203.contingency_pct / 100;
  var withContHi = Math.round(hi * (1 + cont));
  return { rows: rows, low: lo, high: hi, mid: Math.round((lo + hi) / 2), withContHigh: withContHi,
    fitsLimited: withContHi <= F.k203.limited_cap, cap: F.k203.limited_cap };
}

// Wind deductible options in dollars. quotes: optional { pct: annualPremium } typed by the buyer.
// Break-even compares each option to the lowest-percentage option that has a quote.
function deductibleTable(F, quotes) {
  quotes = quotes || {};
  var opts = (F.wind_deductible_options_pct || []).slice().sort(function (a, b) { return a - b; }).map(function (p) {
    // A carrier quoting a flat-dollar hurricane deductible: the chosen option's dollars are that flat figure.
    var flat = p === F.wind_deductible_pct && F.wind_deductible_flat > 0 ? F.wind_deductible_flat : null;
    return { pct: p, dollars: flat != null ? flat : Math.round(F.cov_a_est * p / 100), flat: flat != null, chosen: p === F.wind_deductible_pct, premium: quotes[p] > 0 ? quotes[p] : null };
  });
  var base = null;
  for (var i = 0; i < opts.length; i++) if (opts[i].premium != null) { base = opts[i]; break; }
  opts.forEach(function (o) {
    o.savings = null; o.extraExposure = null; o.breakevenYrs = null;
    if (base && o !== base && o.premium != null) {
      o.savings = base.premium - o.premium;
      o.extraExposure = o.dollars - base.dollars;
      o.breakevenYrs = o.savings > 0 ? o.extraExposure / o.savings : null;
    }
  });
  return { options: opts, base: base };
}

module.exports = { pmt, fhaAnnualMip, computeCarry, repairBudget, deductibleTable };
