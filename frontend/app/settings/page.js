'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Pencil, Trash2, Plus, GripVertical, Check, X } from 'lucide-react';

const COLOR_PALETTE = [
  '#2f9e6f', '#00868a', '#b06a00', '#2a6fb0',
  '#7b5ea7', '#c8372f', '#6b6b6b', '#b0548c',
  '#3a8fd9', '#e06b3f', '#1e7d5c', '#8a6d00',
];

const TABS = [
  { key: 'general',  label: 'General' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'currency', label: 'Currency' },
  { key: 'security', label: 'Security' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab]      = useState('general');
  const [currencies, setCurrencies]    = useState([]);
  const [settings, setSettings]        = useState({ currency: 'INR', currency_symbol: '₹', institute_name: '' });
  const [loading, setLoading]          = useState(true);
  const [saving, setSaving]            = useState(false);
  const [saved, setSaved]              = useState(false);
  const [user, setUser]                = useState(null);

  // Stages
  const [stages, setStages]            = useState([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [editingStage, setEditingStage]   = useState(null);
  const [newStage, setNewStage]           = useState({ name: '', color: '#00868a' });
  const [addingStage, setAddingStage]     = useState(false);
  const [stageError, setStageError]       = useState('');
  const [stageSaving, setStageSaving]     = useState(false);

  // Change password
  const [pwForm, setPwForm]     = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError]   = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('crm_token')) { router.push('/login'); return; }
    const u = localStorage.getItem('crm_user');
    if (u) setUser(JSON.parse(u));
    loadAll();
    loadStages();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [curRes, setRes] = await Promise.all([
        api.get('/settings/currencies'),
        api.get('/settings'),
      ]);
      setCurrencies(curRes.data);
      setSettings({
        currency: setRes.data.currency || 'INR',
        currency_symbol: setRes.data.currency_symbol || '₹',
        institute_name: setRes.data.institute_name || '',
      });
      localStorage.setItem('crm_settings', JSON.stringify(setRes.data));
    } catch {}
    setLoading(false);
  };

  const loadStages = async () => {
    setStagesLoading(true);
    try {
      const { data } = await api.get('/stages');
      setStages(data);
    } catch {}
    setStagesLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/settings', settings);
      localStorage.setItem('crm_settings', JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  };

  // ── Stage CRUD ──────────────────────────────────────────────────
  const startEditStage = (s) => { setEditingStage({ id: s.id, name: s.name, color: s.color }); setStageError(''); };
  const cancelEdit = () => { setEditingStage(null); setStageError(''); };
  const cancelAdd  = () => { setAddingStage(false); setNewStage({ name: '', color: '#00868a' }); setStageError(''); };

  const saveEditStage = async () => {
    if (!editingStage.name.trim()) { setStageError('Name is required'); return; }
    setStageSaving(true); setStageError('');
    try {
      await api.put(`/stages/${editingStage.id}`, { name: editingStage.name.trim(), color: editingStage.color });
      setEditingStage(null);
      await loadStages();
    } catch (err) { setStageError(err.response?.data?.error || 'Failed to save'); }
    setStageSaving(false);
  };

  const saveNewStage = async () => {
    if (!newStage.name.trim()) { setStageError('Name is required'); return; }
    setStageSaving(true); setStageError('');
    try {
      await api.post('/stages', { name: newStage.name.trim(), color: newStage.color, sort_order: stages.length });
      setAddingStage(false);
      setNewStage({ name: '', color: '#00868a' });
      await loadStages();
    } catch (err) { setStageError(err.response?.data?.error || 'Failed to save'); }
    setStageSaving(false);
  };

  const deleteStage = async (s) => {
    if (!confirm(`Delete stage "${s.name}"? Leads using this stage must be moved first.`)) return;
    setStageError('');
    try {
      await api.delete(`/stages/${s.id}`);
      await loadStages();
    } catch (err) { setStageError(err.response?.data?.error || 'Cannot delete this stage'); }
  };

  // ── Change Password ─────────────────────────────────────────────
  const changePassword = async () => {
    setPwError('');
    if (!pwForm.old_password || !pwForm.new_password || !pwForm.confirm_password) {
      setPwError('All fields are required'); return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match'); return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError('New password must be at least 6 characters'); return;
    }
    setPwSaving(true);
    try {
      await api.post('/settings/change-password', {
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      });
      setPwSuccess(true);
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) { setPwError(err.response?.data?.error || 'Failed to change password'); }
    setPwSaving(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading...</div>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-main)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Manage your app preferences and account settings</p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 2,
        background: 'var(--bg-surface)', borderRadius: 10, padding: 4,
        marginBottom: 24, width: 'fit-content',
        border: '1px solid var(--border)',
      }}>
        {TABS.map(t => {
          const active = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '7px 20px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-main)', fontWeight: active ? 700 : 500,
              fontSize: 13,
              background: active ? 'var(--teal)' : 'transparent',
              color: active ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: General ─────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div>
          <Card title="Institute / Business Info">
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Institute / Business Name</label>
              <input
                value={settings.institute_name}
                onChange={e => setSettings(s => ({ ...s, institute_name: e.target.value }))}
                placeholder="e.g. Zalgo EduTech"
                style={inp}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                This name will be used in automated messages sent to leads and students.
              </div>
            </div>
          </Card>

          {user && (
            <Card title="Account Info">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <InfoBox label="Name" value={user.name} />
                <InfoBox label="Email" value={user.email} />
                <InfoBox label="Role" value={user.role || '—'} />
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <SaveBtn saving={saving} saved={saved} onClick={save} />
          </div>
        </div>
      )}

      {/* ── TAB: Pipeline ────────────────────────────────────────── */}
      {activeTab === 'pipeline' && (
        <Card title="Pipeline Stages">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Customise the stages in your lead pipeline. Click pencil to edit name or colour, trash to delete.
          </p>

          {stageError && <ErrorBox msg={stageError} />}

          {stagesLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>Loading stages…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stages.map(s => {
                const isEditing = editingStage?.id === s.id;
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    <GripVertical size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: isEditing ? editingStage.color : s.color,
                      flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)',
                    }} />

                    {isEditing ? (
                      <>
                        <input
                          value={editingStage.name}
                          onChange={e => setEditingStage(es => ({ ...es, name: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditStage(); if (e.key === 'Escape') cancelEdit(); }}
                          autoFocus
                          style={{ ...inp, flex: 1, padding: '5px 9px', fontSize: 13 }}
                        />
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          {COLOR_PALETTE.map(c => (
                            <button key={c} onClick={() => setEditingStage(es => ({ ...es, color: c }))} title={c} style={{
                              width: 18, height: 18, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                              outline: editingStage.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2, flexShrink: 0,
                            }} />
                          ))}
                        </div>
                        <button onClick={saveEditStage} disabled={stageSaving} title="Save" style={iconBtn('var(--success)')}><Check size={14} /></button>
                        <button onClick={cancelEdit} title="Cancel" style={iconBtn('var(--text-muted)')}><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-main)', color: 'var(--text-primary)' }}>
                          {s.name}
                        </span>
                        <span style={{
                          fontSize: 10, color: s.color, background: s.color + '22',
                          borderRadius: 10, padding: '2px 8px', fontWeight: 700, fontFamily: 'var(--font-main)',
                        }}>Stage</span>
                        <button onClick={() => startEditStage(s)} title="Edit" style={iconBtn('var(--teal)')}><Pencil size={13} /></button>
                        <button onClick={() => deleteStage(s)} title="Delete" style={iconBtn('var(--danger)')}><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                );
              })}

              {addingStage ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--bg-surface)', border: '1px solid var(--teal)',
                  borderRadius: 10, padding: '10px 14px',
                }}>
                  <Plus size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: newStage.color, flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' }} />
                  <input
                    value={newStage.name}
                    onChange={e => setNewStage(ns => ({ ...ns, name: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') saveNewStage(); if (e.key === 'Escape') cancelAdd(); }}
                    placeholder="Stage name…"
                    autoFocus
                    style={{ ...inp, flex: 1, padding: '5px 9px', fontSize: 13 }}
                  />
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {COLOR_PALETTE.map(c => (
                      <button key={c} onClick={() => setNewStage(ns => ({ ...ns, color: c }))} title={c} style={{
                        width: 18, height: 18, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                        outline: newStage.color === c ? `2px solid ${c}` : 'none', outlineOffset: 2, flexShrink: 0,
                      }} />
                    ))}
                  </div>
                  <button onClick={saveNewStage} disabled={stageSaving} title="Add" style={iconBtn('var(--success)')}><Check size={14} /></button>
                  <button onClick={cancelAdd} title="Cancel" style={iconBtn('var(--text-muted)')}><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => { setAddingStage(true); setStageError(''); }} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px',
                  background: 'transparent', border: '1px dashed var(--border)',
                  borderRadius: 10, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'var(--font-main)', fontWeight: 500, width: '100%',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Plus size={14} /> Add Stage
                </button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── TAB: Currency ────────────────────────────────────────── */}
      {activeTab === 'currency' && (
        <div>
          <Card title="Currency">
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Select the currency used across the app — fees, payments, and all monetary values will display in this currency.
            </p>

            <div style={{
              marginBottom: 16, padding: '12px 16px',
              background: 'rgba(0,134,138,0.08)', border: '1px solid rgba(0,134,138,0.25)',
              borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 24 }}>{settings.currency_symbol}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-main)', fontWeight: 700, color: 'var(--teal-light)', fontSize: 14 }}>
                  {currencies.find(c => c.code === settings.currency)?.name || settings.currency}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  Symbol: {settings.currency_symbol} &nbsp;•&nbsp; Code: {settings.currency}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
              {currencies.map(cur => {
                const selected = cur.code === settings.currency;
                return (
                  <button key={cur.code} onClick={() => setSettings(s => ({ ...s, currency: cur.code, currency_symbol: cur.symbol }))} style={{
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${selected ? 'var(--teal)' : 'var(--border)'}`,
                    background: selected ? 'var(--teal-dim)' : 'var(--bg-surface)',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-main)', fontWeight: 700, fontSize: 16, color: selected ? 'var(--teal-light)' : 'var(--text-primary)', marginBottom: 2 }}>
                          {cur.symbol} {cur.code}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cur.name}</div>
                      </div>
                      {selected && (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <SaveBtn saving={saving} saved={saved} onClick={save} />
          </div>
        </div>
      )}

      {/* ── TAB: Security ────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <Card title="Change Password">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Enter your current password, then set a new one (minimum 6 characters).
          </p>

          {pwError && <ErrorBox msg={pwError} />}
          {pwSuccess && (
            <div style={{
              background: 'rgba(31,138,92,0.12)', border: '1px solid var(--success)',
              borderRadius: 8, padding: '9px 13px', marginBottom: 14,
              color: 'var(--success)', fontSize: 12, fontWeight: 600,
            }}>
              Password changed successfully!
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Current Password</label>
              <input type="password" value={pwForm.old_password}
                onChange={e => setPwForm(f => ({ ...f, old_password: e.target.value }))}
                placeholder="Enter current password" style={inp} />
            </div>
            <div>
              <label style={lbl}>New Password</label>
              <input type="password" value={pwForm.new_password}
                onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                placeholder="Enter new password" style={inp} />
            </div>
            <div>
              <label style={lbl}>Confirm New Password</label>
              <input type="password" value={pwForm.confirm_password}
                onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                placeholder="Re-enter new password" style={inp} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={changePassword} disabled={pwSaving} style={{
                padding: '9px 24px', borderRadius: 9, border: 'none',
                cursor: pwSaving ? 'not-allowed' : 'pointer',
                background: pwSaving ? 'var(--bg-hover)' : 'var(--teal)',
                color: '#fff', fontFamily: 'var(--font-main)', fontWeight: 600, fontSize: 13,
                transition: 'background 0.2s',
              }}>
                {pwSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '22px 24px', marginBottom: 20,
    }}>
      <h2 style={{ fontFamily: 'var(--font-main)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 18 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontFamily: 'var(--font-main)' }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 8, padding: '9px 13px', marginBottom: 12, color: 'var(--danger)', fontSize: 12 }}>
      {msg}
    </div>
  );
}

function SaveBtn({ saving, saved, onClick }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      padding: '10px 28px', borderRadius: 9, border: 'none',
      background: saved ? 'var(--success)' : saving ? 'var(--bg-hover)' : 'var(--teal)',
      color: '#fff', fontFamily: 'var(--font-main)', fontWeight: 600, fontSize: 14,
      cursor: saving ? 'not-allowed' : 'pointer',
      transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {saved ? (
        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Saved!</>
      ) : saving ? 'Saving...' : 'Save Settings'}
    </button>
  );
}

const lbl = {
  display: 'block', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6,
  fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-main)',
};
const inp = {
  width: '100%', padding: '10px 12px', background: 'var(--bg-input)',
  border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};
const iconBtn = (color) => ({
  background: 'none', border: 'none', cursor: 'pointer',
  color, padding: '4px', borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
});
