# WhatsApp Embedded Signup (Meta Tech Provider)

Lets a tenant connect their own WhatsApp Business Account from inside Channel Setup with a Facebook login popup, instead of manually copying a Phone Number ID / Access Token / WABA ID. This CRM acts as a Meta **Tech Provider**: once a tenant completes the popup, their WABA is shared with this app's Business Manager, and every ongoing API call against it uses this app's own long-lived System User token — no per-tenant token to store, rotate, or worry about expiring.

The existing manual-entry fields (Phone Number ID / Access Token / WABA ID / Meta App ID) are kept as a fallback, unchanged — this is additive, not a replacement.

## Required setup (Meta side — done once, not per-tenant)

1. Meta App created, Business Verification completed.
2. A **System User** (Business Settings → Users → System Users) with the tenant/testing WABA assigned under "Assigned assets" → WhatsApp Accounts, Full Control.
3. A long-lived **System User Access Token**, generated with `whatsapp_business_management`, `whatsapp_business_messaging`, `business_management` permissions, expiration set to **Never**.
4. An **Embedded Signup Configuration** (App Dashboard → WhatsApp → Embedded Signup / Facebook Login for Business → Configurations) — gives a Configuration ID.
5. **Facebook Login for Business** settings: Valid OAuth Redirect URI added, Allowed Domains for the JavaScript SDK includes every domain that will use this (all `*.zalgostore.com` products sharing this one App).
6. While the app is still in **Development mode** (before App Review passes), every tenant who needs to complete signup must be added individually under App Dashboard → App Roles → Testers — real customers outside that list can't finish the popup flow until the app goes Live.

## Required environment variables

Backend `.env`:
```
META_APP_ID=<Facebook App ID>
META_APP_SECRET=<App Secret — Settings > Basic>
META_EMBEDDED_SIGNUP_CONFIG_ID=<Configuration ID>
META_SYSTEM_USER_TOKEN=<long-lived System User token>
```

Frontend `.env.local` (not secret — used client-side by the Facebook JS SDK, must match the backend's `META_APP_ID`/`META_EMBEDDED_SIGNUP_CONFIG_ID`):
```
NEXT_PUBLIC_META_APP_ID=<same App ID>
NEXT_PUBLIC_META_CONFIG_ID=<same Configuration ID>
```

## How it works

**Frontend** (`components/WhatsAppEmbeddedSignup.js`, rendered inside Channel Setup's WhatsApp panel in `app/automation/page.js`):
1. Loads the Facebook JS SDK on demand (once), `FB.init({appId, version: 'v20.0'})`.
2. "Connect WhatsApp with Facebook" button calls `FB.login()` with the Embedded Signup `config_id`.
3. Two things arrive asynchronously and both are needed before the backend call can happen:
   - `FB.login()`'s own callback gives a one-time authorization **code**.
   - A separate `window.postMessage` event (`type: "WA_EMBEDDED_SIGNUP", event: "FINISH"`) that Meta's popup sends mid-flow carries the actual **waba_id** / **phone_number_id** that got connected — the code alone doesn't contain these.
4. Once both are captured, `POST /api/automation/whatsapp/embedded-signup` with `{code, waba_id, phone_number_id}`.

**Backend** (`utils/meta-embedded-signup.js` + the route in `routes/automation.js`):
1. `exchangeSignupCode(code)` — confirms the code is genuine (`GET /oauth/access_token?client_id=...&client_secret=...&code=...`). The resulting short-lived token isn't stored or used further — only the exchange succeeding matters.
2. `subscribeAppToWaba(wabaId)` — `POST /{waba-id}/subscribed_apps` using the System User token, so this app actually starts receiving webhook events for that WABA. Not fatal if it fails (logged, not surfaced as an error) — the WABA is still connected and usable, just won't get webhooks until retried.
3. Saves to `automation_credentials`: `wa_account_sid = phone_number_id`, `wa_from = waba_id`, `wa_auth_token = META_SYSTEM_USER_TOKEN` (the same shared token for every tenant connected this way — intentional, that's the Tech Provider model), `whatsapp_enabled = true`.
4. No `webhook_registry` entry needed — the existing dispatcher (`/api/webhooks/whatsapp/meta`, see `docs/whatsapp-tech-provider-dispatcher.md`) already matches incoming events against `automation_credentials.wa_from` for this CRM's own tenants, so a freshly-connected WABA is routed correctly the moment this save completes.

## What's intentionally not built yet

- No UI to retry a failed webhook subscription independently (step 2 above) — if it fails, reconnecting (running the flow again) re-attempts it.
- No handling for a tenant *disconnecting* WhatsApp via this flow (the manual "toggle off" + clear fields path still works for that).
- Development-mode tester restriction isn't enforced or explained in-app — a tenant who isn't an added Tester will just see Meta's own popup fail; worth a clearer in-app message once volume increases.

## Verified this session

Backend route and utility module load without errors; the button renders correctly in Channel Setup (screenshot-verified) with the manual fields preserved below it as a fallback. The full live popup → Meta login → WABA selection → callback path was **not** exercised end-to-end in this session (requires a real Facebook session completing Embedded Signup, which isn't something a headless test environment can do) — the first real connection attempt is the true end-to-end test.
