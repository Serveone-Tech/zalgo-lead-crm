const express = require("express");
const { pool } = require("../db");
const { auth } = require("../middleware/auth");
const { isOwner, hasPermission } = require("../utils/permissions");

const router = express.Router();

// Rows auto-captured from a lead source (Google Ads / Google Sheet) with no
// usable phone number land here instead of the main Leads table, so someone
// can review them and decide whether to keep or discard.
const canView = (req) => isOwner(req) || hasPermission(req, "view_all_leads");

router.get("/", auth, async (req, res) => {
  if (!canView(req)) return res.status(403).json({ error: "Permission denied" });
  try {
    const result = await pool.query(
      "SELECT * FROM pending_leads WHERE user_id=$1 ORDER BY created_at DESC",
      [req.tenantId],
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  if (!canView(req)) return res.status(403).json({ error: "Permission denied" });
  try {
    await pool.query("DELETE FROM pending_leads WHERE id=$1 AND user_id=$2", [
      req.params.id,
      req.tenantId,
    ]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
