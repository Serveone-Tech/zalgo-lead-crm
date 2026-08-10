// Registry of supported delivery/courier tracking providers. Each tenant
// picks one (in Settings) and stores their own credentials — the platform
// itself never pays for or holds a shared account with any of these.
//
// To add a new provider later: add an entry here with its `fields` (drives
// the Settings form automatically) and a `track()` function that returns
// { status, location, updated_at }. No other code needs to change.

// Couriers don't agree on scan-list ordering, so sort explicitly by parsed
// date (newest first) instead of trusting whatever order the API returned —
// this is what the frontend timeline/popup renders top-to-bottom.
function sortHistoryDesc(history) {
  return [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function trackDelhivery(credentials, trackingId) {
  const url = `https://track.delhivery.com/api/v1/packages/json/?waybill=${encodeURIComponent(trackingId)}&token=${encodeURIComponent(credentials.token || "")}&verbose=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Delhivery API error: HTTP ${res.status}`);
  const data = await res.json();
  const shipment = data?.ShipmentData?.[0]?.Shipment;
  if (!shipment) throw new Error("Tracking ID not found");

  // Delhivery's verbose response includes every scan event (picked up,
  // in-transit, out for delivery, RTO, etc), so the frontend can render a
  // full history timeline instead of just the latest hop.
  const history = sortHistoryDesc(
    (shipment.Scans || [])
      .map((s) => ({
        status: s.ScanDetail?.Scan || s.ScanDetail?.Instructions || "",
        location: s.ScanDetail?.ScannedLocation || "",
        date: s.ScanDetail?.ScanDateTime || s.ScanDetail?.StatusDateTime || "",
      }))
      .filter((h) => h.status || h.date),
  );

  return {
    status: shipment.Status?.Status || "Unknown",
    location: shipment.Status?.StatusLocation || "",
    updated_at: shipment.Status?.StatusDateTime || "",
    history,
  };
}

async function trackShiprocket(credentials, trackingId) {
  const loginRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });
  if (!loginRes.ok) throw new Error("Shiprocket login failed — check email/password");
  const loginData = await loginRes.json();
  const token = loginData?.token;
  if (!token) throw new Error("Shiprocket login failed — check email/password");

  const trackRes = await fetch(
    `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(trackingId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!trackRes.ok) throw new Error(`Shiprocket API error: HTTP ${trackRes.status}`);
  const data = await trackRes.json();
  const trackData = data?.tracking_data;
  if (!trackData || trackData.error) throw new Error("Tracking ID not found");
  const activities = trackData.shipment_track_activities || [];
  const latest = activities[0] || {};

  // shipment_track_activities is already the full scan history — surface
  // all of it instead of only the latest hop.
  const history = sortHistoryDesc(
    activities.map((a) => ({
      status: a.activity || a.status || "",
      location: a.location || "",
      date: a.date || "",
    })),
  );

  return {
    status: trackData.shipment_status || latest.status || "Unknown",
    location: latest.location || "",
    updated_at: latest.date || "",
    history,
  };
}

const PROVIDERS = {
  delhivery: {
    label: "Delhivery",
    fields: [{ key: "token", label: "API Token", type: "password" }],
    track: trackDelhivery,
  },
  shiprocket: {
    label: "Shiprocket",
    fields: [
      { key: "email", label: "Shiprocket Account Email", type: "text" },
      { key: "password", label: "Shiprocket Account Password", type: "password" },
    ],
    track: trackShiprocket,
  },
  generic: {
    label: "Other (link out — no live status)",
    fields: [
      {
        key: "url_template",
        label: "Tracking URL (use {tracking_id} as a placeholder)",
        type: "text",
      },
    ],
    // No track() — the frontend just opens url_template with {tracking_id}
    // substituted, since there's no API to call for an arbitrary courier.
  },
};

module.exports = { PROVIDERS };
