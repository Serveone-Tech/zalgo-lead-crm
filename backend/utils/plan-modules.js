// Derived from ../../shared/plan-modules.js — that file is the single
// canonical list (see its own header comment); this is just the
// backend-side validation built on top of it, not a second copy.
const { MODULES } = require("../../shared/plan-modules");

const PLAN_MODULE_KEYS = MODULES.map((m) => m.key);

function validateFeatures(features) {
  if (!Array.isArray(features)) return "features must be an array";
  const unknown = features.filter((f) => !PLAN_MODULE_KEYS.includes(f));
  if (unknown.length > 0) return `Unknown feature key(s): ${unknown.join(", ")}`;
  return null;
}

module.exports = { PLAN_MODULE_KEYS, validateFeatures };
