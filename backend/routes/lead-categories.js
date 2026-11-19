const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { auth, requireSubscription, requirePlanFeature } = require('../middleware/auth');

// GET /api/lead-categories — any tenant member (owner or employee) can read
// the list, since the whole point is letting employees see what a lead is
// about. Only the owner can create/edit/delete (see the parentId checks
// below, same convention as /stages).
router.get('/', auth, requireSubscription, requirePlanFeature("core"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM lead_categories WHERE user_id=$1 ORDER BY name ASC',
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lead-categories
router.post('/', auth, requireSubscription, requirePlanFeature("core"), async (req, res) => {
  if (req.user.parentId) return res.status(403).json({ error: 'Only account owner can manage categories' });
  try {
    const { name, color = '#00868a' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const dup = await pool.query(
      'SELECT id FROM lead_categories WHERE user_id=$1 AND LOWER(name)=LOWER($2)',
      [req.tenantId, name.trim()]
    );
    if (dup.rows.length > 0) return res.status(400).json({ error: 'A category with this name already exists' });
    const { rows } = await pool.query(
      'INSERT INTO lead_categories (user_id, name, color) VALUES ($1,$2,$3) RETURNING *',
      [req.tenantId, name.trim(), color]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/lead-categories/:id
router.put('/:id', auth, requireSubscription, requirePlanFeature("core"), async (req, res) => {
  if (req.user.parentId) return res.status(403).json({ error: 'Only account owner can manage categories' });
  try {
    const { name, color } = req.body;
    if (name !== undefined) {
      const dup = await pool.query(
        'SELECT id FROM lead_categories WHERE user_id=$1 AND LOWER(name)=LOWER($2) AND id<>$3',
        [req.tenantId, name.trim(), req.params.id]
      );
      if (dup.rows.length > 0) return res.status(400).json({ error: 'A category with this name already exists' });
    }
    const { rows } = await pool.query(
      `UPDATE lead_categories SET
         name  = COALESCE($1, name),
         color = COALESCE($2, color)
       WHERE id=$3 AND user_id=$4 RETURNING *`,
      [name?.trim() ?? null, color ?? null, req.params.id, req.tenantId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lead-categories/:id — unlike a Stage, a category isn't load-
// bearing for the pipeline, so leads using it are simply left uncategorised
// (ON DELETE SET NULL on leads.category_id) instead of blocking the delete.
router.delete('/:id', auth, requireSubscription, requirePlanFeature("core"), async (req, res) => {
  if (req.user.parentId) return res.status(403).json({ error: 'Only account owner can manage categories' });
  try {
    const result = await pool.query(
      'DELETE FROM lead_categories WHERE id=$1 AND user_id=$2',
      [req.params.id, req.tenantId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
