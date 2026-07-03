"use client";
import { useState, useEffect } from "react";
import api from "../lib/api";
import { isOwnerUser, hasPerm } from "../lib/permissions";
import { STAGES as FALLBACK_STAGES } from "../lib/stages";
const PLATFORMS = [
  "LinkedIn",
  "Instagram",
  "WhatsApp",
  "Email",
  "Referral",
  "Other",
];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function LeadModal({ lead, employees = [], stages = [], onClose, onSave }) {
  const stageNames = stages.length ? stages.map(s => s.name) : FALLBACK_STAGES;
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    platform: "LinkedIn",
    platform_link: "",
    stage: "New",
    last_message: "",
    follow_up_date: "",
    notes: "",
    assigned_to: "",
  });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [newMsgDate, setNewMsgDate] = useState(today());
  const [msgSaving, setMsgSaving] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("crm_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || "",
        phone: lead.phone || "",
        email: lead.email || "",
        platform: lead.platform || "LinkedIn",
        platform_link: lead.platform_link || "",
        stage: lead.stage || "New",
        last_message: lead.last_message || "",
        follow_up_date: lead.follow_up_date
          ? lead.follow_up_date.split("T")[0]
          : "",
        notes: lead.notes || "",
        assigned_to: lead.assigned_to || "",
      });
      if (lead.id) loadMessages();
    }
  }, [lead]);

  const loadMessages = async () => {
    try {
      const { data } = await api.get(`/leads/${lead.id}/messages`);
      setMessages(data);
    } catch {}
  };

  const addMessage = async () => {
    if (!newMsg.trim()) return;
    setMsgSaving(true);
    try {
      await api.post(`/leads/${lead.id}/messages`, {
        message: newMsg.trim(),
        message_date: newMsgDate,
      });
      setNewMsg("");
      setNewMsgDate(today());
      loadMessages();
    } finally {
      setMsgSaving(false);
    }
  };

  const canAssign = isOwnerUser(user) || hasPerm(user, "assign_leads");
  const canEditStageOnly =
    !canAssign &&
    !isOwnerUser(user) &&
    !hasPerm(user, "view_all_leads") &&
    lead?.assigned_to === user?.id;

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
          maxWidth: 520,
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
            marginBottom: 22,
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
            {lead?.id ? "Edit Lead" : "Add New Lead"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: 20,
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            {/* Full Name — full width */}
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Full Name *">
                <input
                  name="name"
                  value={form.name}
                  onChange={handle}
                  placeholder="Lead's full name"
                  required
                  style={inp}
                />
              </Field>
            </div>

            {/* ✅ Phone + Email — NEW fields */}
            <Field label="Phone Number">
              <input
                name="phone"
                value={form.phone}
                onChange={handle}
                placeholder="9876543210"
                style={inp}
              />
            </Field>
            <Field label="Email Address">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handle}
                placeholder="lead@email.com"
                style={inp}
              />
            </Field>

            {/* Platform + Stage */}
            <Field label="Platform">
              <select
                name="platform"
                value={form.platform}
                onChange={handle}
                style={inp}
              >
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Stage">
              <select
                name="stage"
                value={form.stage}
                onChange={handle}
                style={inp}
              >
                {stageNames.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>

            {/* Assigned To */}
            {(canAssign || form.assigned_to) && (
              <div style={{ gridColumn: "1/-1" }}>
                <Field label="Assigned To">
                  {canAssign ? (
                    <select
                      name="assigned_to"
                      value={form.assigned_to}
                      onChange={handle}
                      style={inp}
                    >
                      <option value="">Unassigned</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                          {emp.role_label ? ` — ${emp.role_label}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ ...inp, color: "var(--text-secondary)" }}>
                      {employees.find((e) => e.id === form.assigned_to)?.name ||
                        "Assigned to you"}
                    </div>
                  )}
                </Field>
              </div>
            )}

            {/* Platform Link — full width */}
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Profile / Platform Link">
                <input
                  name="platform_link"
                  value={form.platform_link}
                  onChange={handle}
                  placeholder="https://linkedin.com/in/..."
                  style={inp}
                />
              </Field>
            </div>

            {/* Last Message — full width */}
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Last Message">
                <input
                  name="last_message"
                  value={form.last_message}
                  onChange={handle}
                  placeholder="What was the last thing discussed?"
                  style={inp}
                />
              </Field>
            </div>

            {/* Follow-up Date */}
            <Field label="Next Follow-up Date">
              <input
                name="follow_up_date"
                type="date"
                value={form.follow_up_date}
                onChange={handle}
                style={inp}
              />
            </Field>

            {/* Notes — full width */}
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Notes">
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handle}
                  placeholder="Quick notes about this lead..."
                  rows={3}
                  style={{ ...inp, resize: "vertical", minHeight: 70 }}
                />
              </Field>
            </div>
          </div>

          {/* Conversation Log — only once the lead exists */}
          {lead?.id && (
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
                Conversation Log
              </div>

              <div
                style={{
                  maxHeight: 160,
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                {messages.length === 0 ? (
                  <div
                    style={{
                      padding: 14,
                      fontSize: 12,
                      color: "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    No conversation logged yet
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: "9px 12px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--teal-light)",
                          }}
                        >
                          {m.message_date
                            ? new Date(m.message_date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {m.author_name || ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-primary)" }}>
                        {m.message}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="date"
                  value={newMsgDate}
                  onChange={(e) => setNewMsgDate(e.target.value)}
                  style={{ ...inp, width: 140, flexShrink: 0 }}
                />
                <input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="What was discussed on this date?"
                  style={inp}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMessage();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addMessage}
                  disabled={msgSaving || !newMsg.trim()}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: msgSaving ? "var(--bg-hover)" : "var(--gradient-accent)",
                    border: "none",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--font-main)",
                    cursor: msgSaving ? "not-allowed" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Converted hint */}
          {form.stage === "Converted" && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "rgba(82,184,138,0.1)",
                border: "1px solid rgba(82,184,138,0.3)",
                borderRadius: 8,
                fontSize: 12,
                color: "#52b88a",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>✓</span>
              <span>
                This lead will be automatically added to{" "}
                <strong>Customers</strong> on save.
              </span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: 20,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
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
              }}
            >
              {saving ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
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
