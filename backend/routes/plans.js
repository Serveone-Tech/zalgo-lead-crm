const express = require('express');
const { pool } = require('../db');
const router = express.Router();

// Public plans — accessible without login
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM plans WHERE is_active=true ORDER BY sort_order ASC'
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
