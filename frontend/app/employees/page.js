"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { PERMISSION_KEYS } from "../../lib/permissions";
import { Users } from "lucide-react";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role_label: "",
  permissions: {},
};

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/employees");
      setEmployees(data);
    } catch (err) {
      if (err?.response?.status === 403) {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModal(true);
  };
  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      name: emp.name,
      email: emp.email,
      password: "",
      role_label: emp.role_label || "",
      permissions: emp.permissions || {},
    });
    setError("");
    setModal(true);
  };
  const closeModal = () => setModal(false);

  const togglePerm = (key) =>
    setForm((f) => ({
      ...f,
      permissions: { ...f.permissions, [key]: !f.permissions[key] },
    }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/employees/${editing.id}`, form);
      } else {
        await api.post("/employees", form);
      }
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const removeEmployee = async (id) => {
    if (!confirm("Remove this employee? Their assigned leads will become unassigned."))
      return;
    await api.delete(`/employees/${id}`);
    load();
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-main)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Team
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            {employees.length} employee{employees.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={openAdd} style={primaryBtn}>
          <span style={{ fontSize: 16 }}>+</span> Add Employee
        </button>
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            Loading...
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ marginBottom: 12, color: "var(--teal)", display: "flex", justifyContent: "center" }}><Users size={36} /></div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-main)",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              No employees yet
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Click "+ Add Employee" to create your first team login
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ background: "var(--bg-surface)" }}>
                  {["Name", "Email", "Role", "Permissions", "Actions"].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={td}>
                      <span style={{ fontFamily: "var(--font-main)", fontWeight: 600, color: "var(--text-primary)" }}>
                        {emp.name}
                      </span>
                    </td>
                    <td style={{ ...td, color: "var(--text-secondary)" }}>{emp.email}</td>
                    <td style={{ ...td, color: "var(--text-secondary)" }}>
                      {emp.role_label || "—"}
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 280 }}>
                        {PERMISSION_KEYS.filter((p) => emp.permissions?.[p.key]).map((p) => (
                          <span
                            key={p.key}
                            style={{
                              fontSize: 10,
                              background: "var(--teal-dim)",
                              color: "var(--teal-light)",
                              borderRadius: 10,
                              padding: "2px 8px",
                            }}
                          >
                            {p.key}
                          </span>
                        ))}
                        {!PERMISSION_KEYS.some((p) => emp.permissions?.[p.key]) && (
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Assigned leads only
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(emp)} style={editBtn}>
                          Edit
                        </button>
                        <button onClick={() => removeEmployee(emp.id)} style={delBtn}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-lg)",
              padding: "26px 24px",
              width: "100%",
              maxWidth: 540,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-main)",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {editing ? "Edit Employee" : "Add Employee"}
              </h2>
              <button onClick={closeModal} style={closeBtn}>
                ✕
              </button>
            </div>

            {error && (
              <div
                style={{
                  background: "var(--danger-dim)",
                  border: "1px solid var(--danger)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 14,
                  color: "var(--danger)",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={submit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Full Name *">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    style={inp}
                  />
                </Field>
                <Field label="Role / Title">
                  <input
                    value={form.role_label}
                    onChange={(e) => setForm((f) => ({ ...f, role_label: e.target.value }))}
                    placeholder="e.g. Sales Manager"
                    style={inp}
                  />
                </Field>
                <Field label="Email *">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    disabled={!!editing}
                    style={{ ...inp, opacity: editing ? 0.6 : 1 }}
                  />
                </Field>
                <Field label={editing ? "New Password (leave blank to keep)" : "Password *"}>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required={!editing}
                    style={inp}
                  />
                </Field>
              </div>

              <div style={{ marginTop: 18 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-secondary)",
                    marginBottom: 8,
                    fontWeight: 500,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-main)",
                  }}
                >
                  Permissions
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  {PERMISSION_KEYS.map((p) => (
                    <label
                      key={p.key}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={!!form.permissions[p.key]}
                        onChange={() => togglePerm(p.key)}
                        style={{ marginTop: 2 }}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                  Every employee can always view, change stage, and log conversation notes on leads
                  assigned to them — these checkboxes grant access beyond that.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 20,
                }}
              >
                <button type="button" onClick={closeModal} style={cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={saveBtn(saving)}>
                  {saving ? "Saving..." : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 10,
          color: "var(--text-secondary)",
          marginBottom: 5,
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontFamily: "var(--font-main)",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const th = {
  padding: "11px 14px",
  textAlign: "left",
  fontSize: 10,
  color: "var(--text-muted)",
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--border)",
  fontFamily: "var(--font-main)",
  whiteSpace: "nowrap",
};
const td = { padding: "12px 14px", fontSize: 13 };
const inp = {
  width: "100%",
  padding: "9px 11px",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
};
const primaryBtn = {
  background: "var(--gradient-accent)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-sm)",
  padding: "9px 18px",
  fontFamily: "var(--font-main)",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  boxShadow: "var(--shadow-glow)",
};
const editBtn = {
  background: "transparent",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "5px 10px",
  color: "var(--teal)",
  fontSize: 11,
  cursor: "pointer",
  fontFamily: "var(--font-main)",
  fontWeight: 600,
};
const delBtn = { ...editBtn, color: "var(--danger)" };
const closeBtn = {
  background: "none",
  border: "none",
  color: "var(--text-muted)",
  fontSize: 20,
  cursor: "pointer",
  padding: "2px 6px",
  borderRadius: 6,
};
const cancelBtn = {
  padding: "9px 18px",
  borderRadius: 8,
  background: "transparent",
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
  fontSize: 13,
  cursor: "pointer",
};
const saveBtn = (saving) => ({
  padding: "9px 20px",
  borderRadius: "var(--radius-sm)",
  background: saving ? "var(--bg-hover)" : "var(--gradient-accent)",
  border: "none",
  color: "#fff",
  fontFamily: "var(--font-main)",
  fontWeight: 600,
  fontSize: 13,
  cursor: saving ? "not-allowed" : "pointer",
  boxShadow: saving ? "none" : "var(--shadow-glow)",
});
