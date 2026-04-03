'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import LeadModal from '../../components/LeadModal';

const STAGES = ['', 'New', 'Active', 'Follow-up', 'Booked', 'Closed'];
const STAGE_COLORS = {
  New:         { bg: 'rgba(82,184,138,0.12)',  color: '#52b88a' },
  Active:      { bg: 'rgba(0,168,173,0.13)',   color: '#00a8ad' },
  'Follow-up': { bg: 'rgba(224,160,80,0.13)',  color: '#e0a050' },
  Booked:      { bg: 'rgba(91,163,217,0.13)',  color: '#5ba3d9' },
  Closed:      { bg: 'rgba(100,100,100,0.13)', color: '#888' },
};

function today() { return new Date().toISOString().split('T')[0]; }
function isOverdue(d) { return d && d.split('T')[0] < today(); }
function isToday(d)   { return d && d.split('T')[0] === today(); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [stageF, setStageF]     = useState('');
  const [dateF, setDateF]       = useState('');
  const [modalOpen, setModal]   = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    if (!token) { router.push('/login'); return; }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/leads');
      setLeads(data);
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => leads.filter(l => {
    const q = search.toLowerCase();
    if (q && !l.name.toLowerCase().includes(q) &&
        !l.last_message?.toLowerCase().includes(q) &&
        !l.notes?.toLowerCase().includes(q) &&
        !l.platform?.toLowerCase().includes(q)) return false;
    if (stageF && l.stage !== stageF) return false;
    if (dateF === 'overdue' && !isOverdue(l.follow_up_date)) return false;
    if (dateF === 'today'   && !isToday(l.follow_up_date))   return false;
    return true;
  }), [leads, search, stageF, dateF]);

  const openAdd  = () => { setEditLead(null); setModal(true); };
  const openEdit = (l) => { setEditLead(l);   setModal(true); };
  const closeModal = () => { setModal(false); setEditLead(null); };

  const saveLead = async (form) => {
    if (editLead?.id) await api.put(`/leads/${editLead.id}`, form);
    else await api.post('/leads', form);
    closeModal(); load();
  };

  const deleteLead = async (id) => {
    if (!confirm('Delete this lead permanently?')) return;
    setDeleting(id);
    await api.delete(`/leads/${id}`);
    setDeleting(null); load();
  };

  const changeStage = async (lead, stage) => {
    await api.put(`/leads/${lead.id}`, { ...lead, stage });
    load();
  };

  const overdueCount = leads.filter(l => isOverdue(l.follow_up_date) && l.stage !== 'Closed').length;

  return (
    <div style={{ padding:'28px 32px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-main)', fontSize:22, fontWeight:700, color:'var(--text-primary)' }}>Leads</h1>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:4 }}>
            {leads.length} total lead{leads.length !== 1 ? 's' : ''}
            {overdueCount > 0 && <span style={{ color:'var(--danger)', marginLeft:10 }}>• {overdueCount} overdue</span>}
          </p>
        </div>
        <button onClick={openAdd} style={{
          background:'var(--teal)', color:'#fff', border:'none',
          borderRadius:8, padding:'9px 18px',
          fontFamily:'var(--font-main)', fontWeight:600, fontSize:13, cursor:'pointer',
          display:'flex', alignItems:'center', gap:6,
        }}>
          <span style={{ fontSize:16 }}>+</span> Add Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display:'flex', gap:10, marginBottom:20, flexWrap:'wrap',
        background:'var(--bg-card)', border:'1px solid var(--border)',
        borderRadius:10, padding:'12px 16px', alignItems:'center',
      }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by name, message, notes..."
          style={{
            flex:1, minWidth:200, padding:'8px 12px',
            background:'var(--bg-input)', border:'1px solid var(--border)',
            borderRadius:7, color:'var(--text-primary)', fontSize:13, outline:'none',
          }}
        />
        <select value={stageF} onChange={e => setStageF(e.target.value)} style={selStyle}>
          <option value="">All Stages</option>
          {STAGES.filter(Boolean).map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={dateF} onChange={e => setDateF(e.target.value)} style={selStyle}>
          <option value="">All Dates</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
        </select>
        {(search || stageF || dateF) && (
          <button onClick={() => { setSearch(''); setStageF(''); setDateF(''); }}
            style={{ padding:'8px 12px', background:'transparent', border:'1px solid var(--border)', borderRadius:7, color:'var(--text-muted)', fontSize:12, cursor:'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}>Loading leads...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:48, textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📭</div>
            <div style={{ color:'var(--text-secondary)', fontFamily:'var(--font-main)', fontWeight:600, marginBottom:6 }}>
              {leads.length === 0 ? 'No leads yet' : 'No matching leads'}
            </div>
            <div style={{ color:'var(--text-muted)', fontSize:13 }}>
              {leads.length === 0 ? 'Click "+ Add Lead" to get started' : 'Try adjusting your filters'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
              <thead>
                <tr style={{ background:'var(--bg-surface)' }}>
                  {['#','Name & Link','Platform','Stage','Last Message','Follow-up','Notes','Actions'].map(h => (
                    <th key={h} style={{
                      padding:'11px 14px', textAlign:'left',
                      fontSize:10, color:'var(--text-muted)', fontWeight:600,
                      letterSpacing:'0.07em', textTransform:'uppercase',
                      borderBottom:'1px solid var(--border)',
                      fontFamily:'var(--font-main)', whiteSpace:'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => {
                  const over = isOverdue(lead.follow_up_date) && lead.stage !== 'Closed';
                  const tod  = isToday(lead.follow_up_date);
                  const sc   = STAGE_COLORS[lead.stage] || STAGE_COLORS['New'];
                  return (
                    <tr key={lead.id}
                      style={{ background: over ? 'rgba(224,82,82,0.04)' : 'transparent', borderBottom:'1px solid var(--border)', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = over ? 'rgba(224,82,82,0.04)' : 'transparent'}
                    >
                      <td style={{ padding:'12px 14px', color:'var(--text-muted)', fontSize:12 }}>{i + 1}</td>

                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ fontFamily:'var(--font-main)', fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{lead.name}</div>
                        {lead.platform_link ? (
                          <a href={lead.platform_link} target="_blank" rel="noreferrer"
                            style={{ fontSize:11, color:'var(--teal)', display:'block', marginTop:2 }}>
                            {lead.platform_link.replace('https://','').substring(0,30)}{lead.platform_link.length > 33 ? '…' : ''}
                          </a>
                        ) : <span style={{ fontSize:11, color:'var(--text-muted)' }}>No link</span>}
                      </td>

                      <td style={{ padding:'12px 14px' }}>
                        <span style={{
                          background:'rgba(91,163,217,0.13)', color:'var(--blue)',
                          borderRadius:5, padding:'3px 8px', fontSize:11, fontWeight:600,
                        }}>{lead.platform}</span>
                      </td>

                      <td style={{ padding:'12px 14px' }} onClick={e => e.stopPropagation()}>
                        <select
                          value={lead.stage}
                          onChange={e => changeStage(lead, e.target.value)}
                          style={{
                            background: sc.bg, color: sc.color,
                            border:`1px solid ${sc.color}44`,
                            borderRadius:20, padding:'3px 10px',
                            fontSize:11, fontWeight:700,
                            fontFamily:'var(--font-main)', cursor:'pointer', outline:'none',
                          }}
                        >
                          {STAGES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      <td style={{ padding:'12px 14px', fontSize:12, color:'var(--text-secondary)', maxWidth:180 }}>
                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={lead.last_message}>
                          {lead.last_message || <span style={{ color:'var(--text-muted)' }}>—</span>}
                        </div>
                      </td>

                      <td style={{ padding:'12px 14px', whiteSpace:'nowrap', fontSize:12 }}>
                        {lead.follow_up_date
                          ? <span style={{ color: over ? 'var(--danger)' : tod ? 'var(--warn)' : 'var(--text-secondary)', fontWeight: over||tod ? 700 : 400 }}>
                              {over ? '⚠ ' : tod ? '● ' : ''}{fmtDate(lead.follow_up_date)}
                            </span>
                          : <span style={{ color:'var(--text-muted)' }}>—</span>}
                      </td>

                      <td style={{ padding:'12px 14px', fontSize:12, color:'var(--text-secondary)', maxWidth:160 }}>
                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={lead.notes}>
                          {lead.notes || <span style={{ color:'var(--text-muted)' }}>—</span>}
                        </div>
                      </td>

                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => openEdit(lead)} style={{
                            background:'transparent', border:'1px solid var(--border)',
                            borderRadius:6, padding:'5px 10px', color:'var(--teal)',
                            fontSize:11, cursor:'pointer', fontFamily:'var(--font-main)', fontWeight:600,
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor='var(--teal)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                          >Edit</button>
                          <button onClick={() => deleteLead(lead.id)} disabled={deleting === lead.id} style={{
                            background:'transparent', border:'1px solid var(--border)',
                            borderRadius:6, padding:'5px 10px', color:'var(--danger)',
                            fontSize:11, cursor:'pointer', fontFamily:'var(--font-main)', fontWeight:600,
                            opacity: deleting === lead.id ? 0.5 : 1,
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor='var(--danger)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                          >{deleting === lead.id ? '…' : 'Del'}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop:12, fontSize:12, color:'var(--text-muted)', textAlign:'right' }}>
          Showing {filtered.length} of {leads.length} leads
        </div>
      )}

      {modalOpen && (
        <LeadModal lead={editLead} onClose={closeModal} onSave={saveLead} />
      )}
    </div>
  );
}

const selStyle = {
  padding:'8px 10px',
  background:'var(--bg-input)', border:'1px solid var(--border)',
  borderRadius:7, color:'var(--text-primary)', fontSize:12, outline:'none', cursor:'pointer',
};
