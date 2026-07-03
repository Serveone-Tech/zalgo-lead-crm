"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const BASE = "http://localhost:5000/api";

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("crm_token") : "";
  return { Authorization: `Bearer ${token}` };
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [current, setCurrent] = useState(null);
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [toast, setToast] = useState(null);
  const [upgradePrompt, setUpgradePrompt] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    if (typeof window !== "undefined" && window.location.search.includes("upgrade=1")) {
      setUpgradePrompt(true);
    }
    loadAll();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        axios.get(`${BASE}/plans`),
        axios
          .get(`${BASE}/auth/subscription`, { headers: authHeaders() })
          .catch(() => ({ data: null })),
      ]);
      setPlans(plansRes.data);
      setCurrent(subRes.data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (plan) => {
    setSubscribing(plan.id);
    try {
      await axios.post(
        `${BASE}/auth/subscribe`,
        { plan_id: plan.id, billing_cycle: plan.is_free ? "trial" : billing },
        { headers: authHeaders() },
      );
      showToast(
        plan.is_free
          ? `Free trial started! (${plan.trial_days} days)`
          : `Subscribed to ${plan.name}!`,
      );
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      showToast(err.response?.data?.error || "Something went wrong", "error");
    } finally {
      setSubscribing(null);
    }
  };

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-base)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          fontFamily: "var(--font-main)",
        }}
      >
        Loading plans...
      </div>
    );

  const planColors = ["var(--teal)", "var(--blue)", "var(--warn)"];

  const FEATURE_LABELS = {
    customers:   "Customer & Payment Management",
    automation:  "Full Automation (Email + SMS + WhatsApp)",
    bulk_upload: "Bulk Lead Import (CSV)",
    employees:   "Team / Employee Management",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        padding: "40px 20px",
      }}
    >
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background:
              toast.type === "success" ? "var(--success)" : "var(--danger)",
            color: "#fff",
            borderRadius: 10,
            padding: "12px 20px",
            fontFamily: "var(--font-main)",
            fontWeight: 600,
            fontSize: 13,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Upgrade prompt banner */}
        {upgradePrompt && (
          <div style={{
            background: "rgba(230,168,23,0.12)", border: "1px solid var(--warn)",
            borderRadius: 12, padding: "14px 20px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, color: "var(--warn)", fontSize: 13 }}>
                Feature not available in your current plan
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2 }}>
                Upgrade your plan below to unlock this feature.
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          {["Register", "Organisation", "Choose Plan", "Dashboard"].map(
            (s, i) => (
              <div
                key={s}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background:
                        i < 2
                          ? "var(--success)"
                          : i === 2
                            ? "var(--teal)"
                            : "var(--bg-card)",
                      border: `2px solid ${i < 2 ? "var(--success)" : i === 2 ? "var(--teal)" : "var(--border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: i < 3 ? "#fff" : "var(--text-muted)",
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    {i < 2 ? "✓" : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color:
                        i < 2
                          ? "var(--success)"
                          : i === 2
                            ? "var(--teal)"
                            : "var(--text-muted)",
                      fontFamily: "var(--font-main)",
                      fontWeight: i <= 2 ? 600 : 400,
                    }}
                  >
                    {s}
                  </span>
                </div>
                {i < 3 && (
                  <span style={{ color: "var(--border)", fontSize: 16 }}>
                    ›
                  </span>
                )}
              </div>
            ),
          )}
        </div>

        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: "var(--font-main)",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 10,
            }}
          >
            Choose your plan
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Start free, upgrade anytime. No credit card required for trial.
          </p>
        </div>

        {/* Current subscription banner */}
        {current && (
          <div
            style={{
              background: "rgba(0,134,138,0.08)",
              border: "1px solid rgba(0,134,138,0.25)",
              borderRadius: 10,
              padding: "12px 20px",
              marginBottom: 28,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 18 }}>📋</span>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-main)",
                  fontWeight: 700,
                  color: "var(--teal-light)",
                  fontSize: 14,
                }}
              >
                Current Plan: {current.plan_name}
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 11,
                    background:
                      current.status === "active"
                        ? "rgba(82,184,138,0.15)"
                        : "rgba(91,163,217,0.15)",
                    color:
                      current.status === "active"
                        ? "var(--success)"
                        : "var(--blue)",
                    borderRadius: 20,
                    padding: "2px 8px",
                  }}
                >
                  {current.status}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {current.status === "trial"
                  ? `Trial ends ${fmtDate(current.trial_ends_at)}`
                  : `Expires ${fmtDate(current.ends_at)}`}
              </div>
            </div>
          </div>
        )}

        {/* Billing toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 4,
              display: "flex",
              gap: 4,
            }}
          >
            {["monthly", "yearly"].map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: "8px 24px",
                  borderRadius: 7,
                  cursor: "pointer",
                  fontFamily: "var(--font-main)",
                  fontWeight: 600,
                  fontSize: 13,
                  border: "none",
                  background: billing === b ? "var(--teal)" : "transparent",
                  color: billing === b ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
              >
                {b === "monthly" ? "Monthly" : "Yearly"}
                {b === "yearly" && (
                  <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.8 }}>
                    Save 17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`,
            gap: 20,
          }}
        >
          {plans.map((plan, i) => {
            const isCurrentPlan = current?.plan_id === plan.id;
            const price =
              billing === "yearly" && !plan.is_free
                ? plan.price_yearly
                : plan.price_monthly;
            const accentColor = planColors[i % planColors.length];
            const features = Array.isArray(plan.features)
              ? plan.features
              : JSON.parse(plan.features || "[]");

            return (
              <div
                key={plan.id}
                style={{
                  background: "var(--bg-card)",
                  border: `2px solid ${isCurrentPlan ? "var(--teal)" : "var(--border)"}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ height: 4, background: accentColor }} />

                {isCurrentPlan && (
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      background: "var(--teal)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    Current
                  </div>
                )}

                <div style={{ padding: "24px 22px", flex: 1 }}>
                  <div style={{ fontSize: 22, marginBottom: 10 }}>
                    {i === 0 ? "🆓" : i === 1 ? "⚡" : "🚀"}
                  </div>
                  <h2
                    style={{
                      fontFamily: "var(--font-main)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: 6,
                    }}
                  >
                    {plan.name}
                  </h2>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      marginBottom: 20,
                      lineHeight: 1.5,
                    }}
                  >
                    {plan.description}
                  </p>

                  <div style={{ marginBottom: 20 }}>
                    {plan.is_free ? (
                      <div>
                        <span
                          style={{
                            fontFamily: "var(--font-main)",
                            fontSize: 32,
                            fontWeight: 700,
                            color: accentColor,
                          }}
                        >
                          Free
                        </span>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            marginTop: 4,
                          }}
                        >
                          {plan.trial_days} days trial
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span
                          style={{
                            fontFamily: "var(--font-main)",
                            fontSize: 11,
                            color: "var(--text-muted)",
                            verticalAlign: "top",
                            lineHeight: "36px",
                          }}
                        >
                          ₹
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-main)",
                            fontSize: 32,
                            fontWeight: 700,
                            color: accentColor,
                          }}
                        >
                          {Number(price).toLocaleString()}
                        </span>
                        <span
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          /{billing === "yearly" ? "yr" : "mo"}
                        </span>
                      </div>
                    )}
                  </div>

                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      marginBottom: 24,
                    }}
                  >
                    {/* Limits */}
                    {[
                      plan.max_leads > 0 ? `Up to ${plan.max_leads} Leads` : "Unlimited Leads",
                      plan.max_customers > 0 ? `Up to ${plan.max_customers} Customers` : plan.max_customers === 0 ? null : "Unlimited Customers",
                    ].filter(Boolean).map((label, li) => (
                      <li key={`limit-${li}`} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                        <span style={{ color: accentColor, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                        {label}
                      </li>
                    ))}
                    {/* Feature keys */}
                    {features.map((f, fi) => (
                      <li
                        key={fi}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          marginBottom: 8,
                          fontSize: 12,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span
                          style={{
                            color: accentColor,
                            fontWeight: 700,
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          ✓
                        </span>
                        {FEATURE_LABELS[f] || f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: "0 22px 22px" }}>
                  <button
                    onClick={() => subscribe(plan)}
                    disabled={subscribing === plan.id || isCurrentPlan}
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: 9,
                      border: "none",
                      fontFamily: "var(--font-main)",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor:
                        subscribing === plan.id || isCurrentPlan
                          ? "not-allowed"
                          : "pointer",
                      background: isCurrentPlan
                        ? "var(--bg-surface)"
                        : accentColor,
                      color: isCurrentPlan ? "var(--text-muted)" : "#fff",
                      opacity: subscribing === plan.id ? 0.7 : 1,
                    }}
                  >
                    {subscribing === plan.id
                      ? "Processing..."
                      : isCurrentPlan
                        ? "Current Plan"
                        : plan.is_free
                          ? `Start ${plan.trial_days}-Day Free Trial`
                          : "Subscribe Now"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {current && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <a
              href="/dashboard"
              style={{
                color: "var(--teal)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              ← Go back to Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
