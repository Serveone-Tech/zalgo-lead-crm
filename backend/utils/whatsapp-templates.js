// Wraps Meta's WhatsApp Message Templates API — the only way to message
// someone outside the free 24-hour customer-service window. Templates are
// created against the tenant's own WhatsApp Business Account (WABA) id
// (stored in automation_credentials.wa_from, repurposed from the unused
// Twilio-era column) and go through Meta's own review before they're
// usable, so creating one here never sends anything by itself.
//
// Payload construction (turning the CRM's structured template config into
// Meta's `components` array) lives in meta-template-validator.js's
// buildMetaComponents() — this file only makes the actual Graph API calls.

const { GRAPH_BASE } = require("./meta-graph");
const { slugifyTemplateName, buildMetaComponents } = require("./meta-template-validator");

async function createTemplate(wabaId, accessToken, tpl) {
  const res = await fetch(`${GRAPH_BASE}/${wabaId}/message_templates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: tpl.name,
      language: tpl.language,
      category: tpl.category,
      components: buildMetaComponents(tpl),
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    const err = new Error(data?.error?.error_user_msg || data?.error?.message || `Meta rejected the template (HTTP ${res.status})`);
    err.httpStatus = res.status;
    err.metaError = data?.error || null;
    throw err;
  }
  return data; // { id, status, category }
}

// Meta doesn't push status updates anywhere we're set up to receive by
// default, so templates are checked on demand by name instead of relying
// on a webhook.
async function fetchTemplateStatus(wabaId, accessToken, name) {
  // rejected_reason isn't included by default — has to be asked for
  // explicitly via `fields`, unlike status/category which always come back.
  const res = await fetch(`${GRAPH_BASE}/${wabaId}/message_templates?name=${encodeURIComponent(name)}&fields=id,name,status,category,rejected_reason`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error?.message || "Could not check template status");
  }
  return data?.data?.[0] || null; // { id, status, category, rejected_reason }
}

async function deleteTemplate(wabaId, accessToken, name) {
  const res = await fetch(`${GRAPH_BASE}/${wabaId}/message_templates?name=${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error?.message || "Could not delete template on Meta");
  }
  return true;
}

// {{1}} is always treated as the recipient's name (auto-filled per
// customer); any further {{2}}, {{3}}... are fixed values the sender
// supplies once for the whole broadcast — see automation.js.
async function sendTemplateMessage(creds, toPhone, { name, language, bodyParams }) {
  const phoneNumberId = creds.wa_account_sid;
  const accessToken = creds.wa_auth_token;
  if (!phoneNumberId || !accessToken) throw new Error("Meta WhatsApp credentials not configured");

  const components = bodyParams?.length
    ? [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text: String(text ?? "") })) }]
    : [];

  const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: String(toPhone).replace(/\D/g, ""),
      type: "template",
      template: { name, language: { code: language }, components },
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error?.message || `Template send failed (HTTP ${res.status})`);
  }
  return data;
}

module.exports = { slugifyTemplateName, createTemplate, fetchTemplateStatus, deleteTemplate, sendTemplateMessage };
