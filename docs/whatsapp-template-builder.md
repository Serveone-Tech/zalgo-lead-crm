# WhatsApp Template Builder

A professional Meta WhatsApp Business Platform template builder: create, preview, validate, save, edit, duplicate, and submit templates for Meta review — built on top of the CRM's existing WhatsApp Cloud API integration, not a parallel system.

## Architecture

**Reused, not duplicated:**
- Auth/tenant/permission/subscription middleware (`backend/middleware/auth.js`) — same `auth`, `requireSubscription`, `requirePlanFeature("automation")`, `requirePermission("manage_automation")` gate every other WhatsApp route uses.
- The `whatsapp_templates` table (extended, not replaced) and `automation_credentials` (Meta access token/WABA id, unchanged).
- `sendTemplateMessage`, the broadcast module, and the legacy `/api/automation/whatsapp-templates*` routes — all left working for backward compatibility.

**New pieces:**
- `backend/utils/meta-graph.js` — single source of truth for the Graph API version (`GRAPH_API_VERSION` / `GRAPH_BASE`). Every Meta call in the app (`whatsapp-meta.js`, `whatsapp-media.js`, `whatsapp-templates.js`, `meta-media-upload.js`) imports this instead of hardcoding `https://graph.facebook.com/vNN.N`.
- `backend/utils/meta-template-validator.js` — `MetaTemplateValidator`. The single authority for "is this template structurally submittable" (name format, category/language required, header/body/footer/button rules, variable sequencing and sample-value requirements, carousel card rules). Exports `validateTemplate()` and `buildMetaComponents()` (the payload builder). The backend copy is authoritative; `frontend/lib/template-validator.js` mirrors the same logic for live UI feedback without a round trip, but the backend always re-validates before submission.
- `backend/utils/meta-media-upload.js` — Meta's Resumable Upload API (`uploadTemplateHeaderMedia()`), the separate Graph surface template header media examples require (distinct from the simple `/phone_number_id/media` endpoint used for sending messages).
- `backend/middleware/template-media-upload.js` — multer config for template header media uploads (IMAGE/VIDEO/DOCUMENT, per-format size/mime limits), saved under `backend/uploads/whatsapp-template-media/`.
- `backend/routes/whatsapp-templates.js` — the builder's REST API, mounted at `/api/whatsapp-templates`.
- `backend/routes/webhooks.js` — extended (additively) to also process Meta's `message_template_status_update` webhook field for push-based status sync.
- `frontend/app/whatsapp-templates/page.js` — template list/management page.
- `frontend/app/whatsapp-templates/builder/page.js` — the visual builder.
- `frontend/components/whatsapp-templates/*` — the component tree (see below).

## Database changes

Additive only — no existing column was removed or renamed, and the original flat `header_text`/`body_text`/`footer_text`/`buttons` columns are still kept in sync on every save (`flattenForLegacyColumns()` in the route file) so anything still reading them (the legacy automation.js routes) keeps working unmodified.

New columns on `whatsapp_templates`:
- `header_format` (`NONE`/`TEXT`/`IMAGE`/`VIDEO`/`DOCUMENT`) — backfilled for pre-existing rows based on whether `header_text` was non-empty.
- `components` (JSONB) — the canonical structured config the builder reads/writes: `{ header, body, footer, buttons, carousel }`, each variable carrying `{ position, name, sample }`; a media header additionally carries `{ media_handle, media_url, mime_type, file_name }`; `carousel.cards[]` each hold their own `{ header, body, buttons }`.
- `waba_id`, `phone_number_id` — snapshot of which WABA/number a template was actually submitted under.
- `submitted_at`, `approved_at`.

New column on `automation_credentials`: `meta_app_id` — the Facebook App ID needed alongside the existing WABA id/access token for the Resumable Upload API (media headers). Not a secret (App IDs are public), so unlike `wa_auth_token` it's never masked before reaching the frontend. Set under Automation → Channel Setup.

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
- **Status sync**: both push and pull now work. `backend/routes/webhooks.js`'s WhatsApp POST handler additively scans every `entry[].changes[]` for `field === "message_template_status_update"` and updates the matching template's status/rejection_reason/approved_at (matched by `meta_template_id`, falling back to name+language) — this requires the "message_template_status_update" webhook field to actually be ticked on for the app in Meta's App Dashboard (WhatsApp → Configuration → Webhook fields); the webhook URL itself is unchanged, no new URL to register. The manual "Refresh Status" action (`POST /:id/sync-status`) still exists as a fallback/on-demand check since a push isn't guaranteed to arrive.

## Component tree (frontend)

```
app/whatsapp-templates/page.js            — list, filter, search, actions
app/whatsapp-templates/builder/page.js    — orchestrates the builder page

components/whatsapp-templates/
  TemplateBasicSettings.js      — name, category, language
  TemplateHeaderBuilder.js      — header type incl. image/video/document upload
  TemplateBodyBuilder.js        — body text + variable insertion
  TemplateVariableManager.js    — shared by header/body/card body: name+sample per {{n}}
  TemplateFooterBuilder.js      — footer text
  TemplateButtonBuilder.js      — up to 3 buttons, incl. dynamic URL (maxButtons prop reused at 2 for carousel cards)
  TemplateCarouselBuilder.js    — add/duplicate/delete/reorder carousel cards (Marketing only)
  TemplateCardBuilder.js        — one carousel card: image/video header + body + up to 2 buttons
  MediaUploadField.js           — shared upload/preview/replace/remove UI (header + card headers)
  WhatsAppTemplatePreview.js    — live WhatsApp-style bubble preview, incl. media header + carousel strip
  MetaTemplateValidationPanel.js
  MetaPayloadDebugView.js       — "Meta Payload" JSON tab, Copy JSON
  MetaSubmissionDialog.js       — confirm-before-submit dialog
  TemplateStatusBadge.js
  shared-styles.js              — shared inline-style tokens
```

The builder page holds one `template` state object (`{ name, category, language, header, body, footer, buttons, carousel }`) and passes slices + `onChange` callbacks down — every sub-component is presentational, no component talks to the API directly except the page itself (media upload components call `/whatsapp-templates/media/upload` directly since that's a standalone action, not part of template save).

## Media headers (IMAGE/VIDEO/DOCUMENT)

`MediaUploadField` uploads through `POST /whatsapp-templates/media/upload?format=IMAGE|VIDEO|DOCUMENT`, which does two things per file: saves it locally (`backend/uploads/whatsapp-template-media/`, served statically) so the builder can preview/re-edit it, and pushes it through Meta's Resumable Upload API (`uploadTemplateHeaderMedia()` in `meta-media-upload.js`) to get the media **handle** Meta's `HEADER` component `example.header_handle` needs — this is a different value from a media *id* (the one used for sending regular messages) and a different Graph endpoint (`/{app-id}/uploads` + `/{upload-session-id}`, not `/{phone-number-id}/media`). Requires `meta_app_id` + `wa_auth_token` configured under Channel Setup; the route returns a clear error naming exactly which is missing rather than a generic failure.

Per-format limits (enforced both client-side via the file picker's `accept` and server-side via multer + a re-check against `req.file.size`): IMAGE (JPEG/PNG, 5MB), VIDEO (MP4/3GPP, 16MB), DOCUMENT (PDF, 100MB).

## Carousel templates

Marketing-only (`TemplateCarouselBuilder` renders nothing for Utility/Authentication). 2–10 cards, each requiring an IMAGE or VIDEO header (Meta's carousel cards don't support TEXT/NONE headers) plus body text and up to 2 buttons — narrower than the main template's 3. `MetaTemplateValidator` validates every card the same way it validates the main template (sequential variables, required samples, button field shape), then `buildMetaComponents()` appends a `{ type: "CAROUSEL", cards: [{ card_index, components }] }` entry.

**Honesty note carried into the UI itself** (both the builder's own hint text and this doc): this account has never submitted a carousel template before, so while the structure follows Meta's documented format, it hasn't been proven against a live submission the way the rest of this builder has (text/media headers, buttons, dynamic URLs were all exercised end-to-end against the real API surface during development). Verify the result in the Meta Business dashboard after a first real carousel submission.

## Status sync

Both directions are wired: `POST /:id/sync-status` (manual "Refresh Status") pulls on demand, and `backend/routes/webhooks.js` additively handles Meta's `message_template_status_update` webhook field for push-based updates — matched to a local row by `meta_template_id` (falling back to name+language). The push side needs that webhook field enabled for the app in Meta's App Dashboard; nothing else to configure (same webhook URL, no new endpoint).

## What's still not built (by design, not oversight)

- **LIMITED_TIME_OFFER, COPY_CODE, and catalog/flow buttons**: not implemented — narrower, less-documented Meta features not covered by this pass.
- **Multi-language variants UI**: the DB already allows multiple `(name, language)` rows, but there's no dedicated "duplicate into another language" shortcut yet — use ordinary Duplicate + change the language field.

## Permissions

Reuses the existing `manage_automation` permission (owner/superadmin always pass; sub-accounts need the flag) — the same one that already gates the whole Automation section, including the legacy template routes and Channel Setup. This matches the codebase's existing granularity (one flag per module, e.g. `view_inventory`/`manage_inventory` for Inventory) rather than introducing 8 new fine-grained keys (`whatsapp.templates.view/create/edit/...`) that don't fit the established Team-permissions UI pattern (`frontend/lib/permissions.js`'s `PERMISSION_MODULES` read/write/delete matrix). If finer-grained control is wanted later, add new keys to both `backend/utils/permissions.js` and `frontend/lib/permissions.js` (kept in sync per the comment at the top of the frontend file) and swap the relevant `requirePermission(...)` calls in `whatsapp-templates.js`.

## Broadcast integration

Reads templates from the same `whatsapp_templates` table filtered to `status='approved'` (`automation.js`'s `POST /broadcast`), so any template built and approved through the new builder is automatically selectable there — no changes needed on that side.

**Variable mapping**: `{{1}}` is still always the recipient's name (unchanged). For `{{2}}`, `{{3}}`, … the broadcast tab now sends a `variable_mapping` array (one entry per extra variable) instead of a flat list of fixed values — each entry is `{ source: "static"|"phone"|"email", value }`. `source: "static"` uses `value` for every recipient (the old behavior); `source: "phone"`/`"email"` resolves per-recipient from that CRM field, falling back to `value` if the field is blank for that particular recipient. Only `name`/`phone`/`email` are available as field sources because `resolveAudience()` (in `automation.js`) only ever selects those columns from `leads`/`customers` — no other CRM field is currently exposed to a broadcast recipient row, so the mapping UI doesn't offer options that don't actually exist. The backend validates before sending: a template needing N variables must have N-1 mapping entries, and any `static` entry must have a non-empty value, or the whole broadcast is rejected up front rather than partially sending with blank `{{n}}`s. The legacy flat `template_params` array is still accepted as a fallback for any older frontend build.

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
| POST | `/media/upload?format=IMAGE\|VIDEO\|DOCUMENT` | Upload header/card media (local save + Meta handle) |

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

`backend/scripts/test-template-validator.js` — plain-Node assertions (this project has no Jest/Mocha/Vitest anywhere, so this follows the same ad-hoc script convention already used for verification elsewhere in the codebase), 23 cases covering: valid template, invalid name, missing category/language/body, non-sequential variables, missing sample values, header/footer variable rules, button count/type limits, URL format validation, dynamic URL example requirement, phone number format, and carousel rules (non-Marketing category rejected, card count bounds, text-header-on-card rejected, missing card body, valid multi-card carousel). Run with `node backend/scripts/test-template-validator.js`.

Manually verified against the live shared DB this session: full create → duplicate → update → delete lifecycle; legacy `/api/automation/whatsapp-templates` routes still function after the `createTemplate()` signature change; cross-tenant access returns 404 (not the other tenant's data) for every row-scoped query pattern (`WHERE id=$1 AND user_id=$2`, consistent with the rest of the codebase); media upload's credential-check error path cleans up the temp file rather than orphaning it on disk; carousel and media-header UI verified visually via a real headless browser (form fill, live preview reactivity, per-card validation errors, reorder/duplicate/delete). All test rows/files created during verification were deleted afterward — none of this is fixture data left in the shared DB.
