"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

const TRIGGER_DEFS = [
  {
    id: "new_lead",
    label: "New Lead Added",
    icon: "👤",
    desc: "When a new lead is created",
    defaultTemplate:
      "Hi {name}, Thank you for your interest! We will get back to you shortly. — {institute_name}",
  },
  {
    id: "lead_converted",
    label: "Lead Converted",
    icon: "✅",
    desc: "When a lead is marked as Converted",
    defaultTemplate:
      "Welcome {name}! You have successfully enrolled. We are excited to have you at {institute_name}!",
  },
  {
    id: "follow_up_due",
    label: "Follow-up Due Today",
    icon: "🔔",
    desc: "For leads with follow-up scheduled today",
    defaultTemplate: "Reminder: Follow up with {name} ({phone}) today.",
  },
  {
    id: "fee_due",
    label: "Fee Payment Due",
    icon: "💰",
    desc: "When a customer payment due date arrives",
    defaultTemplate:
      "Dear {name}, your fee of {amount} is due on {due_date}. Please make the payment. — {institute_name}",
  },
  {
    id: "fee_overdue",
    label: "Fee Payment Overdue",
    icon: "⚠️",
    desc: "When a payment is past its due date",
    defaultTemplate:
      "Dear {name}, your payment of {amount} for {institute_name} is overdue since {due_date}. Please clear dues immediately.",
  },
];
const VARS = [
  "{name}",
  "{phone}",
  "{email}",
  "{amount}",
  "{due_date}",
  "{institute_name}",
];

export default function AutomationPage() {
  const router = useRouter();
  const [tab, setTab] = useState("channels");
  const [creds, setCreds] = useState({
    email_enabled: false,
    email_api_key: "",
    email_from: "",
    email_from_name: "",
    sms_enabled: false,
    sms_account_sid: "",
    sms_auth_token: "",
    sms_from: "",
    whatsapp_enabled: false,
    wa_account_sid: "",
    wa_auth_token: "",
    wa_from: "",
  });
  const [triggers, setTriggers] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingChan, setSavingChan] = useState(null);
  const [savingTrig, setSavingTrig] = useState(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [manual, setManual] = useState({
    channel: "email",
    to: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) {
      router.push("/login");
      return;
    }
    load();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [cr, tr] = await Promise.all([
        api.get("/automation/credentials"),
        api.get("/automation/triggers"),
      ]);
      setCreds((c) => ({ ...c, ...cr.data }));
      const map = {};
      tr.data.forEach((t) => {
        const def = TRIGGER_DEFS.find((d) => d.id === t.trigger_id);
        map[t.trigger_id] = {
          enabled: t.enabled,
          channels: t.channels || [],
          template: t.template || def?.defaultTemplate || "",
        };
      });
      TRIGGER_DEFS.forEach((def) => {
        if (!map[def.id])
          map[def.id] = {
            enabled: false,
            channels: [],
            template: def.defaultTemplate,
          };
      });
      setTriggers(map);
    } catch {}
    setLoading(false);
  };

  const saveChannel = async (channel) => {
    setSavingChan(channel);
    try {
      await api.put("/automation/credentials", { channel, ...creds });
      showToast(
        `${channel.charAt(0).toUpperCase() + channel.slice(1)} settings saved!`,
      );
    } catch {
      showToast("Save failed", "error");
    }
    setSavingChan(null);
  };

  const saveTrigger = async (id) => {
    setSavingTrig(id);
    try {
      await api.put("/automation/triggers", {
        trigger_id: id,
        ...triggers[id],
      });
      showToast("Trigger saved!");
    } catch {
      showToast("Save failed", "error");
    }
    setSavingTrig(null);
  };

  const toggleChan = (tid, ch) => {
    setTriggers((prev) => {
      const cur = prev[tid]?.channels || [];
      return {
        ...prev,
        [tid]: {
          ...prev[tid],
          channels: cur.includes(ch)
            ? cur.filter((c) => c !== ch)
            : [...cur, ch],
        },
      };
    });
  };

  // ✅ ACTUAL send function — calls backend API
  const sendManual = async () => {
    if (!manual.to || !manual.message) return;
    setSending(true);
    try {
      const { data } = await api.post("/automation/send", {
        channel: manual.channel,
        to: manual.to,
        subject: manual.subject,
        message: manual.message,
      });
      showToast(`✓ ${data.message || "Message sent successfully!"}`);
      setManual((m) => ({ ...m, to: "", subject: "", message: "" }));
    } catch (err) {
      const errMsg =
        err.response?.data?.error || "Failed to send. Check your credentials.";
      showToast(errMsg, "error");
    }
    setSending(false);
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "var(--text-muted)",
        }}
      >
        Loading...
      </div>
    );

  return (
    <div style={{ padding: "28px 32px" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background:
              toast.type === "success" ? "var(--success)" : "var(--danger)",
            color: "#fff",
            borderRadius: 10,
            padding: "12px 20px",
            fontFamily: "var(--font-main)",
            fontWeight: 600,
            fontSize: 13,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            maxWidth: 400,
          }}
        >
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontFamily: "var(--font-main)",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Automation
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Send automated messages via Email, SMS & WhatsApp
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 28,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {[
          { k: "channels", l: "⚡ Channel Setup" },
          { k: "triggers", l: "🔔 Triggers" },
          { k: "manual", l: "✉ Manual Send" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              padding: "9px 18px",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
              fontFamily: "var(--font-main)",
              fontWeight: 600,
              fontSize: 13,
              border: "none",
              borderBottom:
                tab === t.k ? "2px solid var(--teal)" : "2px solid transparent",
              background: tab === t.k ? "var(--teal-dim)" : "transparent",
              color:
                tab === t.k ? "var(--teal-light)" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {/* TAB 1 — CHANNELS */}
      {tab === "channels" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              key: "email",
              title: "Email (SendGrid)",
              icon: "✉️",
              fields: [
                {
                  k: "email_api_key",
                  l: "SendGrid API Key",
                  ph: "SG.xxxxxxxx",
                  type: "password",
                },
                {
                  k: "email_from",
                  l: "From Email",
                  ph: "noreply@yourdomain.com",
                },
                { k: "email_from_name", l: "From Name", ph: "My Institute" },
              ],
            },
            {
              key: "sms",
              title: "SMS (Twilio)",
              icon: "💬",
              fields: [
                { k: "sms_account_sid", l: "Account SID", ph: "ACxxxxxxxxxx" },
                {
                  k: "sms_auth_token",
                  l: "Auth Token",
                  ph: "Your auth token",
                  type: "password",
                },
                { k: "sms_from", l: "From Number", ph: "+1XXXXXXXXXX" },
              ],
            },
            {
              key: "whatsapp",
              title: "WhatsApp (Twilio)",
              icon: "🟢",
              fields: [
                { k: "wa_account_sid", l: "Account SID", ph: "ACxxxxxxxxxx" },
                {
                  k: "wa_auth_token",
                  l: "Auth Token",
                  ph: "Your auth token",
                  type: "password",
                },
                { k: "wa_from", l: "WhatsApp Number", ph: "+14155238886" },
              ],
            },
          ].map(({ key, title, icon, fields }) => {
            const enabledKey =
              key === "whatsapp" ? "whatsapp_enabled" : `${key}_enabled`;
            const enabled = creds[enabledKey];
            return (
              <div
                key={key}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  borderLeft: enabled
                    ? "3px solid var(--teal)"
                    : "3px solid var(--border)",
                }}
              >
                <div
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span
                      style={{
                        fontFamily: "var(--font-main)",
                        fontWeight: 700,
                        fontSize: 14,
                        color: "var(--text-primary)",
                      }}
                    >
                      {title}
                    </span>
                    {enabled && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: "rgba(82,184,138,0.12)",
                          color: "var(--success)",
                          borderRadius: 20,
                          padding: "2px 8px",
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <Toggle
                    on={enabled}
                    onChange={() =>
                      setCreds((c) => ({ ...c, [enabledKey]: !enabled }))
                    }
                  />
                </div>
                <div style={{ padding: "18px 20px" }}>
                  {fields.map(({ k, l, ph, type }) => (
                    <div
                      key={k}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "160px 1fr",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: 14,
                      }}
                    >
                      <label
                        style={{
                          fontSize: 12,
                          color: "var(--text-secondary)",
                          fontFamily: "var(--font-main)",
                          fontWeight: 500,
                        }}
                      >
                        {l}
                      </label>
                      <input
                        type={type || "text"}
                        value={creds[k] || ""}
                        onChange={(e) =>
                          setCreds((c) => ({ ...c, [k]: e.target.value }))
                        }
                        placeholder={ph}
                        style={inp}
                      />
                    </div>
                  ))}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 4,
                    }}
                  >
                    <button
                      onClick={() => saveChannel(key)}
                      disabled={savingChan === key}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 8,
                        background:
                          savingChan === key
                            ? "var(--bg-hover)"
                            : "var(--teal)",
                        border: "none",
                        color: "#fff",
                        fontFamily: "var(--font-main)",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      {savingChan === key ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Install notice */}
          <div
            style={{
              background: "rgba(224,160,80,0.08)",
              border: "1px solid rgba(224,160,80,0.2)",
              borderRadius: 10,
              padding: "12px 18px",
              fontSize: 12,
              color: "var(--warn)",
            }}
          >
            💡 <strong>Note:</strong> Make sure to install required packages in
            backend:
            <code
              style={{
                background: "var(--bg-surface)",
                padding: "2px 8px",
                borderRadius: 4,
                marginLeft: 8,
                fontSize: 11,
              }}
            >
              npm install nodemailer twilio
            </code>
          </div>
        </div>
      )}

      {/* TAB 2 — TRIGGERS */}
      {tab === "triggers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              Template variables:
            </span>
            {VARS.map((v) => (
              <code
                key={v}
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--teal-light)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                {v}
              </code>
            ))}
          </div>

          {TRIGGER_DEFS.map((def) => {
            const t = triggers[def.id] || {
              enabled: false,
              channels: [],
              template: def.defaultTemplate,
            };
            return (
              <div
                key={def.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  borderLeft: t.enabled
                    ? "3px solid var(--teal)"
                    : "3px solid var(--border)",
                }}
              >
                <div
                  style={{
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span style={{ fontSize: 20 }}>{def.icon}</span>
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-main)",
                          fontWeight: 700,
                          fontSize: 14,
                          color: "var(--text-primary)",
                        }}
                      >
                        {def.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {def.desc}
                      </div>
                    </div>
                  </div>
                  <Toggle
                    on={t.enabled}
                    onChange={() =>
                      setTriggers((prev) => ({
                        ...prev,
                        [def.id]: { ...prev[def.id], enabled: !t.enabled },
                      }))
                    }
                  />
                </div>
                {t.enabled && (
                  <div
                    style={{
                      padding: "0 20px 18px",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ paddingTop: 14, marginBottom: 12 }}>
                      <label style={lbl}>Send via</label>
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        {[
                          {
                            k: "email",
                            l: "Email",
                            icon: "✉️",
                            ok: creds.email_enabled,
                          },
                          {
                            k: "sms",
                            l: "SMS",
                            icon: "💬",
                            ok: creds.sms_enabled,
                          },
                          {
                            k: "whatsapp",
                            l: "WhatsApp",
                            icon: "🟢",
                            ok: creds.whatsapp_enabled,
                          },
                        ].map((ch) => {
                          const active = t.channels.includes(ch.k);
                          return (
                            <button
                              key={ch.k}
                              onClick={() => toggleChan(def.id, ch.k)}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 8,
                                cursor: "pointer",
                                border: `2px solid ${active ? "var(--teal)" : "var(--border)"}`,
                                background: active
                                  ? "var(--teal-dim)"
                                  : "var(--bg-surface)",
                                color: active
                                  ? "var(--teal-light)"
                                  : ch.ok
                                    ? "var(--text-secondary)"
                                    : "var(--text-muted)",
                                fontFamily: "var(--font-main)",
                                fontWeight: 600,
                                fontSize: 12,
                                opacity: ch.ok ? 1 : 0.5,
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                              }}
                            >
                              {ch.icon} {ch.l}
                              {!ch.ok && (
                                <span
                                  style={{ fontSize: 9, color: "var(--warn)" }}
                                >
                                  (not set)
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={lbl}>Message Template</label>
                      <textarea
                        value={t.template}
                        onChange={(e) =>
                          setTriggers((prev) => ({
                            ...prev,
                            [def.id]: {
                              ...prev[def.id],
                              template: e.target.value,
                            },
                          }))
                        }
                        rows={3}
                        placeholder="Type your message..."
                        style={{
                          ...inp,
                          resize: "vertical",
                          marginTop: 6,
                          minHeight: 75,
                        }}
                      />
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "flex-end" }}
                    >
                      <button
                        onClick={() => saveTrigger(def.id)}
                        disabled={
                          savingTrig === def.id || t.channels.length === 0
                        }
                        style={{
                          padding: "7px 18px",
                          borderRadius: 7,
                          background:
                            t.channels.length === 0
                              ? "var(--bg-surface)"
                              : "var(--teal)",
                          border: "none",
                          color: "#fff",
                          fontFamily: "var(--font-main)",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor:
                            t.channels.length === 0 ? "not-allowed" : "pointer",
                          opacity: t.channels.length === 0 ? 0.5 : 1,
                        }}
                      >
                        {savingTrig === def.id ? "Saving..." : "Save Trigger"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3 — MANUAL SEND */}
      {tab === "manual" && (
        <div style={{ maxWidth: 540 }}>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-main)",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 20,
              }}
            >
              Send a Message
            </h3>

            {/* Channel selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Channel</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {[
                  {
                    k: "email",
                    l: "Email",
                    icon: "✉️",
                    ok: creds.email_enabled,
                  },
                  { k: "sms", l: "SMS", icon: "💬", ok: creds.sms_enabled },
                  {
                    k: "whatsapp",
                    l: "WhatsApp",
                    icon: "🟢",
                    ok: creds.whatsapp_enabled,
                  },
                ].map((ch) => (
                  <button
                    key={ch.k}
                    onClick={() => setManual((m) => ({ ...m, channel: ch.k }))}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: `2px solid ${manual.channel === ch.k ? "var(--teal)" : "var(--border)"}`,
                      background:
                        manual.channel === ch.k
                          ? "var(--teal-dim)"
                          : "transparent",
                      color:
                        manual.channel === ch.k
                          ? "var(--teal-light)"
                          : "var(--text-secondary)",
                      fontFamily: "var(--font-main)",
                      fontWeight: 600,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {ch.icon} {ch.l}
                    {!ch.ok && (
                      <span style={{ fontSize: 9, color: "var(--warn)" }}>
                        (not set)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>
                  To{" "}
                  {manual.channel === "email"
                    ? "(Email address)"
                    : "(Phone number)"}
                </label>
                <input
                  value={manual.to}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, to: e.target.value }))
                  }
                  placeholder={
                    manual.channel === "email"
                      ? "student@email.com"
                      : "+919876543210"
                  }
                  style={{ ...inp, marginTop: 6 }}
                />
              </div>

              {manual.channel === "email" && (
                <div>
                  <label style={lbl}>Subject</label>
                  <input
                    value={manual.subject}
                    onChange={(e) =>
                      setManual((m) => ({ ...m, subject: e.target.value }))
                    }
                    placeholder="Email subject"
                    style={{ ...inp, marginTop: 6 }}
                  />
                </div>
              )}

              <div>
                <label style={lbl}>Message</label>
                <textarea
                  value={manual.message}
                  onChange={(e) =>
                    setManual((m) => ({ ...m, message: e.target.value }))
                  }
                  rows={5}
                  placeholder="Type your message here..."
                  style={{
                    ...inp,
                    resize: "vertical",
                    marginTop: 6,
                    minHeight: 110,
                  }}
                />
              </div>

              {/* Channel not configured warning */}
              {!creds[
                manual.channel === "whatsapp"
                  ? "whatsapp_enabled"
                  : `${manual.channel}_enabled`
              ] && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(224,160,80,0.1)",
                    border: "1px solid rgba(224,160,80,0.3)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--warn)",
                  }}
                >
                  ⚠️{" "}
                  {manual.channel.charAt(0).toUpperCase() +
                    manual.channel.slice(1)}{" "}
                  channel is not configured. Go to{" "}
                  <strong>Channel Setup</strong> tab first.
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={sendManual}
                  disabled={sending || !manual.to || !manual.message}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: sending
                      ? "var(--bg-hover)"
                      : !manual.to || !manual.message
                        ? "var(--bg-surface)"
                        : "var(--teal)",
                    color: "#fff",
                    fontFamily: "var(--font-main)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor:
                      sending || !manual.to || !manual.message
                        ? "not-allowed"
                        : "pointer",
                    opacity: sending || !manual.to || !manual.message ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {sending ? (
                    <>
                      <span
                        style={{
                          animation: "spin 1s linear infinite",
                          display: "inline-block",
                        }}
                      >
                        ⟳
                      </span>{" "}
                      Sending...
                    </>
                  ) : (
                    `Send ${manual.channel === "email" ? "Email" : manual.channel === "sms" ? "SMS" : "WhatsApp"}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 42,
        height: 22,
        borderRadius: 11,
        background: on ? "var(--teal)" : "var(--bg-surface)",
        border: `2px solid ${on ? "var(--teal)" : "var(--border)"}`,
        position: "relative",
        cursor: "pointer",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: 2,
          transition: "left 0.2s",
          left: on ? 22 : 2,
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

const lbl = {
  fontSize: 10,
  color: "var(--text-secondary)",
  fontWeight: 500,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  fontFamily: "var(--font-main)",
};
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
