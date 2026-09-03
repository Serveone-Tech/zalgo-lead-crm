const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./db');
const { runScheduledTriggers } = require('./utils/scheduled-triggers');
const authRoutes       = require('./routes/auth');
const leadsRoutes      = require('./routes/leads');
const customersRoutes  = require('./routes/customers');
const settingsRoutes   = require('./routes/settings');
const automationRoutes = require('./routes/automation');
const superadminRoutes = require('./routes/superadmin');
const plansRoutes      = require('./routes/plans');
const employeesRoutes  = require('./routes/employees');
const stagesRoutes     = require('./routes/stages');
const orderStagesRoutes = require('./routes/order-stages');
const inventoryRoutes   = require('./routes/inventory');
const webhooksRoutes   = require('./routes/webhooks');
const pendingLeadsRoutes = require('./routes/pending-leads');
const deliveryRoutes   = require('./routes/delivery');
const contactRoutes    = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',       authRoutes);
app.use('/api/leads',      leadsRoutes);
app.use('/api/customers',  customersRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/plans',      plansRoutes);
app.use('/api/employees',  employeesRoutes);
app.use('/api/stages',     stagesRoutes);
app.use('/api/order-stages', orderStagesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/webhooks',   webhooksRoutes);
app.use('/api/pending-leads', pendingLeadsRoutes);
app.use('/api/delivery',   deliveryRoutes);
app.use('/api/contact',    contactRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Zalgo CRM API running on port ${PORT}`));
  // Follow-up/payment-due reminders aren't tied to a single request — check
  // for anything due every 30 minutes (each guarded so it only actually
  // sends once per day per lead/order).
  runScheduledTriggers();
  setInterval(runScheduledTriggers, 30 * 60 * 1000);
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
