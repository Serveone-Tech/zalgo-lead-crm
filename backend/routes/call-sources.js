const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { pool } = require('../db');
const { auth, requireSubscription, requirePlanFeature, requirePermission } = require('../middleware/auth');

function webhookBaseUrl(req) {
  return process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
}
function webhookUrl(req, token) {
  return `${webhookBaseUrl(req)}/api/webhooks/call/${token}`;
}

// GET /api/call-sources — one row per phone number the tenant has wired up
// through a call-tracking app, each with its own webhook URL.
router.get('/', auth, requireSubscription, requirePlanFeature('lead_sources'), requirePermission('manage_automation'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cs.*, lc.name AS category_name, lc.color AS category_color
       FROM call_sources cs
       LEFT JOIN lead_categories lc ON lc.id = cs.category_id
       WHERE cs.user_id=$1 ORDER BY cs.created_at ASC`,
      [req.tenantId],
    );
    res.json(rows.map((r) => ({ ...r, webhook_url: webhookUrl(req, r.webhook_token) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/call-sources — add a new number
router.post('/', auth, requireSubscription, requirePlanFeature('lead_sources'), requirePermission('manage_automation'), async (req, res) => {
  try {
    const { label, phone_number, category_id } = req.body;
    if (!label?.trim()) return res.status(400).json({ error: 'Label is required' });
    const token = crypto.randomBytes(24).toString('hex');
    const { rows } = await pool.query(
      `INSERT INTO call_sources (user_id, label, phone_number, category_id, webhook_token)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.tenantId, label.trim(), phone_number?.trim() || '', category_id || null, token],
    );
    res.json({ ...rows[0], webhook_url: webhookUrl(req, token) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/call-sources/:id
router.put('/:id', auth, requireSubscription, requirePlanFeature('lead_sources'), requirePermission('manage_automation'), async (req, res) => {
  try {
    const { label, phone_number, category_id } = req.body;
    if (label !== undefined && !label.trim()) return res.status(400).json({ error: 'Label is required' });
    const { rows } = await pool.query(
      `UPDATE call_sources SET
         label        = COALESCE($1, label),
         phone_number = COALESCE($2, phone_number),
         category_id  = $3
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [label?.trim() ?? null, phone_number?.trim() ?? null, category_id || null, req.params.id, req.tenantId],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ...rows[0], webhook_url: webhookUrl(req, rows[0].webhook_token) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/call-sources/:id/regenerate — invalidates the old URL for this
// number specifically, without touching any other registered number.
router.post('/:id/regenerate', auth, requireSubscription, requirePlanFeature('lead_sources'), requirePermission('manage_automation'), async (req, res) => {
  try {
    const token = crypto.randomBytes(24).toString('hex');
    const { rows } = await pool.query(
      `UPDATE call_sources SET webhook_token=$1 WHERE id=$2 AND user_id=$3 RETURNING *`,
      [token, req.params.id, req.tenantId],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ...rows[0], webhook_url: webhookUrl(req, token) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/call-sources/:id
router.delete('/:id', auth, requireSubscription, requirePlanFeature('lead_sources'), requirePermission('manage_automation'), async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM call_sources WHERE id=$1 AND user_id=$2', [req.params.id, req.tenantId]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
