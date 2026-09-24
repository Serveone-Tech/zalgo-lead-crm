"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import SuperAdminShell from "../SuperAdminShell";

function fmtMoney(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
function fmtPct(n) {
  return n == null ? "—" : `${n.toFixed(1)}%`;
}
function fmtDay(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const STATUS_LABELS = {
  trialing: "Trial",
  active: "Active",
  past_due: "Payment Issue",
  canceled: "Cancelled",
  expired: "Expired",
};

function Card({ title, subtitle, children }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ fontFamily: "var(--font-main)", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: subtitle ? 2 : 14 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) { router.push("/login"); return; }
    if (JSON.parse(user).role !== "superadmin") { router.push("/dashboard"); return; }
  }, []);

  useEffect(() => {
    load();
  }, [days]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/superadmin/analytics", { params: { days } });
      setData(data);
    } catch {} finally { setLoading(false); }
  };

  const plans = [...new Set((data?.subscribers || []).map((s) => s.plan_name))];
  const statuses = ["trialing", "active", "past_due", "canceled", "expired"];
  const countFor = (plan, status) => data?.subscribers.find((s) => s.plan_name === plan && s.status === status)?.count || 0;

  const maxSignups = Math.max(1, ...((data?.signups || []).map((s) => s.count)));

  return (
    <SuperAdminShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-main)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Analytics</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            MRR and the subscriber breakdown are always current — everything else below uses the same {days}-day window.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 12,
                border: `1px solid ${days === d ? "var(--teal)" : "var(--border)"}`,
                background: days === d ? "var(--teal-dim)" : "transparent",
                color: days === d ? "var(--teal-light)" : "var(--text-secondary)",
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
          {/* MRR */}
          <Card title="Monthly Recurring Revenue" subtitle="Active + payment-issue subscriptions, at each plan's current list price — right now">
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-main)", color: "var(--teal-light)", marginBottom: 16 }}>{fmtMoney(data.mrr.total)}</div>
            {data.mrr.by_plan.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No paying subscribers yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Plan", "Subscribers", "MRR"].map((h) => (
                      <th key={h} style={{ textAlign: h === "Plan" ? "left" : "right", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.mrr.by_plan.map((p) => (
                    <tr key={p.plan_name}>
                      <td style={{ padding: "8px 0", fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{p.plan_name}</td>
                      <td style={{ padding: "8px 0", fontSize: 13, color: "var(--text-secondary)", textAlign: "right" }}>{p.subscriber_count}</td>
                      <td style={{ padding: "8px 0", fontSize: 13, color: "var(--teal-light)", fontWeight: 700, textAlign: "right" }}>{fmtMoney(p.mrr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Subscriber breakdown */}
          <Card title="Subscribers by Plan & Status" subtitle="Current snapshot">
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 10px 6px 0", borderBottom: "1px solid var(--border)" }}>Plan</th>
                    {statuses.map((s) => (
                      <th key={s} style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 10px", borderBottom: "1px solid var(--border)" }}>{STATUS_LABELS[s]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan}>
                      <td style={{ padding: "8px 0", fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{plan}</td>
                      {statuses.map((s) => (
                        <td key={s} style={{ padding: "8px 10px", fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>{countFor(plan, s) || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Conversion + Churn side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Card title="Trial → Paid Conversion" subtitle={`Trials started in the last ${days} days`}>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-main)", color: data.conversion.rate == null ? "var(--text-muted)" : "var(--success)", marginBottom: 6 }}>
                {fmtPct(data.conversion.rate)}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {data.conversion.converted_count} of {data.conversion.trial_count} trial{data.conversion.trial_count !== 1 ? "s" : ""} converted to a paid subscription
              </div>
            </Card>
            <Card title="Churn Rate" subtitle={`Subscribers active at the start of the ${days}-day window`}>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--font-main)", color: data.churn.rate == null ? "var(--text-muted)" : "var(--danger)", marginBottom: 6 }}>
                {fmtPct(data.churn.rate)}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {data.churn.churned_count} of {data.churn.base_count} subscriber{data.churn.base_count !== 1 ? "s" : ""} cancelled or expired
              </div>
            </Card>
          </div>

          {/* Signups */}
          <Card title="New Signups" subtitle={`Last ${days} days, by day`}>
            {(!data.signups || data.signups.length === 0) ? (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No signups in this window.</div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 140, overflowX: "auto", paddingBottom: 4 }}>
                {data.signups.map((s) => (
                  <div key={s.day} title={`${fmtDay(s.day)}: ${s.count}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 22 }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>{s.count}</div>
                    <div style={{ width: 14, height: Math.max(4, (s.count / maxSignups) * 90), background: "var(--teal)", borderRadius: "3px 3px 0 0" }} />
                    <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4, whiteSpace: "nowrap" }}>{fmtDay(s.day)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </SuperAdminShell>
  );
}
