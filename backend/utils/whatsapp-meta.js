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

module.exports = { sendWhatsAppViaMeta };
