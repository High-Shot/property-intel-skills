/**
 * Map a property_facts.json cache to the flat facts object the dashboard and
 * compare pages render. No validation here; the builders validate.
 */
const { PMI_RATE, PMI_AS_OF, FHA, K203 } = require("./anchors.js");

function mapFacts(PF, opt) {
  opt = opt || {};
  const A = PF.address || {}, M = PF.market || {}, VAL = PF.value || null, INS = PF.insurance || null;
  const fmtDate = s => {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return s || null;
    return new Date(s + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  };
  const num = v => (typeof v === "number" && isFinite(v) ? v : null);

  const F = {
    address: A.street || "Subject property",
    city_state_zip: [A.city, [A.state, A.zip].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    report_date: fmtDate(opt.today || PF.last_updated),
    list_price: num(M.list_price),
    value: VAL && num(VAL.point) ? { point: VAL.point, low: VAL.low, high: VAL.high, confidence: VAL.confidence || "Unrated" } : null,
    rate_pct: num(M.mortgage_rate_pct), rate_source: M.rate_source || null, rate_date: fmtDate(M.rate_date),
    tax_annual: num(M.tax_annual_post_sale), hoa_monthly: num(M.hoa_monthly) || 0,
    pmi_rate: PMI_RATE, pmi_as_of: PMI_AS_OF,
    cov_a_est: INS ? num(INS.cov_a_est) : null,
    premium_low: INS ? num(INS.premium_low) : null, premium_high: INS ? num(INS.premium_high) : null,
    flood_premium_low: INS ? num(INS.flood_premium_low) : null, flood_premium_high: INS ? num(INS.flood_premium_high) : null,
    flood_required: INS ? !!INS.flood_required : false,
    wind_deductible_pct: INS ? num(INS.wind_deductible_pct) : null,
    wind_deductible_default: INS ? INS.wind_deductible_chosen === "default" : false,
    wind_deductible_options_pct: INS && Array.isArray(INS.wind_deductible_options_pct) ? INS.wind_deductible_options_pct : [],
    aop_deductible: INS ? num(INS.aop_deductible) : null,
    wind_note: INS ? INS.wind_note || null : null,
    fha: Object.assign({}, FHA, { loan_limit: num(M.fha_loan_limit) }),
    k203: K203,
    repairs: PF.repairs && Array.isArray(PF.repairs.items) && PF.repairs.items.length ? PF.repairs : null,
    buyer: PF.buyer && PF.buyer.financing ? PF.buyer.financing : null,
    note: PF.dossier && PF.dossier.note && PF.dossier.note.headline ? PF.dossier.note : null,
    sources: Object.entries(PF.provenance || {}).map(([k, v]) =>
      `${k}: ${v.source}${v.tier ? ` (Tier ${v.tier})` : ""}${v.retrieved ? `, retrieved ${v.retrieved}` : ""}`)
  };

  return { F, A, M, VAL, INS };
}

module.exports = { mapFacts };
