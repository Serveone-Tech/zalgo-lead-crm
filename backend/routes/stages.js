const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { auth } = require('../middleware/auth');

const DEFAULT_STAGES = [
  { name: 'New',       color: '#2f9e6f', sort_order: 0 },
  { name: 'Active',    color: '#00868a', sort_order: 1 },
  { name: 'Follow-up', color: '#b06a00', sort_order: 2 },
  { name: 'Booked',    color: '#2a6fb0', sort_order: 3 },
  { name: 'Converted', color: '#1f8a5c', sort_order: 4 },
  { name: 'Closed',    color: '#6b6b6b', sort_order: 5 },
];

async function seedDefaults(tenantId) {
  const vals = DEFAULT_STAGES.flatMap(s => [s.name, s.color, s.sort_order]);
  const placeholders = DEFAULT_STAGES
    .map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`)
    .join(',');
  await pool.query(
    `INSERT INTO stages (user_id, name, color, sort_order) VALUES ${placeholders}`,
    [tenantId, ...vals]
  );
}

// GET /api/stages
router.get('/', auth, async (req, res) => {
  try {
    let { rows } = await pool.query(
      'SELECT * FROM stages WHERE user_id=$1 ORDER BY sort_order ASC, id ASC',
      [req.tenantId]
    );
    if (rows.length === 0) {
      await seedDefaults(req.tenantId);
      ({ rows } = await pool.query(
        'SELECT * FROM stages WHERE user_id=$1 ORDER BY sort_order ASC, id ASC',
        [req.tenantId]
      ));
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/stages
router.post('/', auth, async (req, res) => {
  if (req.user.parentId) return res.status(403).json({ error: 'Only account owner can manage stages' });
  try {
    const { name, color = '#00868a', sort_order = 99 } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const dup = await pool.query(
      'SELECT id FROM stages WHERE user_id=$1 AND LOWER(name)=LOWER($2)',
      [req.tenantId, name.trim()]
    );
    if (dup.rows.length > 0) return res.status(400).json({ error: 'A stage with this name already exists' });
    const { rows } = await pool.query(
      'INSERT INTO stages (user_id, name, color, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.tenantId, name.trim(), color, sort_order]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/stages/:id
router.put('/:id', auth, async (req, res) => {
  if (req.user.parentId) return res.status(403).json({ error: 'Only account owner can manage stages' });
  try {
    const { name, color, sort_order } = req.body;
    if (name !== undefined) {
      const dup = await pool.query(
        'SELECT id FROM stages WHERE user_id=$1 AND LOWER(name)=LOWER($2) AND id<>$3',
        [req.tenantId, name.trim(), req.params.id]
      );
      if (dup.rows.length > 0) return res.status(400).json({ error: 'A stage with this name already exists' });
    }
    const { rows } = await pool.query(
      `UPDATE stages SET
         name       = COALESCE($1, name),
         color      = COALESCE($2, color),
         sort_order = COALESCE($3, sort_order)
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [name?.trim() ?? null, color ?? null, sort_order ?? null, req.params.id, req.tenantId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Stage not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/stages/:id
router.delete('/:id', auth, async (req, res) => {
  if (req.user.parentId) return res.status(403).json({ error: 'Only account owner can manage stages' });
  try {
    const count = await pool.query('SELECT COUNT(*) FROM stages WHERE user_id=$1', [req.tenantId]);
    if (parseInt(count.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last remaining stage' });
    }
    const stageRow = await pool.query(
      'SELECT name FROM stages WHERE id=$1 AND user_id=$2',
      [req.params.id, req.tenantId]
    );
    if (stageRow.rows.length === 0) return res.status(404).json({ error: 'Stage not found' });
    const stageName = stageRow.rows[0].name;
    const leadsUsing = await pool.query(
      'SELECT COUNT(*) FROM leads WHERE user_id=$1 AND stage=$2',
      [req.tenantId, stageName]
    );
    const leadsCount = parseInt(leadsUsing.rows[0].count);
    if (leadsCount > 0) {
      return res.status(400).json({
        error: `${leadsCount} lead${leadsCount !== 1 ? 's' : ''} ${leadsCount !== 1 ? 'are' : 'is'} using this stage. Move them to another stage first.`
      });
    }
    await pool.query('DELETE FROM stages WHERE id=$1 AND user_id=$2', [req.params.id, req.tenantId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
