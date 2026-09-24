// The full set of real, backend-enforced plan feature keys — every one of
// these is a literal string checked by some `requirePlanFeature("X")` call
// (see middleware/auth.js + grep across routes/*.js). Mirrors
// frontend/lib/plan-features.js's FEATURE_LABELS keys exactly — that file
// is the single source for the human-readable label shown in the UI
// (superadmin Plans page, the in-app /plans page, the public /pricing
// page); this file is the single source for backend validation, so a
// plan's `features` array can never contain a typo'd key that silently
// gates nothing. If you add a new requirePlanFeature("X") call anywhere,
// add "X" to both lists.
const PLAN_MODULE_KEYS = ["core", "customers", "lead_sources", "automation", "employees"];

function validateFeatures(features) {
  if (!Array.isArray(features)) return "features must be an array";
  const unknown = features.filter((f) => !PLAN_MODULE_KEYS.includes(f));
  if (unknown.length > 0) return `Unknown feature key(s): ${unknown.join(", ")}`;
  return null;
}

module.exports = { PLAN_MODULE_KEYS, validateFeatures };
