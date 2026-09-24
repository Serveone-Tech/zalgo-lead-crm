"use client";
import { useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import SuperAdminShell from "../SuperAdminShell";
import { PERMISSION_KEYS } from "../../../lib/permissions";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CrossTenantEmployeeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) { router.push("/login"); return; }
    if (JSON.parse(user).role !== "superadmin") { router.push("/dashboard"); return; }
  }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const search = async (e) => {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get("/superadmin/employees/search", { params: { q: query } });
      setResults(data);
    } catch (err) { showToast(err.response?.data?.error || "Search failed", "error"); }
    setLoading(false);
  };

  const toggleBlock = async (emp) => {
    const blocking = !emp.is_blocked;
    const msg = blocking
      ? `This will immediately log ${emp.name} out and prevent them logging back in — nothing else about their account changes, and this does NOT affect ${emp.tenant_name}'s own seat count or any other employee.`
      : `This will restore ${emp.name}'s access to log in again.`;
    if (!confirm(msg)) return;
    setToggling(emp.id);
    try {
      const { data } = await api.put(`/superadmin/users/${emp.tenant_id}/employees/${emp.id}/block`, { blocked: blocking });
      setResults((rows) => rows.map((r) => (r.id === emp.id ? { ...r, is_blocked: data.is_blocked } : r)));
      showToast(blocking ? "Employee deactivated" : "Employee reactivated");
    } catch (err) { showToast(err.response?.data?.error || "Failed", "error"); }
    setToggling(null);
  };

  const grantedPerms = (permissions) => PERMISSION_KEYS.filter((p) => permissions?.[p.key]);

  return (
    <SuperAdminShell>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "success" ? "var(--success)" : "var(--danger)", color: "#fff", borderRadius: 10, padding: "12px 20px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>{toast.msg}</div>}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-main)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Employee Search</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Find any employee by name or email across every tenant — for support requests or abuse reports that name a
          person, not a company.
        </p>
      </div>

      <form onSubmit={search} style={{ display: "flex", gap: 10, marginBottom: 24, maxWidth: 480 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Search employee name or email..."
          style={{ flex: 1, padding: "10px 14px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none" }}
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          style={{ padding: "10px 20px", borderRadius: 8, background: "var(--teal)", border: "none", color: "#fff", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {searched && !loading && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          {results.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>No employees match "{q}".</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface)" }}>
                    {["Name", "Email", "Tenant", "Role", "Status", "Added", "Permissions", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-main)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((emp) => {
                    const perms = grantedPerms(emp.permissions);
                    return (
                      <Fragment key={emp.id}>
                        <tr style={{ borderBottom: expanded === emp.id ? "none" : "1px solid var(--border)" }}>
                          <td style={{ padding: "12px 14px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{emp.name}</td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{emp.email}</td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{emp.tenant_name}<div style={{ fontSize: 10, color: "var(--text-muted)" }}>{emp.tenant_email}</div></td>
                          <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{emp.role_label || "—"}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ background: emp.is_blocked ? "rgba(224,82,82,0.12)" : "rgba(82,184,138,0.12)", color: emp.is_blocked ? "var(--danger)" : "var(--success)", fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "3px 10px", fontFamily: "var(--font-main)" }}>
                              {emp.is_blocked ? "Deactivated" : "Active"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(emp.created_at)}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <button
                              onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}
                              style={{ padding: "4px 10px", borderRadius: 6, background: "transparent", border: "1px solid var(--border)", color: "var(--teal)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-main)" }}
                            >
                              {perms.length} granted {expanded === emp.id ? "▲" : "▼"}
                            </button>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <button
                              onClick={() => toggleBlock(emp)}
                              disabled={toggling === emp.id}
                              style={{ padding: "5px 10px", borderRadius: 6, background: "transparent", border: `1px solid ${emp.is_blocked ? "var(--success)" : "var(--warn)"}`, color: emp.is_blocked ? "var(--success)" : "var(--warn)", fontSize: 11, cursor: toggling === emp.id ? "not-allowed" : "pointer", fontWeight: 600, fontFamily: "var(--font-main)" }}
                            >
                              {toggling === emp.id ? "…" : emp.is_blocked ? "Reactivate" : "Deactivate"}
                            </button>
                          </td>
                        </tr>
                        {expanded === emp.id && (
                          <tr style={{ borderBottom: "1px solid var(--border)" }}>
                            <td colSpan={8} style={{ padding: "0 14px 14px", background: "var(--bg-surface)" }}>
                              {perms.length === 0 ? (
                                <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "10px 0" }}>No permissions granted — read-only access only.</div>
                              ) : (
                                <ul style={{ margin: "8px 0 0", padding: "0 0 0 18px", fontSize: 12, color: "var(--text-secondary)" }}>
                                  {perms.map((p) => <li key={p.key} style={{ marginBottom: 4 }}>{p.label}</li>)}
                                </ul>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </SuperAdminShell>
  );
}
