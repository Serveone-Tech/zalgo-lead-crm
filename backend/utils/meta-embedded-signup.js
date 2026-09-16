// Meta WhatsApp Embedded Signup — lets a tenant connect their own WhatsApp
// Business Account from inside this CRM (Facebook login popup) instead of
// manually copy-pasting a Phone Number ID / Access Token / WABA ID under
// Channel Setup. This app acts as a Meta Tech Provider: once a tenant
// completes the popup flow, their WABA is shared with this app's Business
// Manager, and this app's own long-lived META_SYSTEM_USER_TOKEN is used for
// every ongoing API call against it — no per-tenant token to store or
// refresh, unlike the manual-entry flow.
const { GRAPH_BASE } = require("./meta-graph");

// The `code` here comes from the frontend's FB.login() callback
// (response.authResponse.code) after the Embedded Signup popup completes —
// this is a one-time authorization code, not itself a usable access token.
// Exchanging it confirms the code is genuine and tied to this app; the
// resulting short-lived token isn't used for ongoing calls (the system
// user token is), but capturing the exchange response is useful for
// diagnosing a failed connection.
async function exchangeSignupCode(code) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("META_APP_ID / META_APP_SECRET not configured on the server");

  const url = `${GRAPH_BASE}/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    const err = new Error(data?.error?.message || `Meta rejected the signup code (HTTP ${res.status})`);
    err.metaError = data?.error || null;
    throw err;
  }
  return data; // { access_token, token_type, expires_in }
}

// Registers this app to actually receive webhook events for a newly
// connected WABA — without this, messages/status/template updates for that
// WABA never arrive even though the account is now shared with this
// Business. Uses the system user token since that's what has management
// access to the WABA once Embedded Signup completes.
async function subscribeAppToWaba(wabaId) {
  const systemUserToken = process.env.META_SYSTEM_USER_TOKEN;
  if (!systemUserToken) throw new Error("META_SYSTEM_USER_TOKEN not configured on the server");

  const res = await fetch(`${GRAPH_BASE}/${wabaId}/subscribed_apps`, {
    method: "POST",
    headers: { Authorization: `Bearer ${systemUserToken}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    throw new Error(data?.error?.message || "Could not subscribe this app to the connected WhatsApp account");
  }
  return data;
}

// Looks up the connected number's display phone number (e.g. "+91 98765
// 43210") for a nicer confirmation in the UI than a raw phone_number_id.
async function getPhoneNumberDisplay(phoneNumberId) {
  const systemUserToken = process.env.META_SYSTEM_USER_TOKEN;
  if (!systemUserToken) return null;
  try {
    const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}?fields=display_phone_number,verified_name`, {
      headers: { Authorization: `Bearer ${systemUserToken}` },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.error) return null;
    return data; // { display_phone_number, verified_name }
  } catch {
    return null;
  }
}

module.exports = { exchangeSignupCode, subscribeAppToWaba, getPhoneNumberDisplay };
