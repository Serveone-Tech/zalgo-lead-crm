// Meta Lead Ads — lets a tenant connect a Facebook Page they manage (via a
// Facebook Login popup, same Embedded-Signup-style pattern as WhatsApp) so
// that form submissions on their Meta/Instagram lead ads land straight in
// this CRM's Leads, instead of someone manually exporting a CSV from Ads
// Manager. Unlike WhatsApp's Tech Provider model (one shared system-user
// token for every tenant), each tenant's own Page-scoped access token is
// stored and used directly — Pages aren't shared into this app's Business
// the way a WABA is during WhatsApp Embedded Signup.
const { GRAPH_BASE } = require("./meta-graph");

// The `code` here comes from the frontend's FB.login() callback
// (response.authResponse.code) — a one-time authorization code, exchanged
// here for a short-lived USER access token good enough to list the pages
// that user manages (listManagedPages immediately exchanges each page for
// its own long-lived Page token, which is what actually gets stored).
async function exchangeCodeForUserToken(code) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("META_APP_ID / META_APP_SECRET not configured on the server");

  const url = `${GRAPH_BASE}/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    const err = new Error(data?.error?.message || `Meta rejected this login (HTTP ${res.status})`);
    err.metaError = data?.error || null;
    throw err;
  }
  return data.access_token;
}

// Lists every Page the logged-in user administers, each with its own
// Page-scoped access token (Meta issues one per page in this same
// response — no separate exchange needed). That token is what gets saved
// and used for every later API call against this page.
async function listManagedPages(userAccessToken) {
  const res = await fetch(`${GRAPH_BASE}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userAccessToken)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error?.message || "Could not list this account's Facebook Pages");
  }
  return data.data || []; // [{ id, name, access_token }]
}

// Tells Meta this app wants the page's "leadgen" webhook events — without
// this, a lead ad form submission never reaches our callback URL at all,
// the same missing step that silently broke WhatsApp's manual-connect flow.
async function subscribeAppToPage(pageId, pageAccessToken) {
  const res = await fetch(`${GRAPH_BASE}/${pageId}/subscribed_apps?subscribed_fields=leadgen`, {
    method: "POST",
    headers: { Authorization: `Bearer ${pageAccessToken}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error?.message || "Could not subscribe this app to the Page's lead events");
  }
  return data;
}

// The leadgen webhook event only carries IDs (leadgen_id, form_id, ad_id) —
// the actual name/phone/email the person typed has to be fetched
// separately with this call, using the Page's own access token.
async function fetchLeadData(leadgenId, pageAccessToken) {
  const res = await fetch(`${GRAPH_BASE}/${leadgenId}?access_token=${encodeURIComponent(pageAccessToken)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error?.message || "Could not fetch this lead's details from Meta");
  }
  return data; // { id, created_time, field_data: [{ name, values: [...] }], ad_id, form_id, ... }
}

module.exports = { exchangeCodeForUserToken, listManagedPages, subscribeAppToPage, fetchLeadData };
