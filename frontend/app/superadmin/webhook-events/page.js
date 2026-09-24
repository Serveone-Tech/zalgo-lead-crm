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

const STATUS_COLORS = {
  processed: { bg: "rgba(82,184,138,0.12)", color: "#52b88a", label: "Processed" },
  received: { bg: "rgba(91,163,217,0.12)", color: "#5ba3d9", label: "Received" },
  failed: { bg: "rgba(224,82,82,0.12)", color: "#e05252", label: "Failed" },
};

export default function WebhookEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
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
      const { data } = await api.get("/superadmin/webhook-events");
      setEvents(data);
    } catch {} finally { setLoading(false); }
  };

  const eventTypes = useMemo(() => [...new Set(events.map((e) => e.event_type).filter(Boolean))], [events]);

  const filtered = events.filter((e) => {
    const matchStatus = !filterStatus || e.status === filterStatus;
    const matchType = !filterType || e.event_type === filterType;
    return matchStatus && matchType;
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => { setPage(1); }, [filterStatus, filterType]);
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  // A row still sitting at 'received' more than ~10 minutes after arriving
  // never finished processing (most likely a server crash/restart between
  // the claim and the status update — see the comment at the claim in
  // routes/webhooks.js) — Razorpay itself has already given up retrying it
  // by this point (it treats our 200-OK receipt as delivered), so nothing
  // else is coming. Flagging it here is the only place this becomes visible.
  const isStuck = (e) => e.status === "received" && Date.now() - new Date(e.processed_at).getTime() > 10 * 60 * 1000;
  const failedCount = events.filter((e) => e.status === "failed").length;
  const stuckCount = events.filter(isStuck).length;

  return (
    <SuperAdminShell>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-main)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Webhook Events</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Every Razorpay webhook received — the last 200 events, newest first.
          {failedCount > 0 && (
            <span style={{ color: "var(--danger)", fontWeight: 700 }}> {failedCount} failed — review below.</span>
          )}
          {stuckCount > 0 && (
            <span style={{ color: "var(--warn)", fontWeight: 700 }}> {stuckCount} stuck mid-processing — never completed, nothing will retry them automatically.</span>
          )}
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="">All Status</option>
          {Object.entries(STATUS_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: "8px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}>
          <option value="">All Event Types</option>
          {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
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
              {events.length === 0 ? "No webhook events received yet." : "No events match this filter."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface)" }}>
                    {["Event Type", "Status", "Tenant", "Received", "Error"].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-main)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((e) => {
                    const stuck = isStuck(e);
                    const sc = stuck
                      ? { bg: "rgba(230,168,23,0.15)", color: "#e6a817", label: "Stuck" }
                      : STATUS_COLORS[e.status] || { bg: "rgba(100,100,100,0.12)", color: "#888", label: e.status || "—" };
                    return (
                      <tr key={e.event_id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 12.5, color: "var(--text-primary)" }}>{e.event_type || "—"}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            title={stuck ? "Never finished processing — a retry from Razorpay will be silently skipped as a duplicate. No automatic recovery; see the tenant's Manage Subscription modal to manually reconcile if needed." : undefined}
                            style={{ background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "3px 10px", fontFamily: "var(--font-main)" }}
                          >
                            {stuck ? "⚠ " : ""}{sc.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{e.tenant_name || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(e.processed_at)}</td>
                        <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--danger)", maxWidth: 320, whiteSpace: "pre-wrap" }}>{e.error_message || "—"}</td>
                      </tr>
                    );
                  })}
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
