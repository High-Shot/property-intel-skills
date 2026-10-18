/**
 * Loan anchors shared by the dossier dashboard and compare mode.
 * Mirrored from references/rates_and_anchors.md §1 and §1a. Change both together;
 * the builders warn when these are more than six months old.
 */
// PMI anchor, mirrored from references/rates_and_anchors.md. Update both together.
const PMI_RATE = 0.007, PMI_AS_OF = "2026-08";
// FHA and 203(k) anchors, mirrored from references/rates_and_anchors.md §1a. Update both together.
const FHA = {
  as_of: "2026-10", min_down_pct: 3.5, ufmip_rate: 0.0175, mip_high_balance: 726200,
  mip30_gt95: 0.0055, mip30_le95: 0.0050, mip30_high_gt95: 0.0075, mip30_high_le95: 0.0070,
  mip15_gt90: 0.0040, mip15_le90: 0.0015, mip15_high_gt90: 0.0065, mip15_high_le90: 0.0040
};
const K203 = { as_of: "2026-10", limited_cap: 75000, contingency_pct: 10 };

module.exports = { PMI_RATE, PMI_AS_OF, FHA, K203 };
