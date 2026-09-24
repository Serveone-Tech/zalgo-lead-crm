// Shared human-readable labels for plan feature keys — used by the
// authenticated in-app plan-selection page (app/plans/page.js) and the
// public marketing pricing page (app/pricing/page.js), so both stay in
// sync with whatever feature keys the backend actually gates
// (backend/middleware/auth.js's requirePlanFeature calls).
export const FEATURE_LABELS = {
  core: "Lead Management (core)",
  customers: "Customer & Payment Management",
  lead_sources: "Automatic Lead Capture (Google Sheets, Google Ads, Meta Ads, WhatsApp, Calls)",
  automation: "Outbound Automation (WhatsApp + Email + SMS)",
  employees: "Team / Employee Management",
};

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
