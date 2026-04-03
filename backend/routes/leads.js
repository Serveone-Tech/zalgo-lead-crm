const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET all leads for user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET overdue leads
router.get('/overdue', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `SELECT * FROM leads 
       WHERE user_id = $1 AND follow_up_date < $2 AND stage != 'Closed'
       ORDER BY follow_up_date ASC`,
      [req.userId, today]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [total, active, booked, overdue, followup] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM leads WHERE user_id = $1', [req.userId]),
      pool.query("SELECT COUNT(*) FROM leads WHERE user_id = $1 AND stage = 'Active'", [req.userId]),
      pool.query("SELECT COUNT(*) FROM leads WHERE user_id = $1 AND stage = 'Booked'", [req.userId]),
      pool.query("SELECT COUNT(*) FROM leads WHERE user_id = $1 AND follow_up_date < $2 AND stage != 'Closed'", [req.userId, today]),
      pool.query("SELECT COUNT(*) FROM leads WHERE user_id = $1 AND follow_up_date = $2", [req.userId, today]),
    ]);
    res.json({
      total: parseInt(total.rows[0].count),
      active: parseInt(active.rows[0].count),
      booked: parseInt(booked.rows[0].count),
      overdue: parseInt(overdue.rows[0].count),
      followup_today: parseInt(followup.rows[0].count),
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create lead
router.post('/', auth, async (req, res) => {
  const { name, platform, platform_link, stage, last_message, follow_up_date, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const result = await pool.query(
      `INSERT INTO leads (user_id, name, platform, platform_link, stage, last_message, follow_up_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.userId, name, platform || 'LinkedIn', platform_link || '', stage || 'New',
       last_message || '', follow_up_date || null, notes || '']
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update lead
router.put('/:id', auth, async (req, res) => {
  const { name, platform, platform_link, stage, last_message, follow_up_date, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE leads SET name=$1, platform=$2, platform_link=$3, stage=$4,
       last_message=$5, follow_up_date=$6, notes=$7, updated_at=NOW()
       WHERE id=$8 AND user_id=$9 RETURNING *`,
      [name, platform, platform_link, stage, last_message,
       follow_up_date || null, notes, req.params.id, req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Lead not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE lead
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM leads WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
