"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { AlertTriangle, Bell, CheckCircle2, ChevronRight } from "lucide-react";

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isOverdue(d) {
  return d && d.split("T")[0] < today();
}
function isToday(d) {
  return d && d.split("T")[0] === today();
}
function fmtDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("T")[0].split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${day} ${months[parseInt(m) - 1]} ${y}`;
}
function timeAgo(d) {
  if (!d) return "";
  const diff = Math.floor((new Date() - new Date(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [loading, setLoad] = useState(true);
  const [filter, setFilter] = useState("all");
  const [highlightId, setHighlightId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const leadParam = params.get("lead");
    if (leadParam) setHighlightId(leadParam);
    load(leadParam);
  }, []);

  const load = async (leadParam) => {
    setLoad(true);
    try {
      const { data } = await api.get("/leads");
      setLeads(data);
      if (leadParam) {
        setTimeout(() => {
          const el = document.getElementById(`notif-${leadParam}`);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      }
    } catch {
      router.push("/login");
    } finally {
      setLoad(false);
    }
  };

  const todayList = leads.filter((l) => isToday(l.follow_up_date));
  const overdueList = leads.filter(
    (l) => isOverdue(l.follow_up_date) && l.stage !== "Closed",
  );

  const allNotifs = [
    ...overdueList.map((l) => ({ ...l, type: "overdue" })),
    ...todayList.map((l) => ({ ...l, type: "today" })),
  ];

  const shown =
    filter === "all"
      ? allNotifs
      : filter === "overdue"
        ? allNotifs.filter((n) => n.type === "overdue")
        : allNotifs.filter((n) => n.type === "today");

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-main)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            🔔 Notifications
            {allNotifs.length > 0 && (
              <span
                style={{
                  background: "var(--danger)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 20,
                  padding: "2px 8px",
                  fontFamily: "var(--font-main)",
                }}
              >
                {allNotifs.length}
              </span>
            )}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Follow-up reminders and overdue alerts
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { key: "all", label: `All`, count: allNotifs.length },
          { key: "overdue", label: `Overdue`, count: overdueList.length },
          { key: "today", label: `Today`, count: todayList.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-main)",
              border: "1px solid",
              borderColor: filter === tab.key ? "var(--teal)" : "var(--border)",
              background:
                filter === tab.key ? "var(--teal-dim)" : "var(--bg-card)",
              color:
                filter === tab.key
                  ? "var(--teal-light)"
                  : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                style={{
                  background:
                    filter === tab.key
                      ? "var(--teal)"
                      : tab.key === "overdue"
                        ? "var(--danger-dim)"
                        : "var(--warn-dim)",
                  color:
                    filter === tab.key
                      ? "#fff"
                      : tab.key === "overdue"
                        ? "var(--danger)"
                        : "var(--warn)",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 20,
                  padding: "1px 7px",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: "var(--text-muted)",
          }}
        >
          Loading...
        </div>
      ) : shown.length === 0 ? (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: 12, color: "var(--success)", display: "flex", justifyContent: "center" }}><CheckCircle2 size={40} /></div>
          <div
            style={{
              fontFamily: "var(--font-main)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-secondary)",
              marginBottom: 6,
            }}
          >
            All clear!
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            No pending notifications right now.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shown.map((lead, i) => {
            const isOvr = lead.type === "overdue";
            const accent = isOvr ? "var(--danger)" : "var(--warn)";
            const accentDim = isOvr ? "var(--danger-dim)" : "var(--warn-dim)";
            const daysDiff = lead.follow_up_date
              ? Math.floor(
                  (new Date() - new Date(lead.follow_up_date.split("T")[0])) /
                    86400000,
                )
              : 0;
            return (
              <div
                key={`${lead.id}-${lead.type}`}
                id={`notif-${lead.id}`}
                style={{
                  background: String(lead.id) === highlightId ? "var(--teal-dim)" : "var(--bg-card)",
                  border: `1px solid ${String(lead.id) === highlightId ? "var(--teal)" : "var(--border)"}`,
                  borderLeft: `3px solid ${String(lead.id) === highlightId ? "var(--teal)" : accent}`,
                  borderRadius: 10,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  transition: "background 0.15s, border-color 0.15s",
                  cursor: "pointer",
                  scrollMarginTop: 80,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = String(lead.id) === highlightId ? "var(--teal-dim)" : "var(--bg-card)")
                }
                onClick={() => router.push("/leads")}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: accentDim,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: accent,
                  }}
                >
                  {isOvr ? <AlertTriangle size={20} /> : <Bell size={20} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-main)",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--text-primary)",
                      }}
                    >
                      {lead.name}
                    </span>
                    <span
                      style={{
                        background: accentDim,
                        color: accent,
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 20,
                        padding: "2px 8px",
                        fontFamily: "var(--font-main)",
                      }}
                    >
                      {isOvr
                        ? `Overdue by ${daysDiff} day${daysDiff !== 1 ? "s" : ""}`
                        : "Follow-up Today"}
                    </span>
                    <span
                      style={{
                        background: "rgba(91,163,217,0.13)",
                        color: "var(--blue)",
                        fontSize: 10,
                        fontWeight: 600,
                        borderRadius: 5,
                        padding: "2px 7px",
                      }}
                    >
                      {lead.platform}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginBottom: 6,
                    }}
                  >
                    {isOvr
                      ? `Follow-up was scheduled for ${fmtDate(lead.follow_up_date)} — needs immediate attention`
                      : `Scheduled follow-up for today — ${fmtDate(lead.follow_up_date)}`}
                  </div>

                  {lead.last_message && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        background: "var(--bg-surface)",
                        borderRadius: 6,
                        padding: "6px 10px",
                        marginBottom: 6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      💬 &quot;{lead.last_message}&quot;
                    </div>
                  )}

                  {lead.notes && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      📝 {lead.notes}
                    </div>
                  )}
                </div>

                {/* Stage badge + arrow */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontFamily: "var(--font-main)",
                      background:
                        lead.stage === "Active"
                          ? "rgba(0,168,173,0.13)"
                          : lead.stage === "New"
                            ? "rgba(82,184,138,0.12)"
                            : lead.stage === "Follow-up"
                              ? "rgba(224,160,80,0.13)"
                              : lead.stage === "Booked"
                                ? "rgba(91,163,217,0.13)"
                                : "rgba(100,100,100,0.13)",
                      color:
                        lead.stage === "Active"
                          ? "#00a8ad"
                          : lead.stage === "New"
                            ? "#52b88a"
                            : lead.stage === "Follow-up"
                              ? "#e0a050"
                              : lead.stage === "Booked"
                                ? "#5ba3d9"
                                : "#888",
                    }}
                  >
                    {lead.stage}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shown.length > 0 && (
        <div
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          Click any notification to go to Leads page and update the status
        </div>
      )}
    </div>
  );
}
