"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../lib/api";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLORS = {
  new: { bg: "rgba(91,163,217,0.12)", color: "#5ba3d9", label: "New" },
  contacted: { bg: "rgba(224,160,80,0.12)", color: "#e0a050", label: "Contacted" },
  closed: { bg: "rgba(100,100,100,0.12)", color: "#888", label: "Closed" },
};

export default function ContactRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) { router.push("/login"); return; }
    const u = JSON.parse(user);
    if (u.role !== "superadmin") { router.push("/dashboard"); return; }
    load();
  }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/superadmin/contact-requests");
      setRequests(data);
    } catch { router.push("/login"); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/superadmin/contact-requests/${id}`, { status });
      setRequests((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch { showToast("Failed to update status", "error"); }
    setUpdating(null);
  };

  const logout = () => { localStorage.clear(); router.push("/login"); };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-base)", color: "var(--text-muted)", fontFamily: "var(--font-main)" }}>Loading...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex" }}>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "success" ? "var(--success)" : "var(--danger)", color: "#fff", borderRadius: 10, padding: "12px 20px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>{toast.msg}</div>}

      <aside style={{ width: 220, background: "var(--bg-surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0 }}>
        <div style={{ padding: "20px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 4 }}>⚡ Super Admin</div>
          <div style={{ fontSize: 11, color: "var(--teal)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Zalgo CRM</div>
        </div>
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {[
            { label: "Dashboard", icon: "📊", href: "/superadmin" },
            { label: "All Users", icon: "👥", href: "/superadmin#users" },
            { label: "Plans", icon: "📋", href: "/superadmin/plans" },
            { label: "Contact Requests", icon: "📩", href: "/superadmin/contact-requests", active: true },
          ].map((item) => (
            <Link key={item.label} href={item.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 4, color: item.active ? "var(--teal-light)" : "var(--text-secondary)", background: item.active ? "var(--teal-dim)" : "transparent", fontFamily: "var(--font-main)", fontWeight: item.active ? 600 : 400, fontSize: 13, textDecoration: "none", borderLeft: item.active ? "2px solid var(--teal)" : "2px solid transparent" }}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "14px", borderTop: "1px solid var(--border)" }}>
          <button onClick={logout} style={{ width: "100%", padding: "8px", borderRadius: 7, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 220, flex: 1, padding: "28px 32px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-main)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Contact Requests</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Submissions from the marketing site&apos;s Contact form</p>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          {requests.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>No contact requests yet</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface)" }}>
                    {["#", "Name", "Email", "Phone", "Company", "Message", "Received", "Status"].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-main)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => {
                    const sc = STATUS_COLORS[r.status] || STATUS_COLORS.new;
                    return (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: 12 }}>{i + 1}</td>
                        <td style={{ padding: "12px 14px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{r.name}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{r.email}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{r.phone || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>{r.company || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)", maxWidth: 260, whiteSpace: "pre-wrap" }}>{r.message || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(r.created_at)}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <select
                            value={r.status}
                            disabled={updating === r.id}
                            onChange={(e) => updateStatus(r.id, e.target.value)}
                            style={{ background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "4px 10px", fontFamily: "var(--font-main)", border: "none", cursor: updating === r.id ? "not-allowed" : "pointer" }}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
