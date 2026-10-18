/**
 * Comp Explorer math. Single source of truth.
 *
 * build_explorer.js requires this module to validate the data file, then
 * injects the same function source into the HTML page, so the page and the
 * validator can never disagree about how a comp selection becomes a value.
 *
 * Every function here must stay self-contained (no closures over module scope)
 * because its source text is copied into the page verbatim.
 */

// Recompute the value walk for a subset of the deck's comps.
// D: explorer data (see build_explorer.js). inc: array of booleans, one per comp.
// opts.exact: true forces arithmetic even when every comp is included
// (the validator uses this to prove the deck's numbers reproduce).
function computeValue(D, inc, opts) {
  opts = opts || {};
  var comps = D.comps;
  var vc = D.value_conclusion;
  var sel = [];
  for (var i = 0; i < comps.length; i++) if (inc[i]) sel.push(i);
  if (!sel.length) return { empty: true, included: 0, total: comps.length };

  var all = sel.length === comps.length && !opts.exact;
  var wSum = 0;
  sel.forEach(function (i) { wSum += comps[i].weight; });
  var weights = comps.map(function (c, i) { return inc[i] ? c.weight / wSum : 0; });
  var base = 0;
  sel.forEach(function (i) { base += comps[i].adjusted_value * weights[i]; });
  var r1k = function (n) { return Math.round(n / 1000) * 1000; };

  var point = all ? vc.point_value : r1k(base + D.condition_total);
  var baseShown = all ? D.base_indicated_value : Math.round(base);

  // Confidence: the comp evidence can only lower the deck's rating, never raise it.
  // Rubric from methodology.md section 6, comp-count and tier criteria only.
  var names = ["Low", "Medium", "High"];
  var rank = { Low: 0, Medium: 1, High: 2 };
  var orig = rank[vc.confidence] !== undefined ? rank[vc.confidence] : 1;
  var t1 = sel.filter(function (i) { return comps[i].source_tier === 1; }).length;
  var cap = sel.length < 3 ? 0 : (sel.length < 4 || t1 < 3) ? 1 : 2;
  var conf = all ? orig : Math.min(orig, cap);
  var thin = sel.length < 3;

  var low, high;
  if (all) { low = vc.range_low; high = vc.range_high; }
  else {
    var origHalf = (vc.range_high - vc.range_low) / 2 / vc.point_value;
    var half;
    if (thin && comps.length >= 3) half = Math.max(0.15, origHalf); // thin-comp path
    else if (conf === orig) half = origHalf;
    else half = [0.11, 0.07, 0.04][conf];
    low = r1k(point * (1 - half));
    high = r1k(point * (1 + half));
  }

  // Verdict, methodology.md section 8. Percent is measured against list.
  var list = D.list_price;
  var verdict = null, pct = null, delta = null;
  if (list) {
    delta = point - list;
    pct = delta / list * 100;
    var p = Math.round(pct * 10) / 10;
    verdict = p >= 3 ? "Priced below value"
      : p > -3 ? "Priced at value"
      : p >= -8 ? "Priced above value"
      : "Significantly overpriced";
  }

  var sqft = D.subject_sqft;
  var adjPsf = sel.map(function (i) { return comps[i].adjusted_value / sqft; }).sort(function (a, b) { return a - b; });
  var mid = Math.floor(adjPsf.length / 2);
  var median = adjPsf.length % 2 ? adjPsf[mid] : (adjPsf[mid - 1] + adjPsf[mid]) / 2;
  var mean = adjPsf.reduce(function (a, b) { return a + b; }, 0) / adjPsf.length;

  return {
    empty: false, included: sel.length, total: comps.length, isDefault: all,
    weights: weights, base: baseShown, point: point, low: low, high: high,
    confidence: names[conf], confidenceDropped: conf < orig, thin: thin,
    verdict: verdict, delta: delta, pct: pct,
    medianAdjPsf: median, meanAdjPsf: mean
  };
}

// Great-circle distance in miles.
function haversineMi(lat1, lng1, lat2, lng2) {
  var R = 3958.8, toR = Math.PI / 180;
  var dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

module.exports = { computeValue, haversineMi };
