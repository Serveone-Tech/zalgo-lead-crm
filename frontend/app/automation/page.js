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
      "Hi {name}, thank you for your interest! Our team will get back to you shortly. — {business_name}",
  },
  {
    id: "lead_converted",
    label: "Lead Converted",
    icon: "✅",
    desc: "When a lead is marked as Converted",
    defaultTemplate:
      "Welcome {name}! Thank you for choosing us — we're excited to have you as a customer.",
  },
  {
    id: "order_shipped",
    label: "Order Shipped",
    icon: "📦",
    desc: "When a courier shipment is created and a tracking ID is generated",
    defaultTemplate:
      "Hi {name}, your order has been shipped via {provider}! Track it with AWB/Tracking ID: {tracking_id}",
  },
  {
    id: "follow_up_due",
    label: "Follow-up Due Today",
    icon: "🔔",
    desc: "For leads with follow-up scheduled today",
    defaultTemplate: "Reminder: Follow up with {name} ({phone}) today.",
  },
  {
    id: "payment_due",
    label: "Payment Due",
    icon: "💰",
    desc: "When a customer's COD balance payment due date arrives",
    defaultTemplate:
      "Dear {name}, your payment of {amount} is due on {due_date}. Please make the payment. — {business_name}",
  },
  {
    id: "payment_overdue",
    label: "Payment Overdue",
    icon: "⚠️",
    desc: "When a payment is past its due date",
    defaultTemplate:
      "Dear {name}, your payment of {amount} is overdue since {due_date}. Please clear the balance at your earliest.",
  },
];
const VARS = [
  "{name}",
  "{phone}",
  "{email}",
  "{amount}",
  "{due_date}",
  "{tracking_id}",
  "{provider}",
  "{business_name}",
];

function buildAppsScript(webhookUrl) {
  return `// ── EDIT THIS SECTION ──────────────────────────────────────────────
// One entry per tab that has leads. Each tab gets its OWN column mapping,
// since different tabs (e.g. different lead forms) can use different
// column headers even in the same spreadsheet.
//
// Run the script once first (▶ Run → syncNewLeads) to see each tab's real
// headers printed in the Execution log — copy those exact header names in
// below, replacing the placeholders.
var SHEETS = {
  'Sheet1': {                 // <- exact tab name, bottom of the sheet
    name:      'Full Name',    // <- change each to that tab's real header text
    phone:     'Phone Number',
    email:     'Email',
    platform:  '',              // e.g. 'Platform' or 'Ad Source' — optional, blank = leave blank
    created_at: ''              // e.g. 'Created Time' — optional, blank = use time of sync
  }
  // , 'Another Tab Name': { name: 'full_name', phone: 'phone_number', email: 'email', platform: 'platform', created_at: 'created_time' }
};
var WEBHOOK_URL = '${webhookUrl || "PASTE_YOUR_WEBHOOK_URL_HERE"}';
// ─────────────────────────────────────────────────────────────────

function syncNewLeads() {
  Object.keys(SHEETS).forEach(function (sheetName) {
    syncOneSheet(sheetName, SHEETS[sheetName]);
  });
}

// Each tab tracks its own "how far synced" position, so tabs don't interfere
// with each other.
function syncOneSheet(sheetName, columnMap) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('ERROR: no tab named "' + sheetName + '" — check the SHEETS keys above against your actual tab names.');
    return;
  }

  var props = PropertiesService.getScriptProperties();
  var propKey = 'lastSyncedRow__' + sheetName;
  var lastRow = parseInt(props.getProperty(propKey) || '1', 10);
  var lastCol = sheet.getLastColumn();
  var totalRows = sheet.getLastRow();
  Logger.log('Tab "' + sheetName + '": ' + totalRows + ' total rows, last synced up to row ' + lastRow + '.');

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  Logger.log('Tab "' + sheetName + '" headers: ' + JSON.stringify(headers));

  if (totalRows <= lastRow) {
    Logger.log('Tab "' + sheetName + '": nothing new since last run.');
    return;
  }

  var colIndex = {};
  headers.forEach(function (h, i) { colIndex[h] = i; });

  var rows = sheet.getRange(lastRow + 1, 1, totalRows - lastRow, lastCol).getValues();
  var highestSynced = lastRow;
  var sawFailure = false; // once true, stop advancing the pointer — a row that
  // failed (bad URL, server hiccup) must not get skipped just because a LATER
  // row in the same run happened to succeed. Everything from the failure
  // onward gets retried on the next run instead.

  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();

  rows.forEach(function (values, i) {
    if (sawFailure) return; // leave remaining rows untouched for next run
    var rowNum = lastRow + 1 + i;
    var get = function (key) {
      var header = columnMap[key];
      if (!header) return '';
      if (!(header in colIndex)) {
        Logger.log('WARNING: "' + sheetName + '" column_map.' + key + ' = "' + header + '" not found in this tab\\'s headers — check spelling.');
        return '';
      }
      var raw = values[colIndex[header]];
      if (key === 'created_at' && raw instanceof Date) {
        return Utilities.formatDate(raw, tz, "yyyy-MM-dd'T'HH:mm:ss");
      }
      return String(raw || '').trim();
    };
    var lead = {
      name: get('name'),
      phone: get('phone'),
      email: get('email'),
      platform: get('platform'),
      created_at: get('created_at')
    };

    if (!lead.name && !lead.phone) {
      Logger.log('Tab "' + sheetName + '" row ' + rowNum + ': skipped (no name or phone found).');
      highestSynced = rowNum;
      return;
    }

    var resp = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(lead),
      muteHttpExceptions: true
    });
    Logger.log('Tab "' + sheetName + '" row ' + rowNum + ' (' + lead.name + ', ' + lead.phone + '): sent — HTTP ' + resp.getResponseCode() + ' ' + resp.getContentText());

    // Only mark this row as synced if the CRM actually accepted it, so a
    // failed request (bad URL, server down) gets retried on the next run.
    // Stop advancing past a failure entirely (see sawFailure above) — the
    // backend dedups by phone/name/email so safely re-sending already-synced
    // rows on the next run is harmless.
    if (resp.getResponseCode() < 300) {
      highestSynced = rowNum;
    } else {
      sawFailure = true;
    }
  });

  props.setProperty(propKey, String(highestSynced));
}

// Run this once (▶ Run, choose resetSync) if you want the next syncNewLeads
// run to re-scan every row in every tab from the top — handy while testing.
function resetSync() {
  var props = PropertiesService.getScriptProperties();
  Object.keys(SHEETS).forEach(function (sheetName) {
    props.deleteProperty('lastSyncedRow__' + sheetName);
  });
  Logger.log('Reset — next run will re-check all rows in all tabs.');
}`;
}

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
  });
  const [triggers, setTriggers] = useState({});
  const [deliveryProviders, setDeliveryProviders] = useState([]);
  const [deliveryConfigs, setDeliveryConfigs] = useState([]);
  const [deliveryForm, setDeliveryForm] = useState(null); // { provider, enabled, credentials } while adding/editing one panel
  const [savingDelivery, setSavingDelivery] = useState(false);
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
  const [webhooks, setWebhooks] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [sub, setSub] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("crm_token");
    if (!raw) {
      router.push("/login");
      return;
    }
    const cachedUser = localStorage.getItem("crm_user");
    const u = cachedUser ? JSON.parse(cachedUser) : null;
    // Employees defer to the backend's own plan-feature check (it already
    // gates every route) — only owners need the tab-level check here, same
    // split Sidebar.js uses for its own hasPlanFeature.
    if (u && u.role !== "superadmin" && !u.parent_id) {
      api.get("/auth/subscription").then(({ data: s }) => setSub(s)).catch(() => {});
    }
    load();
  }, []);

  const planFeatures = sub?.features
    ? typeof sub.features === "string" ? JSON.parse(sub.features) : sub.features
    : null;
  const hasPlanFeature = (feat) => {
    const cachedUser = typeof window !== "undefined" ? localStorage.getItem("crm_user") : null;
    const u = cachedUser ? JSON.parse(cachedUser) : null;
    if (!u || u.parent_id) return true; // employees — backend guards anyway
    if (!planFeatures) return true; // owner but sub not loaded yet
    return planFeatures.includes(feat);
  };

  // A Pro-tier owner (lead_sources but not automation) would otherwise land
  // on the now-hidden "Channel Setup" tab by default — bump them to
  // whichever tab their plan actually shows once we know what that is.
  useEffect(() => {
    if (!planFeatures) return;
    if (tab === "channels" && !hasPlanFeature("automation") && hasPlanFeature("lead_sources")) {
      setTab("sources");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planFeatures]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [cr, tr, wh, dp, dc] = await Promise.all([
        api.get("/automation/credentials"),
        api.get("/automation/triggers"),
        api.get("/automation/webhook-urls").catch(() => ({ data: null })),
        api.get("/delivery/providers").catch(() => ({ data: [] })),
        api.get("/delivery/credentials").catch(() => ({ data: [] })),
      ]);
      setCreds((c) => ({ ...c, ...cr.data }));
      setWebhooks(wh.data);
      setDeliveryProviders(dp.data);
      setDeliveryConfigs(dc.data);
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

  const saveDelivery = async () => {
    setSavingDelivery(true);
    try {
      await api.put("/delivery/credentials", deliveryForm);
      showToast("Delivery panel saved!");
      // Re-fetch so masked secret fields reflect what's actually stored.
      const dc = await api.get("/delivery/credentials").catch(() => null);
      if (dc) setDeliveryConfigs(dc.data);
      setDeliveryForm(null);
    } catch {
      showToast("Save failed", "error");
    }
    setSavingDelivery(false);
  };

  // Quick enable/disable from the list row, without opening the full edit
  // form — the backend already treats masked "****" secret values as "keep
  // what's stored", so re-sending the (masked) row back is safe.
  const toggleDeliveryPanel = async (cfg) => {
    try {
      await api.put("/delivery/credentials", { ...cfg, enabled: !cfg.enabled });
      const dc = await api.get("/delivery/credentials").catch(() => null);
      if (dc) setDeliveryConfigs(dc.data);
    } catch {
      showToast("Save failed", "error");
    }
  };

  const deleteDeliveryPanel = async (provider) => {
    const label = deliveryProviders.find((p) => p.id === provider)?.label || provider;
    if (!confirm(`Disconnect ${label}? Orders will stop auto-shipping/tracking through it.`)) return;
    try {
      await api.delete(`/delivery/credentials/${provider}`);
      const dc = await api.get("/delivery/credentials").catch(() => null);
      if (dc) setDeliveryConfigs(dc.data);
    } catch {
      showToast("Delete failed", "error");
    }
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

  const regenerateWebhooks = async () => {
    if (
      !confirm(
        "This will invalidate your current webhook URLs. Any Google Ads or WhatsApp connection using the old URL will stop working until you update it. Continue?",
      )
    )
      return;
    setRegenerating(true);
    try {
      const { data } = await api.post("/automation/webhook-urls/regenerate");
      setWebhooks(data);
      showToast("Webhook URLs regenerated. Update your connections with the new URL.");
    } catch {
      showToast("Failed to regenerate", "error");
    }
    setRegenerating(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
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
          ...(hasPlanFeature("automation") ? [{ k: "channels", l: "⚡ Channel Setup" }] : []),
          ...(hasPlanFeature("automation") ? [{ k: "triggers", l: "🔔 Triggers" }] : []),
          ...(hasPlanFeature("automation") ? [{ k: "manual", l: "✉ Manual Send" }] : []),
          ...(hasPlanFeature("lead_sources") ? [{ k: "sources", l: "🔗 Lead Sources" }] : []),
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
                { k: "email_from_name", l: "From Name", ph: "My Business" },
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
              title: "WhatsApp (Meta Cloud API)",
              icon: "🟢",
              fields: [
                { k: "wa_account_sid", l: "Phone Number ID", ph: "e.g. 1261586240366783" },
                {
                  k: "wa_auth_token",
                  l: "Access Token",
                  ph: "Your Meta access token",
                  type: "password",
                },
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

          {/* Delivery Panels */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 18 }}>📦</span>
              <span style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                Delivery Panels
              </span>
              {deliveryConfigs.some((c) => c.enabled) && (
                <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(82,184,138,0.12)", color: "var(--success)", borderRadius: 20, padding: "2px 8px" }}>
                  Active
                </span>
              )}
            </div>
            <div style={{ padding: "18px 20px" }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                Connect as many courier panels as you use (Delhivery, Shiprocket, ...). Whichever one is picked in
                the Order Fulfillment form gets the order auto-created (with AWB pulled back) the moment it reaches
                a stock-deducting stage, and powers the &quot;View Track&quot; button on customer orders.
              </p>

              {deliveryConfigs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                  {deliveryConfigs.map((cfg) => {
                    const def = deliveryProviders.find((p) => p.id === cfg.provider);
                    return (
                      <div
                        key={cfg.provider}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          background: "var(--bg-surface)", border: "1px solid var(--border)",
                          borderRadius: 10, padding: "10px 14px",
                        }}
                      >
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, fontFamily: "var(--font-main)", color: "var(--text-primary)" }}>
                          {def?.label || cfg.provider}
                        </span>
                        {def?.supportsCreateOrder && (
                          <span style={{ fontSize: 10, color: "var(--teal-light)", background: "var(--teal-dim)", borderRadius: 10, padding: "2px 8px", fontWeight: 700, fontFamily: "var(--font-main)", whiteSpace: "nowrap" }}>
                            Auto-ship
                          </span>
                        )}
                        <Toggle on={cfg.enabled} onChange={() => toggleDeliveryPanel(cfg)} />
                        <button
                          onClick={() => setDeliveryForm({ ...cfg })}
                          title="Edit"
                          style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", color: "var(--teal)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteDeliveryPanel(cfg.provider)}
                          title="Disconnect"
                          style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", color: "var(--danger)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {deliveryForm ? (
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--teal)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
                  <div style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>
                    {deliveryProviders.find((p) => p.id === deliveryForm.provider)?.label || deliveryForm.provider}
                  </div>
                  {deliveryProviders
                    .find((p) => p.id === deliveryForm.provider)
                    ?.fields.map((field) => (
                      <div key={field.key} style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "center", gap: 16, marginBottom: 12 }}>
                        <label style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-main)", fontWeight: 500 }}>
                          {field.label}
                        </label>
                        <input
                          type={field.type || "text"}
                          value={deliveryForm.credentials?.[field.key] || ""}
                          onChange={(e) =>
                            setDeliveryForm((f) => ({
                              ...f,
                              credentials: { ...f.credentials, [field.key]: e.target.value },
                            }))
                          }
                          placeholder={field.label}
                          style={inp}
                        />
                      </div>
                    ))}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setDeliveryForm(null)}
                      style={{ padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveDelivery}
                      disabled={savingDelivery}
                      style={{
                        padding: "8px 20px",
                        borderRadius: 8,
                        background: savingDelivery ? "var(--bg-hover)" : "var(--teal)",
                        border: "none",
                        color: "#fff",
                        fontFamily: "var(--font-main)",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: savingDelivery ? "not-allowed" : "pointer",
                      }}
                    >
                      {savingDelivery ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                deliveryProviders.filter((p) => !deliveryConfigs.some((c) => c.provider === p.id)).length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", alignItems: "center", gap: 16 }}>
                    <label style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-main)", fontWeight: 500 }}>
                      Connect a panel
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) setDeliveryForm({ provider: e.target.value, enabled: true, credentials: {} });
                      }}
                      style={inp}
                    >
                      <option value="">+ Add a delivery partner…</option>
                      {deliveryProviders
                        .filter((p) => !deliveryConfigs.some((c) => c.provider === p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                  </div>
                )
              )}
            </div>
          </div>

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
                      ? "customer@email.com"
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

      {/* TAB 4 — LEAD SOURCES */}
      {tab === "sources" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "rgba(0,134,138,0.08)",
              border: "1px solid rgba(0,134,138,0.25)",
              borderRadius: 10,
              padding: "12px 18px",
              fontSize: 12,
              color: "var(--teal-light)",
            }}
          >
            💡 Connect Google Ads Lead Forms and WhatsApp so new leads land in
            this CRM automatically — no manual entry needed.
          </div>

          {!webhooks ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0" }}>
              Loading webhook URLs...
            </div>
          ) : (
            <>
              {/* Google Ads card */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <span style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                    Google Ads Lead Form
                  </span>
                </div>
                <div style={{ padding: "18px 20px" }}>
                  <label style={lbl}>Webhook URL</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input readOnly value={webhooks.google_webhook_url} style={{ ...inp, fontSize: 12 }} onFocus={(e) => e.target.select()} />
                    <button onClick={() => copyToClipboard(webhooks.google_webhook_url)} style={copyBtn}>Copy</button>
                  </div>
                  <label style={lbl}>Key</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input readOnly value={webhooks.token} style={{ ...inp, fontSize: 12 }} onFocus={(e) => e.target.select()} />
                    <button onClick={() => copyToClipboard(webhooks.token)} style={copyBtn}>Copy</button>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    <strong style={{ color: "var(--text-secondary)" }}>Setup:</strong> Google Ads → your Lead Form asset → Lead delivery →
                    Webhook → paste the URL above in "Webhook URL" and the Key above in "Webhook key" → Save.
                  </div>
                </div>
              </div>

              {/* WhatsApp card */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🟢</span>
                  <span style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                    WhatsApp (incoming messages)
                  </span>
                </div>
                <div style={{ padding: "18px 20px" }}>
                  <label style={lbl}>Callback URL</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input readOnly value={webhooks.whatsapp_webhook_url} style={{ ...inp, fontSize: 12 }} onFocus={(e) => e.target.select()} />
                    <button onClick={() => copyToClipboard(webhooks.whatsapp_webhook_url)} style={copyBtn}>Copy</button>
                  </div>
                  <label style={lbl}>Verify Token</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input readOnly value={webhooks.token} style={{ ...inp, fontSize: 12 }} onFocus={(e) => e.target.select()} />
                    <button onClick={() => copyToClipboard(webhooks.token)} style={copyBtn}>Copy</button>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    <strong style={{ color: "var(--text-secondary)" }}>Setup:</strong> Go to{" "}
                    <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" style={{ color: "var(--teal-light)" }}>
                      Meta for Developers
                    </a>{" "}
                    → your App → WhatsApp → Configuration → paste the Callback URL and Verify Token above → Verify and Save → subscribe
                    to the <code style={{ background: "var(--bg-surface)", padding: "1px 6px", borderRadius: 4 }}>messages</code> field.
                  </div>
                </div>
              </div>

              {/* Google Sheet card */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📊</span>
                  <span style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                    Google Sheet
                  </span>
                </div>
                <div style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.7 }}>
                    If your ad leads land in a Google Sheet, a small script checks the sheet every few minutes and
                    sends any new rows here automatically.
                  </div>

                  <label style={lbl}>Webhook URL</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input readOnly value={webhooks.sheets_webhook_url} style={{ ...inp, fontSize: 12 }} onFocus={(e) => e.target.select()} />
                    <button onClick={() => copyToClipboard(webhooks.sheets_webhook_url)} style={copyBtn}>Copy</button>
                  </div>

                  <label style={lbl}>Apps Script (paste into your Sheet)</label>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 14, alignItems: "flex-start" }}>
                    <pre
                      style={{
                        flex: 1,
                        margin: 0,
                        padding: "12px 14px",
                        background: "var(--bg-input)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        color: "var(--text-secondary)",
                        fontSize: 11,
                        lineHeight: 1.6,
                        overflowX: "auto",
                        maxHeight: 220,
                        fontFamily: "monospace",
                      }}
                    >
                      {buildAppsScript(webhooks.sheets_webhook_url)}
                    </pre>
                    <button onClick={() => copyToClipboard(buildAppsScript(webhooks.sheets_webhook_url))} style={copyBtn}>
                      Copy Script
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    <strong style={{ color: "var(--text-secondary)" }}>Setup:</strong> Open your Sheet → Extensions → Apps Script → delete
                    any placeholder code → paste the script above → Save. Pick <code style={{ background: "var(--bg-surface)", padding: "1px 6px", borderRadius: 4 }}>syncNewLeads</code> in
                    the function dropdown → Run once — the Execution log will print each tab's real column headers. Edit the{" "}
                    <code style={{ background: "var(--bg-surface)", padding: "1px 6px", borderRadius: 4 }}>SHEETS</code> block near the top:
                    one entry per tab (add more if you have multiple tabs, e.g. from different lead forms), using those exact header
                    names → Save. Then click the clock icon (Triggers) on the left → Add Trigger → function{" "}
                    <code style={{ background: "var(--bg-surface)", padding: "1px 6px", borderRadius: 4 }}>syncNewLeads</code>, event
                    source "Time-driven", type "Minutes timer", every 5 minutes → Save (approve the permission prompt the first time).
                  </div>
                </div>
              </div>

              {/* Custom / universal webhook card */}
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🔌</span>
                  <span style={{ fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                    Custom App (MacroDroid, call-tracking apps, anything else)
                  </span>
                </div>
                <div style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.7 }}>
                    Any app or service that can send a custom HTTP request — call-tracking apps like MacroDroid, cloud
                    telephony platforms (Exotel, Knowlarity, etc.), Zapier, or your own script — can send leads here
                    directly. Point it at the URL below with a JSON body in this exact shape.
                  </div>

                  <label style={lbl}>Webhook URL</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <input readOnly value={webhooks.sheets_webhook_url} style={{ ...inp, fontSize: 12 }} onFocus={(e) => e.target.select()} />
                    <button onClick={() => copyToClipboard(webhooks.sheets_webhook_url)} style={copyBtn}>Copy</button>
                  </div>

                  <label style={lbl}>Request format</label>
                  <pre
                    style={{
                      margin: "6px 0 14px",
                      padding: "12px 14px",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--text-secondary)",
                      fontSize: 11,
                      lineHeight: 1.6,
                      overflowX: "auto",
                      fontFamily: "monospace",
                    }}
                  >
{`Method: POST
Content-Type: application/json

{
  "name": "Caller name (or leave blank)",
  "phone": "9876543210",
  "email": "optional",
  "platform": "e.g. Phone Call",
  "created_at": "2026-07-31T14:30:00"   // optional, defaults to now
}`}
                  </pre>

                  <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                    <strong style={{ color: "var(--text-secondary)" }}>MacroDroid setup:</strong> Add trigger{" "}
                    <em>Phone → Call Ended</em> → add action <em>Connectivity → HTTP Request</em> → Method{" "}
                    <code style={{ background: "var(--bg-surface)", padding: "1px 6px", borderRadius: 4 }}>POST</code>,
                    paste the URL above, Content-Type <code style={{ background: "var(--bg-surface)", padding: "1px 6px", borderRadius: 4 }}>application/json</code>,
                    and build the body using the format above — tap the <strong>"..."</strong> button next to each field
                    to insert that trigger's phone number / caller name via magic text instead of typing it manually.
                    <br /><br />
                    <strong style={{ color: "var(--text-secondary)" }}>Any other tool:</strong> as long as it can send a
                    POST request with this JSON shape (or you can reshape its output to match — e.g. via a Zapier/Make
                    formatter step), it will work here.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={regenerateWebhooks}
                  disabled={regenerating}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    background: "transparent",
                    border: "1px solid var(--danger)",
                    color: "var(--danger)",
                    fontFamily: "var(--font-main)",
                    fontWeight: 600,
                    fontSize: 12,
                    cursor: regenerating ? "not-allowed" : "pointer",
                    opacity: regenerating ? 0.6 : 1,
                  }}
                >
                  {regenerating ? "Regenerating..." : "⟳ Regenerate URLs"}
                </button>
              </div>
            </>
          )}
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
const copyBtn = {
  padding: "9px 16px",
  borderRadius: 8,
  background: "var(--teal-dim)",
  border: "1px solid var(--teal)",
  color: "var(--teal-light)",
  fontFamily: "var(--font-main)",
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
  flexShrink: 0,
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
