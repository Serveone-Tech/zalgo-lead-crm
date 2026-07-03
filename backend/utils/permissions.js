// Permission keys that can be toggled per sub-account (employee/manager).
// Owners (role='user') and superadmins implicitly have all permissions.
const PERMISSION_KEYS = [
  "view_all_leads",
  "assign_leads",
  "delete_leads",
  "manage_customers",
  "view_customers",
  "manage_automation",
  "manage_employees",
  "manage_settings",
];

// True if the requester is the tenant owner/superadmin, or has the given
// permission flag set on their sub-account.
const hasPermission = (req, key) => {
  if (!req.user) return false;
  if (req.user.role === "user" || req.user.role === "superadmin") return true;
  return req.user.permissions?.[key] === true;
};

const isOwner = (req) =>
  !!req.user && (req.user.role === "user" || req.user.role === "superadmin");

module.exports = { PERMISSION_KEYS, hasPermission, isOwner };
