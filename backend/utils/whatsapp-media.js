const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "whatsapp-media");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "audio/ogg": ".ogg",
  "audio/mpeg": ".mp3",
  "audio/aac": ".aac",
  "video/mp4": ".mp4",
};

// Meta doesn't send media inline — a webhook message only carries a media
// id. Resolving it to bytes is a two-step dance: ask the Graph API for a
// short-lived download URL, then fetch that URL (still needs the same
// bearer token) and save it here so it can be served from our own /uploads.
async function downloadWhatsAppMedia(mediaId, accessToken) {
  const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meta = await metaRes.json().catch(() => null);
  if (!metaRes.ok || !meta?.url) {
    throw new Error(meta?.error?.message || "Could not resolve WhatsApp media URL");
  }

  const fileRes = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!fileRes.ok) throw new Error("Could not download WhatsApp media");
  const buffer = Buffer.from(await fileRes.arrayBuffer());

  const ext = EXT_BY_MIME[meta.mime_type] || "";
  const filename = `${crypto.randomBytes(20).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

  return { mediaUrl: `/uploads/whatsapp-media/${filename}`, mimeType: meta.mime_type || "" };
}

module.exports = { downloadWhatsAppMedia, UPLOAD_DIR };
