"use client";
import { useState, useEffect } from "react";
import api from "../../lib/api";

const emptyForm = { name: "", email: "", password: "", role_label: "" };

export default function EmployeesModal({ owner, onClose, onChanged }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/superadmin/users/${owner.id}/employees`);
      setEmployees(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner.id]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  };
  const openEdit = (emp) => {
    setEditing(emp);
    setForm({ name: emp.name, email: emp.email, password: "", role_label: emp.role_label || "" });
    setError("");
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/superadmin/users/${owner.id}/employees/${editing.id}`, form);
      } else {
        await api.post(`/superadmin/users/${owner.id}/employees`, form);
      }
      setFormOpen(false);
      load();
      onChanged?.();
    } catch (err) {
      setError(err?.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (emp) => {
    setBusyId(emp.id);
    try {
      await api.put(`/superadmin/users/${owner.id}/employees/${emp.id}/block`, { blocked: !emp.is_blocked });
      load();
    } catch {}
    setBusyId(null);
  };

  const remove = async (emp) => {
    if (!confirm(`Remove ${emp.name}? Their assigned leads will become unassigned.`)) return;
    setBusyId(emp.id);
    try {
      await api.delete(`/superadmin/users/${owner.id}/employees/${emp.id}`);
      load();
      onChanged?.();
    } catch {}
    setBusyId(null);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 210, padding: 20 }}
    >
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "24px 22px", width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-main)", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Employees</h2>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{owner.name} — {owner.org_name || owner.email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {!formOpen && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button onClick={openAdd} style={{ padding: "7px 14px", borderRadius: 7, background: "var(--teal)", border: "none", color: "#fff", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-main)", cursor: "pointer" }}>
                + Add Employee
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>Loading...</div>
            ) : employees.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>No employees yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {employees.map((emp) => (
                  <div key={emp.id} style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{emp.name}</span>
                        {emp.is_blocked && (
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--danger)", background: "var(--danger-dim)", borderRadius: 10, padding: "2px 8px" }}>BLOCKED</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{emp.email}{emp.role_label ? ` — ${emp.role_label}` : ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(emp)} style={miniBtn("var(--teal)")}>Edit</button>
                      <button onClick={() => toggleBlock(emp)} disabled={busyId === emp.id} style={miniBtn(emp.is_blocked ? "var(--success)" : "var(--warn)")}>
                        {emp.is_blocked ? "Unblock" : "Block"}
                      </button>
                      <button onClick={() => remove(emp)} disabled={busyId === emp.id} style={miniBtn("var(--danger)")}>Del</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {formOpen && (
          <form onSubmit={submit}>
            {error && (
              <div style={{ marginBottom: 12, padding: "9px 13px", background: "var(--danger-dim)", border: "1px solid var(--danger)", borderRadius: 8, fontSize: 12, color: "var(--danger)" }}>
                ⚠ {error}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <Field label="Full Name *">
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required style={inp} />
              </Field>
              <Field label="Role / Title">
                <input value={form.role_label} onChange={(e) => setForm((f) => ({ ...f, role_label: e.target.value }))} placeholder="e.g. Sales Manager" style={inp} />
              </Field>
              <Field label="Email *">
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required disabled={!!editing} style={{ ...inp, opacity: editing ? 0.6 : 1 }} />
              </Field>
              <Field label={editing ? "New Password (leave blank to keep)" : "Password *"}>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required={!editing} style={inp} />
              </Field>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 16 }}>
              {editing ? "Permissions can be fine-tuned by the tenant from their own Team page." : "New employees start with assigned-leads-only access — the tenant can grant more from their own Team page."}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setFormOpen(false)} style={{ padding: "9px 18px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: "9px 20px", borderRadius: 8, background: "var(--teal)", border: "none", color: "#fff", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Employee"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, color: "var(--text-secondary)", marginBottom: 5, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inp = { width: "100%", padding: "9px 11px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none" };
const miniBtn = (color) => ({ padding: "5px 10px", borderRadius: 6, background: "transparent", border: `1px solid ${color}`, color, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-main)" });
