# WhatsApp Meta Tech Provider — Central Webhook Dispatcher

Meta only accepts **one webhook callback URL per App**. When this app (via Embedded Signup) becomes a Meta Tech Provider connecting multiple separate SaaS products' WhatsApp Business Accounts (lead-management, school-erp, erp, lab, washing-erp, lms, ...), every one of those products' WABA events arrives at that single URL — this CRM's backend hosts it and routes ("dispatches") each event to whichever product actually owns the WABA it belongs to.

This is deliberately built inside `zalgo-lead-crm`'s existing backend (Postgres + Express + PM2 already running) rather than as a new standalone service, per an explicit tradeoff: simpler to build and deploy, at the cost of this CRM's uptime becoming a dependency for every connected product's WhatsApp webhook delivery.

## Meta App Dashboard configuration

Under **WhatsApp → Configuration → Webhook**, set:

- **Callback URL**: `https://lead-management.zalgostore.com/api/webhooks/whatsapp/meta`
- **Verify Token**: any secret string you choose — must match the `META_APP_VERIFY_TOKEN` environment variable set on the backend (see below).

This is separate from the *existing* per-tenant webhook URLs (`/api/webhooks/whatsapp/:token`) that tenants who entered Meta credentials manually (Channel Setup, not Embedded Signup) already use — both continue to work side by side; nothing about the manual-entry flow changed.

## Required environment variables (backend `.env`)

```
META_APP_VERIFY_TOKEN=<same string entered in Meta App Dashboard's Verify Token field>
DISPATCHER_REGISTRY_SECRET=<a separate long random secret — shared only with the other products' backends>
```

Neither exists by default — until both are set, `/whatsapp/meta`'s GET handshake always returns 403 and `/registry` always returns 401 (fails closed, not open).

## How routing works

`POST /api/webhooks/whatsapp/meta` loops every `entry[]` in Meta's payload (there can be more than one WABA's events in a single call) and, per entry (keyed by `entry.id`, which is the WABA id):

1. **Checks if it's one of this CRM's own tenants** — `SELECT user_id FROM automation_credentials WHERE wa_from = entry.id`. If found, processed locally with the exact same logic the per-tenant URL route uses (inbound messages, delivery statuses, template status updates) — no registry entry needed for this app's own tenants.
2. **Else checks `webhook_registry`** for a row with that `waba_id`. If found, the entry is forwarded as-is (wrapped back into `{ object, entry: [entry] }`, matching Meta's own webhook shape) via `POST` to that row's `forward_url`, with header `X-Dispatcher-Secret: <that row's forward_secret>` so the receiving product can verify the call genuinely came from this dispatcher.
3. **Else**: logged (`no product registered for WABA <id> — dropped`) and ignored — not an error, just means nobody has registered that WABA yet (e.g. mid-onboarding).

## How another product registers a WABA it owns

Machine-to-machine call, not a logged-in user — authenticated by the shared `DISPATCHER_REGISTRY_SECRET`, not normal JWT auth:

```
POST https://lead-management.zalgostore.com/api/webhooks/registry
Headers: X-Registry-Secret: <DISPATCHER_REGISTRY_SECRET>
Body: {
  "product_key": "school-erp",
  "waba_id": "<the WABA id Meta returned during that product's Embedded Signup>",
  "phone_number_id": "<optional, for reference>",
  "forward_url": "https://school-erp.zalgostore.com/api/whatsapp/webhook",
  "forward_secret": "<a secret school-erp generates itself and checks on every forwarded call>"
}
```

Re-registering the same `waba_id` updates the existing row (upsert) rather than erroring — safe to call again if `forward_url`/`forward_secret` change.

To deregister: `DELETE /api/webhooks/registry/:waba_id` with the same `X-Registry-Secret` header.

## What the receiving product needs to build

Just one endpoint that:
1. Checks the `X-Dispatcher-Secret` header equals the `forward_secret` it registered with.
2. Parses the body the same way any direct Meta WhatsApp Cloud API webhook consumer would (`{ object, entry: [{ id, changes: [{ field, value }] }] }`) — this dispatcher doesn't transform Meta's shape, only re-wraps a single entry.

The receiving product does **not** need Meta's own request signature (`X-Hub-Signature-256`) — authenticity for the forwarded hop rests on the shared `forward_secret` instead, since only this dispatcher has the App Secret needed to verify Meta's original signature.

## Verified this session

Full loop tested locally with a mock receiver: GET handshake (200 + echoed challenge on a matching token, 403 otherwise), registry write/delete (401 without the shared secret, upsert on re-registration), and a full forwarded event — mock receiver correctly received the exact wrapped payload with the right `X-Dispatcher-Secret` header. Test registry rows were deleted afterward; nothing left in the shared DB.

## Not yet done

- No admin UI for viewing/managing `webhook_registry` rows (superadmin panel) — currently API-only, meant to be called by each product's own backend during its own Embedded Signup completion step, not by a human.
- The other five products (school-erp, erp, lab, washing-erp, lms) each still need their own receiving endpoint built — out of scope here since those are separate codebases this session has no access to.
