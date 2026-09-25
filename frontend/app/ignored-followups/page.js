"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { isOwnerUser } from "../../lib/permissions";
import { EyeOff } from "lucide-react";

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Owner-only audit view of every "Ignore" click on the Sidebar's
// due-follow-up modal — who skipped it, on which lead, why, and when it
// was originally due vs. when it was ignored.
export default function IgnoredFollowUpsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    const u = localStorage.getItem("crm_user");
    const parsed = u ? JSON.parse(u) : null;
    if (parsed && !isOwnerUser(parsed)) {
      router.push("/dashboard");
      return;
    }
    api.get("/employees/list").then((r) => setEmployees(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, dateFrom, dateTo]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/leads/ignored-followups/list", {
        params: { employeeId: employeeId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
      });
      setRows(data);
    } catch (err) {
      if (err?.response?.status === 403) router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...rows].sort((a, b) => {
    let av = a[sortKey] || "";
    let bv = b[sortKey] || "";
    if (sortKey.includes("_at") || sortKey.includes("_time")) {
      av = av ? new Date(av).getTime() : 0;
      bv = bv ? new Date(bv).getTime() : 0;
    } else {
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const Th = ({ label, sortField }) => (
    <th
      onClick={() => toggleSort(sortField)}
      style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-main)", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none" }}
    >
      {label} {sortKey === sortField ? (sortDir === "asc" ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-main)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 10 }}>
          <EyeOff size={22} /> Ignored Follow-ups
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Every time someone clicked "Ignore" on a due follow-up instead of acting on it, with the reason they gave.
          Only visible to you — employees don't see this.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          style={{ padding: "9px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12, outline: "none", cursor: "pointer" }}
        >
          <option value="">All Employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ padding: "9px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12, outline: "none" }}
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{ padding: "9px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12, outline: "none" }}
        />
        {(employeeId || dateFrom || dateTo) && (
          <button
            onClick={() => { setEmployeeId(""); setDateFrom(""); setDateTo(""); }}
            style={{ padding: "9px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-main)" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ marginBottom: 12, color: "var(--teal)", display: "flex", justifyContent: "center" }}><EyeOff size={36} /></div>
            <div style={{ color: "var(--text-secondary)", fontFamily: "var(--font-main)", fontWeight: 600 }}>
              {rows.length === 0 ? "No ignored follow-ups yet" : "No matches for these filters"}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: "var(--bg-surface)" }}>
                  <Th label="Employee" sortField="employee_name" />
                  <Th label="Lead" sortField="lead_name" />
                  <th style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-main)" }}>Reason</th>
                  <Th label="Originally Due" sortField="follow_up_date_at_time" />
                  <Th label="Ignored At" sortField="created_at" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                      {r.employee_name || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--text-secondary)" }}>
                      {r.lead_name || "(deleted lead)"}
                      {r.lead_phone && <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{r.lead_phone}</div>}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 12.5, color: "var(--text-secondary)", maxWidth: 320, lineHeight: 1.5 }}>
                      {r.reason}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {fmtDateTime(r.follow_up_date_at_time)}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: 11.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {fmtDateTime(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
