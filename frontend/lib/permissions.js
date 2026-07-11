// Mirrors backend/utils/permissions.js — keep keys in sync.
export const PERMISSION_KEYS = [
  { key: "view_all_leads", label: "View all leads (not just assigned)" },
  { key: "assign_leads", label: "Assign leads to other employees" },
  { key: "delete_leads", label: "Delete leads" },
  { key: "edit_lead_details", label: "Edit lead details (name, phone, email)" },
  { key: "manage_customers", label: "Manage customers & payments" },
  { key: "view_customers", label: "View customers" },
  { key: "manage_automation", label: "Manage automation (email/SMS/WhatsApp)" },
  { key: "manage_employees", label: "Manage team / employees" },
  { key: "manage_settings", label: "Manage org settings" },
];

export function isOwnerUser(user) {
  return !!user && (user.role === "user" || user.role === "superadmin");
}

export function hasPerm(user, key) {
  if (isOwnerUser(user)) return true;
  return user?.permissions?.[key] === true;
}
