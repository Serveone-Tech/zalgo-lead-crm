const { pool } = require("../db");
const { fireTrigger } = require("./automation-trigger");

// Runs periodically (see server.js) to fire the two automation triggers
// that aren't tied to a single request — "Follow-up Due Today" and the
// COD payment due/overdue pair. Each guarded by a once-per-calendar-day
// column so re-running this on an interval doesn't re-send the same
// reminder every time it ticks.
async function runScheduledTriggers() {
  try {
    const followups = await pool.query(`
      SELECT id, user_id, name, phone, email
      FROM leads
      WHERE follow_up_date::date = CURRENT_DATE
        AND stage NOT IN ('Closed','Lost','Converted')
        AND (followup_reminder_sent_date IS NULL OR followup_reminder_sent_date < CURRENT_DATE)
    `);
    for (const lead of followups.rows) {
      await fireTrigger("follow_up_due", lead.user_id, { name: lead.name, phone: lead.phone, email: lead.email });
      await pool.query("UPDATE leads SET followup_reminder_sent_date=CURRENT_DATE WHERE id=$1", [lead.id]);
    }
  } catch (e) {
    console.error("Scheduled follow_up_due check failed:", e.message);
  }

  try {
    // Only COD orders can have a balance still owed; a stage flagged
    // excludes_dues (e.g. Cancelled) means the sale isn't happening, same
    // rule the Customers page's "Pending Dues" figure already follows.
    const orders = await pool.query(`
      SELECT co.id, co.user_id, co.amount, co.advance_paid, co.next_due_date,
             co.payment_due_reminder_sent_date, co.payment_overdue_reminder_sent_date,
             c.name, c.phone, c.email
      FROM customer_orders co
      JOIN customers c ON c.id = co.customer_id
      LEFT JOIN order_stages os ON os.user_id = co.user_id AND os.name = co.stage
      WHERE co.deleted_at IS NULL AND co.payment_type = 'cod'
        AND NOT COALESCE(os.excludes_dues, false)
        AND co.next_due_date IS NOT NULL
        AND (co.amount - COALESCE(co.advance_paid, 0)) > 0
    `);
    const today = new Date().toISOString().slice(0, 10);
    for (const o of orders.rows) {
      const dueDate = o.next_due_date ? String(o.next_due_date).slice(0, 10) : null;
      if (!dueDate) continue;
      const balance = parseFloat(o.amount) - parseFloat(o.advance_paid || 0);
      const dueSent = o.payment_due_reminder_sent_date ? String(o.payment_due_reminder_sent_date).slice(0, 10) : null;
      const overdueSent = o.payment_overdue_reminder_sent_date ? String(o.payment_overdue_reminder_sent_date).slice(0, 10) : null;

      if (dueDate === today && dueSent !== today) {
        await fireTrigger("payment_due", o.user_id, { name: o.name, phone: o.phone, email: o.email, amount: balance, due_date: dueDate });
        await pool.query("UPDATE customer_orders SET payment_due_reminder_sent_date=CURRENT_DATE WHERE id=$1", [o.id]);
      } else if (dueDate < today && overdueSent !== today) {
        await fireTrigger("payment_overdue", o.user_id, { name: o.name, phone: o.phone, email: o.email, amount: balance, due_date: dueDate });
        await pool.query("UPDATE customer_orders SET payment_overdue_reminder_sent_date=CURRENT_DATE WHERE id=$1", [o.id]);
      }
    }
  } catch (e) {
    console.error("Scheduled payment_due/overdue check failed:", e.message);
  }
}

module.exports = { runScheduledTriggers };
