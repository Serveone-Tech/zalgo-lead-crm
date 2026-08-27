// Registry of supported delivery/courier providers. A tenant can connect
// any number of these (one row per provider type — see delivery_credentials'
// UNIQUE(user_id, provider)) and pick which one to ship a given order with
// in the Order Fulfillment form.
//
// Each entry has:
//  - fields: drives the dynamic Settings form automatically
//  - track(credentials, trackingId): returns { status, location, updated_at, history }
//  - createOrder(credentials, payload): creates the shipment at the courier
//    and returns { awb, note? } — awb may be null if the shipment was
//    created but AWB assignment needs a manual step in the courier's panel
//    (note explains why). Providers with no createOrder (e.g. "generic")
//    are link-out/tracking-only — the order's Delivery Provider dropdown
//    only offers providers that have one.
//
// To add a new provider later: add an entry here. No other code changes.

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
  // full history timeline instead of just the latest hop. `Instructions`
  // carries the human-readable remark (e.g. "Out for delivery", "Consignee
  // Unavailable", "Maximum attempts reached") — `Scan` is usually just a
  // short internal code (e.g. "UD", "PP"), so prefer Instructions first.
  const history = sortHistoryDesc(
    (shipment.Scans || [])
      .map((s) => ({
        status: s.ScanDetail?.Instructions || s.ScanDetail?.Scan || "",
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

// Delhivery's "Create/Manifest" (CMU) API — form-encoded, not JSON body.
// Docs: POST /api/cmu/create.json with `format=json&data=<json-string>`.
async function createOrderDelhivery(credentials, payload) {
  const isCod = payload.paymentType === "cod";
  const shipment = {
    name: payload.customerName,
    add: payload.address,
    pin: payload.pincode,
    city: payload.city || "",
    state: payload.state || "",
    country: "India",
    phone: payload.phone,
    order: `CRM-${payload.orderId}`,
    payment_mode: isCod ? "COD" : "Prepaid",
    cod_amount: isCod ? payload.codAmount || 0 : 0,
    order_date: null,
    total_amount: payload.totalAmount || 0,
    products_desc: (payload.items || []).map((i) => i.name).join(", ").slice(0, 500) || "General goods",
    hsn_code: "",
    seller_add: "",
    seller_name: "",
    seller_inv: "",
    quantity: String((payload.items || []).reduce((s, i) => s + (parseInt(i.quantity) || 1), 0) || 1),
    waybill: "",
    // Delhivery's own documented sample payload only shows shipment_width/
    // shipment_height (no length field) — shipment_length is added
    // defensively in case their API accepts it anyway despite the sample
    // omitting it; unknown fields are typically ignored, not rejected.
    shipment_length: String(payload.lengthCm || 10),
    shipment_width: String(payload.widthCm || 10),
    shipment_height: String(payload.heightCm || 10),
    // Delhivery expects weight in grams.
    weight: String(Math.round((payload.weightKg || 0.5) * 1000)),
    shipping_mode: "Surface",
    address_type: "",
    return_pin: "",
    return_city: "",
    return_phone: "",
    return_add: "",
    return_state: "",
    return_country: "",
  };

  const body = new URLSearchParams();
  body.set("format", "json");
  body.set(
    "data",
    JSON.stringify({
      shipments: [shipment],
      pickup_location: { name: credentials.pickup_location || "" },
    }),
  );

  const res = await fetch("https://track.delhivery.com/api/cmu/create.json", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Token ${credentials.token || ""}`,
    },
    body: body.toString(),
  });
  const data = await res.json().catch(() => null);
  const pkg = data?.packages?.[0];
  if (!res.ok || !data?.success || !pkg?.waybill) {
    const remark = pkg?.remarks?.join?.(", ") || pkg?.remarks || data?.rmk || data?.error || `HTTP ${res.status}`;
    // Include the full raw response too — the short remark alone hasn't
    // been enough to pin down account-specific setup issues (e.g. a
    // pickup-location name that looks right but the backend still can't
    // match), so surfacing everything Delhivery sent back is more useful
    // for diagnosing than guessing further.
    throw new Error(`Delhivery order creation failed: ${remark} | full response: ${JSON.stringify(data).slice(0, 500)}`);
  }
  return { awb: pkg.waybill };
}

// Shiprocket's every API call needs a fresh-ish bearer token from its own
// login endpoint (no API-key auth) — shared by both tracking and order
// creation so the login logic isn't duplicated.
async function getShiprocketToken(credentials) {
  const loginRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });
  const loginData = await loginRes.json().catch(() => null);
  const token = loginData?.token;
  if (!loginRes.ok || !token) {
    // Surface Shiprocket's own message instead of a hardcoded guess — the
    // most common cause of "works on the website, fails here" is that
    // Shiprocket's External API only accepts the PRIMARY account's
    // email/password, not a team/sub-user login that otherwise works fine
    // on shiprocket.in.
    const detail = loginData?.message || (loginData?.errors ? JSON.stringify(loginData.errors) : `HTTP ${loginRes.status}`);
    throw new Error(`Shiprocket login failed: ${detail} (note: the External API only accepts the primary account's email/password, not a team/sub-user login)`);
  }
  return token;
}

async function trackShiprocket(credentials, trackingId) {
  const token = await getShiprocketToken(credentials);

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

  // shipment_status is a numeric internal Shiprocket status code (e.g. 3),
  // not human-readable text — prefer the latest scan activity's own status
  // text, falling back to shipment_track's current_status label, and only
  // resorting to the raw numeric code if nothing readable is available.
  const currentStatusLabel = trackData.shipment_track?.[0]?.current_status;
  return {
    status: latest.activity || latest.status || currentStatusLabel || trackData.shipment_status || "Unknown",
    location: latest.location || "",
    updated_at: latest.date || "",
    history,
  };
}

// Shiprocket needs two calls: create the order (adhoc), then separately
// assign an AWB to the shipment it returns. Weight/dimensions come from the
// order's manual override if the admin set one (Order Fulfillment form),
// else fall back to a conservative fixed box size passed in via payload.
async function createOrderShiprocket(credentials, payload) {
  const token = await getShiprocketToken(credentials);
  const isCod = payload.paymentType === "cod";
  const items =
    payload.items && payload.items.length
      ? payload.items.map((i, idx) => ({
          name: i.name,
          sku: `ITEM-${idx + 1}`,
          units: parseInt(i.quantity) || 1,
          selling_price: parseFloat(i.price) || 0,
        }))
      : [{ name: "Order item", sku: "ITEM-1", units: 1, selling_price: payload.totalAmount || 0 }];

  const now = new Date();
  const orderDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const orderRes = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      order_id: `CRM-${payload.orderId}`,
      order_date: orderDate,
      pickup_location: credentials.pickup_location || "",
      billing_customer_name: payload.customerName || "Customer",
      billing_last_name: "",
      billing_address: payload.address || "",
      billing_city: payload.city || "",
      billing_pincode: payload.pincode || "",
      billing_state: payload.state || "",
      billing_country: "India",
      billing_email: payload.email || "",
      billing_phone: payload.phone || "",
      shipping_is_billing: true,
      order_items: items,
      payment_method: isCod ? "COD" : "Prepaid",
      sub_total: payload.totalAmount || 0,
      length: payload.lengthCm || 10,
      breadth: payload.widthCm || 10,
      height: payload.heightCm || 10,
      weight: payload.weightKg || 0.5,
    }),
  });
  const orderData = await orderRes.json().catch(() => null);
  const shipmentId = orderData?.payload?.shipment_id ?? orderData?.shipment_id;
  if (!orderRes.ok || !shipmentId) {
    const msg = orderData?.message || (orderData?.errors ? JSON.stringify(orderData.errors) : `HTTP ${orderRes.status}`);
    throw new Error(`Shiprocket order creation failed: ${msg}`);
  }

  const awbRes = await fetch("https://apiv2.shiprocket.in/v1/external/courier/assign/awb", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
  const awbData = await awbRes.json().catch(() => null);
  const awb = awbData?.response?.data?.awb_code;
  if (!awb) {
    return { awb: null, note: "Shipment created in Shiprocket but no courier could be auto-assigned — assign one manually in the Shiprocket panel." };
  }
  return { awb };
}

const PROVIDERS = {
  delhivery: {
    label: "Delhivery",
    fields: [
      { key: "token", label: "API Token", type: "password" },
      { key: "pickup_location", label: "Pickup Location Name (as registered with Delhivery)", type: "text" },
    ],
    track: trackDelhivery,
    createOrder: createOrderDelhivery,
  },
  shiprocket: {
    label: "Shiprocket",
    fields: [
      { key: "email", label: "Shiprocket Account Email", type: "text" },
      { key: "password", label: "Shiprocket Account Password", type: "password" },
      { key: "pickup_location", label: "Pickup Location Nickname (as set in Shiprocket)", type: "text" },
    ],
    track: trackShiprocket,
    createOrder: createOrderShiprocket,
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
    // No track()/createOrder() — the frontend just opens url_template with
    // {tracking_id} substituted, since there's no API to call for an
    // arbitrary courier, and this provider is excluded from the order
    // fulfillment form's auto-ship dropdown.
  },
};

module.exports = { PROVIDERS };
