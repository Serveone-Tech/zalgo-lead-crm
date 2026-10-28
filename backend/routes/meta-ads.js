const express = require("express");
const { pool } = require("../db");
const { auth, requirePermission, requireSubscription, requirePlanFeature } = require("../middleware/auth");
const { exchangeCodeForUserToken, listManagedPages, subscribeAppToPage } = require("../utils/meta-leadgen");

const router = express.Router();

// ── GET current connection status ──────────────────────────────────
router.get("/status", auth, requireSubscription, requirePlanFeature("automation"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT page_id, page_name, enabled, updated_at FROM meta_ads_credentials WHERE user_id=$1",
      [req.tenantId],
    );
    res.json(rows[0] || null);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST start connecting a Facebook Page ───────────────────────────
// `code` is the one-time authorization code from FB.login()'s callback,
// requested with pages_show_list + leads_retrieval + pages_manage_ads +
// pages_read_engagement scopes. Exchanges it for a user token, then lists
// every Page that user administers. Most businesses have exactly one Page,
// so that case connects immediately; otherwise the frontend shows a picker
// and calls /connect-page with the chosen one.
router.post("/connect", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  const { code } = req.body;
  if (!code?.trim()) return res.status(400).json({ error: "code is required" });

  try {
    const userToken = await exchangeCodeForUserToken(code.trim());
    const pages = await listManagedPages(userToken);

    if (pages.length === 0) {
      return res.status(400).json({ error: "No Facebook Pages found for this account — this login needs to be a Page admin to connect lead ads." });
    }
    if (pages.length > 1) {
      // Let the frontend show a picker; each page already carries its own
      // access_token from /me/accounts, so no extra round-trip is needed
      // once the user picks one — see /connect-page below.
      return res.json({ needsSelection: true, pages: pages.map((p) => ({ id: p.id, name: p.name, access_token: p.access_token })) });
    }

    const page = pages[0];
    await finalizeConnection(req.tenantId, page);
    res.json({ success: true, page_name: page.name });
  } catch (e) {
    console.error("Facebook Page connect failed:", e.message);
    res.status(400).json({ error: e.message || "Could not connect this Facebook Page" });
  }
});

// ── POST finish connecting, after the user picked a Page ────────────
router.post("/connect-page", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  const { id, name, access_token } = req.body || {};
  if (!id?.trim() || !access_token?.trim()) {
    return res.status(400).json({ error: "id and access_token are required" });
  }
  try {
    await finalizeConnection(req.tenantId, { id: id.trim(), name: name || "", access_token: access_token.trim() });
    res.json({ success: true, page_name: name || "" });
  } catch (e) {
    console.error("Facebook Page connect (selection) failed:", e.message);
    res.status(400).json({ error: e.message || "Could not connect this Facebook Page" });
  }
});

async function finalizeConnection(tenantId, page) {
  await subscribeAppToPage(page.id, page.access_token);
  await pool.query(
    `INSERT INTO meta_ads_credentials (user_id, page_id, page_name, page_access_token, enabled, updated_at)
     VALUES ($1,$2,$3,$4,true,NOW())
     ON CONFLICT (user_id) DO UPDATE SET page_id=$2, page_name=$3, page_access_token=$4, enabled=true, updated_at=NOW()`,
    [tenantId, page.id, page.name || "", page.access_token],
  );
}

// ── PUT toggle enabled/disabled without disconnecting ───────────────
router.put("/enabled", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  try {
    await pool.query(
      "UPDATE meta_ads_credentials SET enabled=$2, updated_at=NOW() WHERE user_id=$1",
      [req.tenantId, !!req.body?.enabled],
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE disconnect this Page ──────────────────────────────────────
router.delete("/", auth, requireSubscription, requirePlanFeature("automation"), requirePermission("manage_automation"), async (req, res) => {
  try {
    await pool.query("DELETE FROM meta_ads_credentials WHERE user_id=$1", [req.tenantId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
