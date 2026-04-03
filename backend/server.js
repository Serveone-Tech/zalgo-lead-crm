const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Zalgo CRM API' }));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Zalgo CRM API running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
