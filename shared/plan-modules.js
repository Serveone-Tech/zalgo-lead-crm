// THE single canonical list of real, backend-enforced plan feature keys —
// every one is a literal string checked by some requirePlanFeature("X")
// call (see backend/middleware/auth.js + every backend/routes/*.js file).
// Both backend/utils/plan-modules.js (validation) and
// frontend/lib/plan-features.js (labels shown in the Super Admin plan
// editor, the in-app /plans page, and the public /pricing page) import
// this file directly — neither hand-maintains its own copy of the key
// list, so they cannot silently drift apart. If you add a new
// requirePlanFeature("X") call anywhere in the backend, add it here first.
const MODULES = [
  { key: "core", label: "Lead Management (core)" },
  { key: "customers", label: "Customer & Payment Management" },
  { key: "lead_sources", label: "Automatic Lead Capture (Google Sheets, Google Ads, Meta Ads, WhatsApp, Calls)" },
  { key: "automation", label: "Outbound Automation (WhatsApp + Email + SMS)" },
  { key: "employees", label: "Team / Employee Management" },
];

module.exports = { MODULES };
