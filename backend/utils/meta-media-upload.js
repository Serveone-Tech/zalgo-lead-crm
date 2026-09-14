// Meta's Resumable Upload API — the flow required for WhatsApp template
// header media (image/video/document *examples* submitted alongside a
// template for Meta's review). This is a different, separate Graph API
// surface from the simple `/phone_number_id/media` endpoint used for
// actually *sending* a media message (see whatsapp-meta.js) — a template's
// header media has to go through an app-scoped upload session instead.
//
// Two-step dance:
//   1. Start a session against the Meta App (not the phone number):
//      POST /{app-id}/uploads?file_length=&file_type=&access_token=
//      -> { id: "upload:XYZ..." }
//   2. Push the file's bytes to that session:
//      POST /{upload_session_id}  (Authorization: OAuth {token}, file_offset: 0)
//      -> { h: "<media handle>" }
// The returned handle (`h`) is what goes into the template's HEADER
// component as `example.header_handle` — not a URL, not a media id from
// the messaging API.

const { GRAPH_BASE } = require("./meta-graph");

async function uploadTemplateHeaderMedia(appId, accessToken, { buffer, mimeType }) {
  if (!appId) throw new Error("Meta App ID not configured — add it under Automation → Channel Setup to use media headers");

  const startRes = await fetch(
    `${GRAPH_BASE}/${appId}/uploads?file_length=${buffer.length}&file_type=${encodeURIComponent(mimeType)}&access_token=${encodeURIComponent(accessToken)}`,
    { method: "POST" },
  );
  const startData = await startRes.json().catch(() => null);
  if (!startRes.ok || !startData?.id) {
    throw new Error(startData?.error?.message || "Could not start Meta upload session");
  }

  const uploadRes = await fetch(`${GRAPH_BASE}/${startData.id}`, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${accessToken}`,
      file_offset: "0",
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  });
  const uploadData = await uploadRes.json().catch(() => null);
  if (!uploadRes.ok || !uploadData?.h) {
    throw new Error(uploadData?.error?.message || "Meta rejected the media upload");
  }
  return uploadData.h; // the media "handle" referenced in the template payload
}

module.exports = { uploadTemplateHeaderMedia };
