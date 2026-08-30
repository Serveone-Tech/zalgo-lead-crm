// Shared human-readable labels for plan feature keys — used by the
// authenticated in-app plan-selection page (app/plans/page.js) and the
// public marketing pricing page (app/pricing/page.js), so both stay in
// sync with whatever feature keys the backend actually gates
// (backend/middleware/auth.js's requirePlanFeature calls).
export const FEATURE_LABELS = {
  customers: "Customer & Payment Management",
  lead_sources: "Automatic Lead Capture (Google Sheets, Google Ads, Meta Ads, WhatsApp, Calls)",
  automation: "Outbound Automation (WhatsApp + Email + SMS)",
  bulk_upload: "Bulk Lead Import (CSV)",
  employees: "Team / Employee Management",
};
