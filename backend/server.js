const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./db');
const authRoutes       = require('./routes/auth');
const leadsRoutes      = require('./routes/leads');
const customersRoutes  = require('./routes/customers');
const settingsRoutes   = require('./routes/settings');
const automationRoutes = require('./routes/automation');
const superadminRoutes = require('./routes/superadmin');
const plansRoutes      = require('./routes/plans');
const employeesRoutes  = require('./routes/employees');
const stagesRoutes     = require('./routes/stages');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth',       authRoutes);
app.use('/api/leads',      leadsRoutes);
app.use('/api/customers',  customersRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/plans',      plansRoutes);
app.use('/api/employees',  employeesRoutes);
app.use('/api/stages',     stagesRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Zalgo CRM API running on port ${PORT}`));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
