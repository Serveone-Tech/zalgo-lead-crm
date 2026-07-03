import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("crm_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
      } else if (err?.response?.status === 401) {
        localStorage.removeItem("crm_token");
        localStorage.removeItem("crm_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

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
