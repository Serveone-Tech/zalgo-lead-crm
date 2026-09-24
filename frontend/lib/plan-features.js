// Derived from ../../shared/plan-modules.js — that file is the single
// canonical list of real plan feature keys (see its own header comment),
// shared with backend/utils/plan-modules.js's validation. This is not a
// second hand-maintained copy of the key list, just the label lookup built
// on top of it for the authenticated in-app plan-selection page
// (app/plans/page.js), the public marketing pricing page
// (app/pricing/page.js), and the Super Admin plan editor's checkboxes.
import { MODULES } from "../../shared/plan-modules";

export const FEATURE_LABELS = Object.fromEntries(MODULES.map((m) => [m.key, m.label]));

// `sub` is whatever `/auth/subscription` (or `GET /auth/me`'s embedded
// subscription) last returned — `features` may come back as a JSON string
// or an already-parsed array depending on the code path. Returns null while
// the subscription hasn't loaded yet, distinct from an empty feature list.
export function parsePlanFeatures(sub) {
  if (!sub?.features) return null;
  return typeof sub.features === "string" ? JSON.parse(sub.features) : sub.features;
}

// One shared definition of "can this plan use module X" — every page that
// gates a link/section on the owner's plan (Sidebar, Customers, Leads,
// Automation) should get its `hasPlanFeature` from here instead of
// redefining this same closure locally, so the rule never drifts between
// pages.
export function makeHasPlanFeature(user, planFeatures) {
  return function hasPlanFeature(feat) {
    if (!user || user.parent_id) return true; // employees — backend guards anyway
    if (!planFeatures) return true; // owner but sub not loaded yet
    return planFeatures.includes(feat);
  };
}
