// Mirrors backend/utils/permissions.js — keep keys in sync.
export const PERMISSION_KEYS = [
  { key: "view_all_leads", label: "View all leads (not just assigned)" },
  { key: "assign_leads", label: "Assign leads to other employees" },
  { key: "delete_leads", label: "Delete leads" },
  { key: "edit_lead_details", label: "Edit lead details (name, phone, email)" },
  { key: "bulk_upload_leads", label: "Bulk upload leads (CSV/Excel)" },
  { key: "manage_customers", label: "Manage customers & payments" },
  { key: "delete_customers", label: "Delete customers" },
  { key: "view_customers", label: "View customers" },
  { key: "manage_automation", label: "Manage automation (email/SMS/WhatsApp)" },
  { key: "manage_employees", label: "Manage team / employees" },
  { key: "manage_settings", label: "Manage org settings" },
];

// Read/Write/Delete matrix shown in the Team permissions UI — a professional
// module-by-module grid instead of a flat list of oddly-worded checkboxes.
// Each cell maps to one or more of the underlying PERMISSION_KEYS flags
// above (storage format is unchanged — this is presentation only). A module
// that has no concept of one of the three actions (e.g. Settings has no
// "delete") simply omits that cell, which the UI renders as "—".
export const PERMISSION_MODULES = [
  {
    key: "leads",
    label: "Leads",
    read: { keys: ["view_all_leads"], hint: "See every lead, not just ones assigned to you" },
    write: {
      keys: ["edit_lead_details", "assign_leads", "bulk_upload_leads"],
      hint: "Add leads, edit full details, assign to others, bulk upload — without this, only the lead's name can be renamed",
    },
    delete: { keys: ["delete_leads"], hint: "Delete leads" },
  },
  {
    key: "customers",
    label: "Customers",
    read: { keys: ["view_customers"], hint: "View the Customers section at all" },
    write: { keys: ["manage_customers"], hint: "Add/edit customers, orders, delivery & payment info" },
    delete: { keys: ["delete_customers"], hint: "Delete customers" },
  },
  {
    key: "automation",
    label: "Automation",
    write: { keys: ["manage_automation"], hint: "Configure lead-source webhooks, WhatsApp, delivery providers" },
  },
  {
    key: "team",
    label: "Team",
    write: { keys: ["manage_employees"], hint: "Add/edit/remove employees and their permissions" },
  },
  {
    key: "settings",
    label: "Settings",
    write: { keys: ["manage_settings"], hint: "View and change organization settings" },
  },
];

export function isOwnerUser(user) {
  return !!user && (user.role === "user" || user.role === "superadmin");
}

export function hasPerm(user, key) {
  if (isOwnerUser(user)) return true;
  return user?.permissions?.[key] === true;
}
