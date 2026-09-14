# WhatsApp Template Builder

A professional Meta WhatsApp Business Platform template builder: create, preview, validate, save, edit, duplicate, and submit templates for Meta review — built on top of the CRM's existing WhatsApp Cloud API integration, not a parallel system.

## Architecture

**Reused, not duplicated:**
- Auth/tenant/permission/subscription middleware (`backend/middleware/auth.js`) — same `auth`, `requireSubscription`, `requirePlanFeature("automation")`, `requirePermission("manage_automation")` gate every other WhatsApp route uses.
- The `whatsapp_templates` table (extended, not replaced) and `automation_credentials` (Meta access token/WABA id, unchanged).
- `sendTemplateMessage`, the broadcast module, and the legacy `/api/automation/whatsapp-templates*` routes — all left working for backward compatibility.

**New pieces:**
- `backend/utils/meta-graph.js` — single source of truth for the Graph API version (`GRAPH_API_VERSION` / `GRAPH_BASE`). Every Meta call in the app (`whatsapp-meta.js`, `whatsapp-media.js`, `whatsapp-templates.js`) imports this instead of hardcoding `https://graph.facebook.com/vNN.N`.
- `backend/utils/meta-template-validator.js` — `MetaTemplateValidator`. The single authority for "is this template structurally submittable" (name format, category/language required, header/body/footer/button rules, variable sequencing and sample-value requirements). Exports `validateTemplate()` and `buildMetaComponents()` (the payload builder). The backend copy is authoritative; `frontend/lib/template-validator.js` mirrors the same logic for live UI feedback without a round trip, but the backend always re-validates before submission.
- `backend/routes/whatsapp-templates.js` — the builder's REST API, mounted at `/api/whatsapp-templates`.
- `frontend/app/whatsapp-templates/page.js` — template list/management page.
- `frontend/app/whatsapp-templates/builder/page.js` — the visual builder.
- `frontend/components/whatsapp-templates/*` — the component tree (see below).

## Database changes

Additive only — no existing column was removed or renamed, and the original flat `header_text`/`body_text`/`footer_text`/`buttons` columns are still kept in sync on every save (`flattenForLegacyColumns()` in the route file) so anything still reading them (the legacy automation.js routes) keeps working unmodified.

New columns on `whatsapp_templates`:
- `header_format` (`NONE`/`TEXT`/…) — backfilled for pre-existing rows based on whether `header_text` was non-empty.
- `components` (JSONB) — the canonical structured config the builder reads/writes: `{ header, body, footer, buttons }`, each variable carrying `{ position, name, sample }`.
- `waba_id`, `phone_number_id` — snapshot of which WABA/number a template was actually submitted under.
- `submitted_at`, `approved_at`.

New table `whatsapp_template_submissions` — one row per submit attempt: the exact payload sent, Meta's raw response, HTTP status, and any error code/message. This is what lets a rejection be diagnosed without guessing what was actually sent (the template row itself may have since changed via duplication/editing).

All schema changes live in `backend/db/index.js`'s `initDB()`, applied idempotently on every boot — same pattern as every other table in this app (no separate migration framework).

## Template lifecycle

```
DRAFT --(submit)--> SUBMITTING --(Meta accepts)--> PENDING --> APPROVED
                          |                            |
                          +-----(Meta rejects)------> ERROR/REJECTED
```

- A template is **only** a local draft until the user explicitly clicks **Submit to Meta for Review** — creating/saving a draft never calls Meta.
- Once a template is `pending`/`approved`/`rejected` (i.e. it has a real `meta_template_id`), it can no longer be edited directly (`PUT /:id` returns 409) — Meta doesn't support silently overwriting a submitted template. The user duplicates it instead (`POST /:id/duplicate`), which always starts a fresh `draft` with a collision-safe name (`_copy`, `_copy2`, …) and never copies the Meta id/status.
- If a submission fails, the template falls back to `error` (still editable, not stuck) and the raw Meta error is saved to `whatsapp_template_submissions` — the user's work is never lost.
- **Status sync**: Meta doesn't push template-approval webhooks to this integration by default (see the existing comment in `whatsapp-templates.js`), so status is refreshed on demand via `POST /:id/sync-status` ("Refresh Status" in the list page). Adding push-based sync later means extending `backend/routes/webhooks.js`'s WhatsApp POST handler to also branch on Meta's `message_template_status_update` field.

## Component tree (frontend)

```
app/whatsapp-templates/page.js            — list, filter, search, actions
app/whatsapp-templates/builder/page.js    — orchestrates the builder page

components/whatsapp-templates/
  TemplateBasicSettings.js      — name, category, language
  TemplateHeaderBuilder.js      — header type + text header (media types disabled, see below)
  TemplateBodyBuilder.js        — body text + variable insertion
  TemplateVariableManager.js    — shared by header/body: name+sample per {{n}}
  TemplateFooterBuilder.js      — footer text
  TemplateButtonBuilder.js      — up to 3 buttons, incl. dynamic URL
  WhatsAppTemplatePreview.js    — live WhatsApp-style bubble preview
  MetaTemplateValidationPanel.js
  MetaPayloadDebugView.js       — "Meta Payload" JSON tab, Copy JSON
  MetaSubmissionDialog.js       — confirm-before-submit dialog
  TemplateStatusBadge.js
  shared-styles.js              — shared inline-style tokens
```

The builder page holds one `template` state object (`{ name, category, language, header, body, footer, buttons }`) and passes slices + `onChange` callbacks down — every sub-component is presentational, no component talks to the API directly except the page itself.

## What's NOT built yet (by design, not oversight)

Per the standing rule against faking Meta support: a feature is only in the UI once its actual Meta payload shape has been implemented and validated, not because it "looks good."

- **Media headers (IMAGE/VIDEO/DOCUMENT)**: shown in `TemplateHeaderBuilder` as visibly disabled options with an explanatory tooltip, not silently hidden — the type list is data-driven (`HEADER_TYPES` array with an `enabled` flag), so enabling one later is "upload the media via Meta's resumable upload-session API (`POST /{app-id}/uploads` → `POST /{upload-session-id}`, a new Graph surface this integration doesn't use anywhere yet), store the returned handle, flip `enabled: true`" — not a UI rewrite.
- **Carousel/multi-card templates**: not implemented. Meta's carousel support has specific category/header-type constraints that need verifying against the live API before building — not assumed from the spec.
- **Push-based status sync**: manual "Refresh Status" only (see above).

## Permissions

Reuses the existing `manage_automation` permission (owner/superadmin always pass; sub-accounts need the flag) — the same one that already gates the whole Automation section, including the legacy template routes and Channel Setup. This matches the codebase's existing granularity (one flag per module, e.g. `view_inventory`/`manage_inventory` for Inventory) rather than introducing 8 new fine-grained keys (`whatsapp.templates.view/create/edit/...`) that don't fit the established Team-permissions UI pattern (`frontend/lib/permissions.js`'s `PERMISSION_MODULES` read/write/delete matrix). If finer-grained control is wanted later, add new keys to both `backend/utils/permissions.js` and `frontend/lib/permissions.js` (kept in sync per the comment at the top of the frontend file) and swap the relevant `requirePermission(...)` calls in `whatsapp-templates.js`.

## Broadcast integration

No changes needed to the broadcast module itself — it already reads templates from the same `whatsapp_templates` table filtered to `status='approved'` (`automation.js`'s `POST /broadcast`), so any template built and approved through the new builder is automatically selectable there. `{{1}}` is still always the recipient's name; further `{{n}}` are fixed values supplied once per broadcast (unchanged).

## API endpoints (`/api/whatsapp-templates`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | List (filters: `status`, `category`, `q`) |
| GET | `/:id` | One template |
| GET | `/:id/submissions` | Submission history |
| POST | `/validate` | Validate without persisting |
| POST | `/` | Create draft |
| PUT | `/:id` | Update (only while editable) |
| POST | `/:id/duplicate` | Clone as new draft |
| DELETE | `/:id` | Delete (local + Meta if submitted) |
| POST | `/:id/submit` | Submit to Meta for review |
| POST | `/:id/sync-status` | Refresh status from Meta |

The legacy flat-field routes remain at `/api/automation/whatsapp-templates*`, adapted internally to build the same structured payload — kept for backward compatibility, no longer the primary UI (the Automation page's old "Templates" tab now links to `/whatsapp-templates`).

## Adding a new Meta template component type later

1. Extend `meta-template-validator.js`: add validation rules + extend `buildMetaComponents()` to emit the new component shape.
2. Mirror the same change in `frontend/lib/template-validator.js`.
3. Add/extend the relevant builder component (or a new one) under `frontend/components/whatsapp-templates/`.
4. If it needs its own DB column, add an idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in `backend/db/index.js` (same block as `header_format`/`components`).
5. Verify the exact payload shape against Meta's current docs before wiring it up — never assume/guess a field name.

## Troubleshooting

- **"Add your WhatsApp Business Account ID... first"** on submit → `automation_credentials.wa_from` (WABA id) or `wa_auth_token` isn't set for the tenant — set it under Automation → Channel Setup.
- **Template stuck on `error`** → check `GET /api/whatsapp-templates/:id/submissions` for the raw Meta error message/code; fix the template and re-submit (still a draft, so it's fully editable).
- **Can't edit a template** → it's `pending`/`approved`/`rejected` on Meta already; duplicate it instead.
- **A field isn't in the Meta Payload debug tab as expected** → check `buildMetaComponents()` in `meta-template-validator.js` — that function is the single source of truth for what's actually sent.

## Testing

`backend/scripts/test-template-validator.js` — plain-Node assertions (this project has no Jest/Mocha/Vitest anywhere, so this follows the same ad-hoc script convention already used for verification elsewhere in the codebase) covering: valid template, invalid name, missing category/language/body, non-sequential variables, missing sample values, header/footer variable rules, button count/type limits, URL format validation, dynamic URL example requirement, phone number format. Run with `node backend/scripts/test-template-validator.js`.

Manually verified this session (see conversation history / commit messages): full create → duplicate → update → delete lifecycle against the live shared DB; legacy `/api/automation/whatsapp-templates` routes still function after the `createTemplate()` signature change; cross-tenant access returns 404 (not the other tenant's data) for every row-scoped query pattern (`WHERE id=$1 AND user_id=$2`, consistent with the rest of the codebase).
