import axios from "axios";

// The backend's own origin (no /api suffix) — for linking directly to
// static files it serves, like /uploads/... order attachments.
export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  // A caller can pass its own Authorization header (e.g. the Super Admin
  // impersonation banner authenticating as the stashed admin, not whatever
  // token is currently active in localStorage) — only fall back to the
  // stored token when the caller hasn't already set one.
  if (!config.headers.Authorization) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined") {
      const code = err?.response?.data?.error;
      if (code === "TRIAL_EXPIRED" || code === "SUBSCRIPTION_EXPIRED" || code === "NO_SUBSCRIPTION") {
        window.location.href = "/plans";
      } else if (code === "FEATURE_NOT_IN_PLAN") {
        window.location.href = "/plans?upgrade=1";
      } else if (code === "ACCOUNT_BLOCKED" || code === "TENANT_SUSPENDED") {
        const impersonating = localStorage.getItem("crm_impersonating");
        if (impersonating) {
          // Impersonating a tenant that turns out to be suspended/blocked —
          // snap back to the admin's own session instead of logging the
          // admin out of the whole app over someone else's account state.
          try {
            const stash = JSON.parse(impersonating);
            localStorage.setItem("crm_token", stash.adminToken);
            localStorage.setItem("crm_user", stash.adminUser);
          } catch {}
          localStorage.removeItem("crm_impersonating");
          window.location.href = "/superadmin";
        } else {
          localStorage.removeItem("crm_token");
          localStorage.removeItem("crm_user");
          // ?reason=suspended so the login page can show a clear message
          // immediately instead of a silent redirect to a blank form — the
          // person only otherwise finds out why if they try logging back
          // in, which /auth/login already messages, just not proactively.
          window.location.href = "/login?reason=suspended";
        }
      } else if (err?.response?.status === 401) {
        localStorage.removeItem("crm_token");
        localStorage.removeItem("crm_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// Pages read the logged-in user's permissions from localStorage (set once at
// login) so permission checks work without a network round-trip. But that
// means an admin changing an employee's permissions never reaches that
// employee's browser until they log out and back in — call this to pull the
// latest permissions from the server and refresh the cached copy instead.
export async function refreshUser() {
  try {
    const { data } = await api.get("/auth/me");
    if (data?.user) {
      localStorage.setItem("crm_user", JSON.stringify(data.user));
      return data.user;
    }
  } catch {
    // offline or token invalid — fall back to whatever's already cached
  }
  const cached = typeof window !== "undefined" ? localStorage.getItem("crm_user") : null;
  return cached ? JSON.parse(cached) : null;
}

// ✅ SSR-safe currency formatter — exported properly
export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  // Server-side or no window — fall back to ₹
  if (typeof window === "undefined") {
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  try {
    const s = localStorage.getItem("crm_settings");
    const symbol = s ? JSON.parse(s).currency_symbol || "₹" : "₹";
    return `${symbol}${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  } catch {
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
}

export default api;
