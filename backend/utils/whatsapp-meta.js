// Sends an outbound WhatsApp message via Meta's WhatsApp Cloud API.
// Reuses the automation_credentials columns that used to hold Twilio's
// wa_account_sid/wa_auth_token — repurposed to store Meta's Phone Number ID
// and Access Token respectively, so no schema migration was needed to
// switch providers. wa_from (Twilio's "from" number) is unused for Meta —
// the phone_number_id alone determines the sending number.
async function sendWhatsAppViaMeta(creds, toPhone, message) {
  const phoneNumberId = creds.wa_account_sid;
  const accessToken = creds.wa_auth_token;
  if (!phoneNumberId || !accessToken) {
    throw new Error("Meta WhatsApp credentials not configured");
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: String(toPhone).replace(/\D/g, ""),
      type: "text",
      text: { body: message },
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.error) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(`WhatsApp send failed: ${msg}`);
  }
  return data;
}

// Sending an outbound file is a two-step dance, same shape as receiving
// one in reverse: upload the bytes to Meta's own media store first (which
// hands back a short-lived media id), then reference that id in the
// actual message. `type` is WhatsApp's own message type — image/document/
// audio/video — derived from the file's mime type by the caller.
async function sendWhatsAppMediaViaMeta(creds, toPhone, { buffer, mimeType, filename, type, caption }) {
  const phoneNumberId = creds.wa_account_sid;
  const accessToken = creds.wa_auth_token;
  if (!phoneNumberId || !accessToken) {
    throw new Error("Meta WhatsApp credentials not configured");
  }

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", new Blob([buffer], { type: mimeType }), filename);
  form.append("type", mimeType);

  const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const uploadData = await uploadRes.json().catch(() => null);
  if (!uploadRes.ok || !uploadData?.id) {
    throw new Error(uploadData?.error?.message || "WhatsApp media upload failed");
  }

  const mediaObject = { id: uploadData.id };
  if (caption && (type === "image" || type === "document" || type === "video")) mediaObject.caption = caption;
  if (type === "document") mediaObject.filename = filename;

  const sendRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: String(toPhone).replace(/\D/g, ""),
      type,
      [type]: mediaObject,
    }),
  });
  const sendData = await sendRes.json().catch(() => null);
  if (!sendRes.ok || sendData?.error) {
    const msg = sendData?.error?.message || `HTTP ${sendRes.status}`;
    throw new Error(`WhatsApp media send failed: ${msg}`);
  }
  return sendData;
}

module.exports = { sendWhatsAppViaMeta, sendWhatsAppMediaViaMeta };
