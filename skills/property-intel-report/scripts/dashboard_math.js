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

// F: dashboard facts (see build_dashboard.js). s: { price, downPct, ratePct, years, cash }.
function computeCarry(F, s) {
  var down = s.cash ? s.price : Math.round(s.price * s.downPct / 100);
  var loan = Math.max(0, s.price - down);
  var pi = pmt(loan, s.ratePct, s.years);
  var ltv = s.price ? loan / s.price : 0;
  var pmi = ltv > 0.8 ? loan * F.pmi_rate / 12 : 0;
  var tax = F.tax_annual != null ? F.tax_annual / 12 : null;
  var hoa = F.hoa_monthly || 0;
  var insLo = F.premium_low != null ? F.premium_low / 12 : null;
  var insHi = F.premium_high != null ? F.premium_high / 12 : null;
  var flLo = F.flood_premium_low != null ? F.flood_premium_low / 12 : null;
  var flHi = F.flood_premium_high != null ? F.flood_premium_high / 12 : null;
  var fixed = pi + pmi + (tax || 0) + hoa;
  var missing = [];
  if (tax == null) missing.push("tax");
  if (insLo == null) missing.push("insurance");
  return {
    down: down, loan: loan, ltv: ltv, pi: pi, pmi: pmi, tax: tax, hoa: hoa,
    insLo: insLo, insHi: insHi, flLo: flLo, flHi: flHi,
    low: fixed + (insLo || 0) + (flLo || 0),
    high: fixed + (insHi || 0) + (flHi || 0),
    missing: missing
  };
}

// Wind deductible options in dollars. quotes: optional { pct: annualPremium } typed by the buyer.
// Break-even compares each option to the lowest-percentage option that has a quote.
function deductibleTable(F, quotes) {
  quotes = quotes || {};
  var opts = (F.wind_deductible_options_pct || []).slice().sort(function (a, b) { return a - b; }).map(function (p) {
    return { pct: p, dollars: Math.round(F.cov_a_est * p / 100), chosen: p === F.wind_deductible_pct, premium: quotes[p] > 0 ? quotes[p] : null };
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

module.exports = { pmt, computeCarry, deductibleTable };
