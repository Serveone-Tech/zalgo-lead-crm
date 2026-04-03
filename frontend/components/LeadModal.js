'use client';
import { useState, useEffect } from 'react';

const STAGES = ['New', 'Active', 'Follow-up', 'Booked', 'Closed'];
const PLATFORMS = ['LinkedIn', 'Instagram', 'WhatsApp', 'Email', 'Referral', 'Other'];

export default function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', platform: 'LinkedIn', platform_link: '',
    stage: 'New', last_message: '', follow_up_date: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '',
        platform: lead.platform || 'LinkedIn',
        platform_link: lead.platform_link || '',
        stage: lead.stage || 'New',
        last_message: lead.last_message || '',
        follow_up_date: lead.follow_up_date ? lead.follow_up_date.split('T')[0] : '',
        notes: lead.notes || '',
      });
    }
  }, [lead]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
      }}
    >
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
        borderRadius: 14, padding: '26px 24px', width: '100%', maxWidth: 500,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontFamily: 'var(--font-main)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {lead?.id ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            fontSize: 20, cursor: 'pointer', padding: '2px 6px', borderRadius: 6,
          }}>✕</button>
        </div>

        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Full Name *">
                <input name="name" value={form.name} onChange={handle} placeholder="Lead's full name" required style={inp} />
              </Field>
            </div>
            <Field label="Platform">
              <select name="platform" value={form.platform} onChange={handle} style={inp}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Stage">
              <select name="stage" value={form.stage} onChange={handle} style={inp}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Profile / Platform Link">
                <input name="platform_link" value={form.platform_link} onChange={handle} placeholder="https://linkedin.com/in/..." style={inp} />
              </Field>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Last Message">
                <input name="last_message" value={form.last_message} onChange={handle} placeholder="What was the last thing discussed?" style={inp} />
              </Field>
            </div>
            <Field label="Next Follow-up Date">
              <input name="follow_up_date" type="date" value={form.follow_up_date} onChange={handle} style={inp} />
            </Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Notes">
                <textarea name="notes" value={form.notes} onChange={handle} placeholder="Quick notes about this lead..." rows={3}
                  style={{ ...inp, resize: 'vertical', minHeight: 70 }} />
              </Field>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 18px', borderRadius: 8, background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13,
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              padding: '9px 20px', borderRadius: 8,
              background: saving ? 'var(--bg-hover)' : 'var(--teal)',
              border: 'none', color: '#fff', fontFamily: 'var(--font-main)',
              fontWeight: 600, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving...' : 'Save Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 10, color: 'var(--text-secondary)',
        marginBottom: 5, fontWeight: 500, letterSpacing: '0.05em',
        textTransform: 'uppercase', fontFamily: 'var(--font-main)',
      }}>{label}</label>
      {children}
    </div>
  );
}

const inp = {
  width: '100%', padding: '9px 11px',
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
  outline: 'none',
};
