"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import SuperAdminShell from "../SuperAdminShell";
import Pagination from "../../../components/Pagination";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TYPE_LABELS = {
  password_reset_otp: "Password Reset OTP",
  register_otp: "Registration OTP",
  trial_started: "Trial Started",
  plan_activated: "Plan Activated",
  addon_purchased: "Seat Add-on Purchased",
  plan_extended: "Plan Extended",
  expiry_reminder: "Expiry Reminder",
  plan_expired: "Plan Expired",
  plan_cancelled: "Plan Cancelled",
  payment_failed: "Payment Failed",
  migration_notice: "Migration Notice",
  contact_notification: "Contact Notification",
  contact_autoreply: "Contact Auto-reply",
};

export default function EmailLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) { router.push("/login"); return; }
    if (JSON.parse(user).role !== "superadmin") { router.push("/dashboard"); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/superadmin/email-log");
      setLogs(data);
    } catch {} finally { setLoading(false); }
  };

  const emailTypes = useMemo(() => [...new Set(logs.map((l) => l.email_type).filter(Boolean))], [logs]);

  const filtered = logs.filter((l) => {
    const matchStatus = !filterStatus || l.status === filterStatus;
    const matchType = !filterType || l.email_type === filterType;
    return matchStatus && matchType;
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => { setPage(1); }, [filterStatus, filterType]);
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  const failedCount = logs.filter((l) => l.status === "failed").length;

  return (
    <SuperAdminShell>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-main)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Email Log</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Every platform/system email — billing, OTPs, contact-form notifications — sent through the shared LeadLo
          account. Last 200 sends, newest first. Tenant automation email (sent through each tenant's own SMTP) isn't
          included here — that's their own business communication.
          {failedCount > 0 && (
            <span style={{ color: "var(--danger)", fontWeight: 700 }}> {failedCount} failed to send.</span>
          )}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="">All Status</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: "8px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="">All Types</option>
          {emailTypes.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
        </select>
        <button
          onClick={load}
          style={{ padding: "8px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: 7, color: "var(--teal)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-main)" }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
      ) : (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
              {logs.length === 0 ? "No system emails sent yet." : "No entries match this filter."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface)" }}>
                    {["Recipient", "Type", "Status", "Sent", "Error"].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-main)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{l.recipient}</td>
                      <td style={{ padding: "12px 14px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 12.5, color: "var(--text-primary)" }}>{TYPE_LABELS[l.email_type] || l.email_type}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: l.status === "sent" ? "rgba(82,184,138,0.12)" : "rgba(224,82,82,0.12)", color: l.status === "sent" ? "var(--success)" : "var(--danger)", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "3px 10px", fontFamily: "var(--font-main)" }}>
                          {l.status === "sent" ? "Sent" : "Failed"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(l.created_at)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--danger)", maxWidth: 320, whiteSpace: "pre-wrap" }}>{l.error_message || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <Pagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} total={filtered.length} />
      )}
    </SuperAdminShell>
  );
}
