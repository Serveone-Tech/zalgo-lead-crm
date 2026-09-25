"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { PERMISSION_MODULES, visiblePermissionModules } from "../../lib/permissions";
import { parsePlanFeatures } from "../../lib/plan-features";
import { Users } from "lucide-react";
import Pagination from "../../components/Pagination";
import { useToast } from "../../components/ToastProvider";
import { useConfirmDialog } from "../../components/ConfirmDialogProvider";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role_label: "",
  permissions: {},
};

// Compact "Leads: RW" style badges for the employee table — derived from the
// same module definitions the R/W/D matrix uses, so it stays in sync. A cell
// with only SOME of its underlying keys set (legacy data) shows lowercase
// instead of being silently dropped as if nothing were granted.
function summarizeModulePerms(permissions) {
  const perms = permissions || {};
  const letters = { read: "R", write: "W", delete: "D" };
  return PERMISSION_MODULES.map((mod) => {
    const granted = ["read", "write", "delete"]
      .filter((action) => mod[action])
      .map((action) => {
        const cell = mod[action];
        if (cell.keys.every((k) => perms[k])) return letters[action];
        if (cell.keys.some((k) => perms[k])) return letters[action].toLowerCase();
        return null;
      })
      .filter(Boolean);
    return granted.length > 0 ? { label: mod.label, letters: granted.join(""), title: mod.label } : null;
  }).filter(Boolean);
}

export default function EmployeesPage() {
  const router = useRouter();
  const showToast = useToast();
  const confirmDialog = useConfirmDialog();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    api.get("/auth/subscription").then((r) => setSub(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/employees", { params: { page, pageSize } });
      setEmployees(data.rows);
      setTotal(data.total);
      setActiveCount(data.active_count);
    } catch (err) {
      if (err?.response?.status === 403) {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  // -1 on the plan means unlimited; a Super Admin-granted override always
  // wins over the plan's own default seat count. Deactivated employees
  // don't count against the seat limit — same rule the backend enforces.
  // activeCount comes from the server now (see load()) since `employees`
  // only holds the current page, not the whole tenant.
  const employeeLimit = sub ? (sub.employee_limit_override ?? sub.max_employees) : null;
  const atLimit = employeeLimit !== null && employeeLimit !== -1 && activeCount >= employeeLimit;

  // Only offer checkboxes for modules the owner's own plan actually
  // includes — granting a permission for a module the owner can't use
  // themselves would just 403 the moment the employee tried it.
  const grantableModules = visiblePermissionModules(parsePlanFeatures(sub));

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

  // Each Read/Write/Delete cell can back onto more than one underlying flag
  // (e.g. Leads "Write" = edit_lead_details + assign_leads + bulk_upload_leads)
  // — toggle them all together so the cell behaves as one checkbox. Older
  // employees can end up with SOME but not all of a cell's keys set (e.g. a
  // newly-added flag got backfilled on its own) — that shows as an
  // indeterminate (—) state rather than silently looking unchecked, so
  // partial legacy permissions aren't mistaken for "nothing granted".
  const isCellChecked = (perms, cell) => !!cell && cell.keys.every((k) => perms[k]);
  const isCellPartial = (perms, cell) =>
    !!cell && !isCellChecked(perms, cell) && cell.keys.some((k) => perms[k]);
  const toggleCell = (cell) => {
    if (!cell) return;
    setForm((f) => {
      // Partial or fully-off → turn everything ON. Only a fully-on cell
      // turns everything OFF. This means clicking an indeterminate box
      // completes it first, rather than clearing it — matches how people
      // expect a checkbox showing "some access" to behave when clicked.
      const turningOn = !isCellChecked(f.permissions, cell);
      const next = { ...f.permissions };
      cell.keys.forEach((k) => {
        next[k] = turningOn;
      });
      return { ...f, permissions: next };
    });
  };

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
    await confirmDialog({
      title: "Remove Employee",
      message: "This will remove the employee's account. Their assigned leads will become unassigned.",
      confirmLabel: "Remove Employee",
      danger: true,
      onConfirm: async () => {
        await api.delete(`/employees/${id}`);
        load();
      },
    });
  };

  const [statusChanging, setStatusChanging] = useState(null);
  const toggleActive = async (emp) => {
    const goingActive = !!emp.is_blocked;
    const doToggle = async () => {
      setStatusChanging(emp.id);
      await api.put(`/employees/${emp.id}/status`, { active: goingActive });
      load();
    };
    if (!goingActive) {
      // Deactivating needs confirmation — let a failure surface inline in
      // the dialog itself rather than swallowing it here, so the dialog
      // doesn't close as if it succeeded while an error toast fires beside it.
      await confirmDialog({
        title: "Deactivate Employee",
        message: `Deactivate ${emp.name}? They won't be able to log in, but their data stays exactly as-is — you can reactivate them any time.`,
        confirmLabel: "Deactivate",
        danger: true,
        onConfirm: doToggle,
      });
    } else {
      // Reactivating is immediate, no confirmation step — a failure here
      // has no dialog to show it in, so it's the one path that still toasts.
      try {
        await doToggle();
      } catch (err) {
        showToast(err.response?.data?.error || "Something went wrong", "error");
      }
    }
    setStatusChanging(null);
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
            {activeCount} active employee{activeCount !== 1 ? "s" : ""}
            {employeeLimit !== null && employeeLimit !== -1 && ` of ${employeeLimit} on your plan`}
            {total !== activeCount && ` · ${total - activeCount} deactivated`}
          </p>
          {atLimit && (
            <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>
              You've reached your plan's employee limit. Contact us to request more seats.
            </p>
          )}
        </div>
        <button onClick={openAdd} disabled={atLimit} style={{ ...primaryBtn, ...(atLimit ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}>
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
                  {["Name", "Email", "Role", "Permissions", "Status", "Actions"].map((h) => (
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
                        {summarizeModulePerms(emp.permissions).map((m) => (
                          <span
                            key={m.label}
                            title={m.title}
                            style={{
                              fontSize: 10,
                              background: "var(--teal-dim)",
                              color: "var(--teal-light)",
                              borderRadius: 10,
                              padding: "2px 8px",
                            }}
                          >
                            {m.label}: {m.letters}
                          </span>
                        ))}
                        {summarizeModulePerms(emp.permissions).length === 0 && (
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Assigned leads only
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={td}>
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: emp.is_blocked ? "var(--danger-dim)" : "var(--success-dim)",
                          color: emp.is_blocked ? "var(--danger)" : "var(--success)",
                        }}
                      >
                        {emp.is_blocked ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(emp)} style={editBtn}>
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(emp)}
                          disabled={statusChanging === emp.id}
                          style={emp.is_blocked ? activateBtn : deactivateBtn}
                        >
                          {statusChanging === emp.id ? "…" : emp.is_blocked ? "Activate" : "Deactivate"}
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

      {!loading && total > 0 && (
        <Pagination
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          total={total}
        />
      )}

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
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "9px 12px",
                            fontSize: 10,
                            color: "var(--text-muted)",
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            fontFamily: "var(--font-main)",
                          }}
                        >
                          Module
                        </th>
                        {["Read", "Write", "Delete"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "center",
                              padding: "9px 12px",
                              fontSize: 10,
                              color: "var(--text-muted)",
                              fontWeight: 600,
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              fontFamily: "var(--font-main)",
                              width: 64,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grantableModules.map((mod) => (
                        <tr key={mod.key} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              fontFamily: "var(--font-main)",
                            }}
                          >
                            {mod.label}
                          </td>
                          {["read", "write", "delete"].map((action) => {
                            const cell = mod[action];
                            return (
                              <td key={action} style={{ textAlign: "center", padding: "10px 12px" }}>
                                {cell ? (
                                  <input
                                    type="checkbox"
                                    title={
                                      isCellPartial(form.permissions, cell)
                                        ? `Partially granted — click to grant fully. ${cell.hint}`
                                        : cell.hint
                                    }
                                    checked={isCellChecked(form.permissions, cell)}
                                    ref={(el) => {
                                      if (el) el.indeterminate = isCellPartial(form.permissions, cell);
                                    }}
                                    onChange={() => toggleCell(cell)}
                                  />
                                ) : (
                                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                  Every employee can always view, change stage, and log conversation notes on leads
                  assigned to them — these checkboxes grant access beyond that. Hover a checkbox for
                  exactly what it unlocks.
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
const deactivateBtn = { ...editBtn, color: "var(--warn)" };
const activateBtn = { ...editBtn, color: "var(--success)" };
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
