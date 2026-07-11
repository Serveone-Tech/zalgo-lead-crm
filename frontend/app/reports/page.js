"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { isOwnerUser, hasPerm } from "../../lib/permissions";

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [stageCounts, setStageCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmp, setSelectedEmp] = useState(null); // id or null for unassigned

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    const u = localStorage.getItem("crm_user");
    if (u) setUser(JSON.parse(u));
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/leads/report/by-employee");
      setEmployees(data.employees || []);
      setStageCounts(data.stage_counts || []);
    } catch (e) {
      if (e?.response?.status === 403) {
        setError("You do not have permission to view this report.");
      } else {
        setError("Failed to load report. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Build per-employee stats from stage_counts
  const empStats = useMemo(() => {
    const map = {};

    // Initialize all employees
    for (const e of employees) {
      map[e.id] = { ...e, total: 0, overdue: 0, stages: {} };
    }
    // Unassigned bucket
    map["__unassigned__"] = { id: null, name: "Unassigned", role_label: "", total: 0, overdue: 0, stages: {} };

    for (const row of stageCounts) {
      const key = row.assigned_to == null ? "__unassigned__" : row.assigned_to;
      if (!map[key]) continue;
      const cnt = parseInt(row.cnt);
      const ovd = parseInt(row.overdue);
      map[key].total += cnt;
      map[key].overdue += ovd;
      map[key].stages[row.stage] = (map[key].stages[row.stage] || 0) + cnt;
    }

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [employees, stageCounts]);

  // All unique stages
  const allStages = useMemo(() => {
    const s = new Set();
    for (const row of stageCounts) s.add(row.stage);
    return Array.from(s);
  }, [stageCounts]);

  const totalLeads = empStats.reduce((s, e) => s + e.total, 0);
  const totalOverdue = empStats.reduce((s, e) => s + e.overdue, 0);
  const assignedLeads = empStats
    .filter((e) => e.id !== null)
    .reduce((s, e) => s + e.total, 0);
  const unassignedLeads = empStats.find((e) => e.id === null)?.total || 0;

  const STAGE_COLORS_MAP = {
    New: { bg: "rgba(91,163,217,0.15)", color: "#5ba3d9" },
    Active: { bg: "rgba(0,200,154,0.15)", color: "#00c89a" },
    Booked: { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6" },
    Converted: { bg: "rgba(0,134,138,0.15)", color: "#00868a" },
    Closed: { bg: "rgba(120,120,140,0.15)", color: "#78788c" },
  };

  const stageColor = (stage) =>
    STAGE_COLORS_MAP[stage] || { bg: "rgba(160,160,180,0.15)", color: "#a0a0b4" };

  const viewLeads = (empId) => {
    if (empId === null) {
      router.push("/leads?assignee=__unassigned__");
    } else {
      router.push(`/leads?assignee=${empId}`);
    }
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-main)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
            Team Lead Report
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            See how leads are distributed across your team members.
          </p>
        </div>
        <button
          onClick={load}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "9px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontFamily: "var(--font-main)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 64, textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-main)" }}>
          Loading report…
        </div>
      ) : error ? (
        <div style={{
          padding: "20px 24px",
          background: "rgba(224,82,82,0.08)",
          border: "1px solid rgba(224,82,82,0.3)",
          borderRadius: "var(--radius-md)",
          color: "var(--danger)",
          fontFamily: "var(--font-main)",
          fontSize: 14,
        }}>
          {error}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Total Leads", value: totalLeads, color: "var(--teal)", dim: "var(--teal-dim)" },
              { label: "Assigned", value: assignedLeads, color: "var(--blue)", dim: "rgba(91,163,217,0.1)" },
              { label: "Unassigned", value: unassignedLeads, color: "var(--warn)", dim: "var(--warn-dim)" },
              { label: "Overdue", value: totalOverdue, color: "var(--danger)", dim: "var(--danger-dim)" },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  background: c.dim,
                  border: `1px solid ${c.color}33`,
                  borderRadius: "var(--radius-md)",
                  padding: "20px 24px",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-main)", marginBottom: 8 }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: c.color, fontFamily: "var(--font-main)" }}>
                  {c.value}
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}>
            {empStats.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-main)" }}>
                No employees found. Add team members from the Team page first.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: "var(--bg-surface)" }}>
                      {["Team Member", "Role", "Total", "Overdue", "Stage Breakdown", ""].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "12px 18px",
                            textAlign: "left",
                            fontSize: 11,
                            color: "var(--text-muted)",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            borderBottom: "1px solid var(--border)",
                            fontFamily: "var(--font-main)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {empStats.map((emp) => (
                      <tr
                        key={emp.id ?? "__unassigned__"}
                        style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Name */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: emp.id === null ? "var(--bg-surface)" : "var(--gradient-accent)",
                              border: emp.id === null ? "1px dashed var(--border)" : "none",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                              fontFamily: "var(--font-main)",
                            }}>
                              {emp.id === null ? "—" : emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: emp.id === null ? "var(--text-muted)" : "var(--text-primary)" }}>
                                {emp.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-main)" }}>
                            {emp.role_label || (emp.id === null ? "Not assigned" : "Employee")}
                          </span>
                        </td>

                        {/* Total */}
                        <td style={{ padding: "14px 18px" }}>
                          <span style={{
                            fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 18,
                            color: emp.total === 0 ? "var(--text-muted)" : "var(--text-primary)",
                          }}>
                            {emp.total}
                          </span>
                          {totalLeads > 0 && emp.total > 0 && (
                            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>
                              {Math.round((emp.total / totalLeads) * 100)}%
                            </span>
                          )}
                        </td>

                        {/* Overdue */}
                        <td style={{ padding: "14px 18px" }}>
                          {emp.overdue > 0 ? (
                            <span style={{
                              fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 14,
                              color: "var(--danger)",
                              background: "var(--danger-dim)",
                              borderRadius: 6,
                              padding: "3px 10px",
                            }}>
                              ⚠ {emp.overdue}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                          )}
                        </td>

                        {/* Stage breakdown */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {Object.entries(emp.stages).length === 0 ? (
                              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>No leads</span>
                            ) : (
                              Object.entries(emp.stages)
                                .sort((a, b) => b[1] - a[1])
                                .map(([stage, cnt]) => {
                                  const sc = stageColor(stage);
                                  return (
                                    <span
                                      key={stage}
                                      style={{
                                        background: sc.bg,
                                        color: sc.color,
                                        borderRadius: 20,
                                        padding: "3px 10px",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        fontFamily: "var(--font-main)",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {stage}: {cnt}
                                    </span>
                                  );
                                })
                            )}
                          </div>
                        </td>

                        {/* View leads button */}
                        <td style={{ padding: "14px 18px" }}>
                          {emp.total > 0 && (
                            <button
                              onClick={() => viewLeads(emp.id)}
                              style={{
                                background: "transparent",
                                border: "1px solid var(--teal)",
                                borderRadius: 7,
                                padding: "6px 14px",
                                color: "var(--teal-light)",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "var(--font-main)",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--teal-dim)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              View Leads →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bar chart — visual lead distribution */}
          {empStats.some((e) => e.total > 0) && (
            <div style={{
              marginTop: 24,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "20px 24px",
              boxShadow: "var(--shadow-sm)",
            }}>
              <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 18 }}>
                Lead Distribution
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {empStats
                  .filter((e) => e.total > 0)
                  .map((emp) => {
                    const pct = totalLeads > 0 ? (emp.total / totalLeads) * 100 : 0;
                    return (
                      <div key={emp.id ?? "__unassigned__"} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 120, fontSize: 12, fontFamily: "var(--font-main)",
                          color: "var(--text-secondary)", textAlign: "right",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          {emp.name}
                        </div>
                        <div style={{ flex: 1, background: "var(--bg-surface)", borderRadius: 20, height: 10, overflow: "hidden" }}>
                          <div style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: emp.id === null ? "var(--warn)" : "var(--gradient-accent)",
                            borderRadius: 20,
                            transition: "width 0.6s ease",
                          }} />
                        </div>
                        <div style={{
                          width: 60, fontSize: 12, fontFamily: "var(--font-main)",
                          fontWeight: 700, color: "var(--text-primary)", flexShrink: 0,
                        }}>
                          {emp.total} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({Math.round(pct)}%)</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
