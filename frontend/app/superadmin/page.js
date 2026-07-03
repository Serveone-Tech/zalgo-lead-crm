"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
function daysLeft(d) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
  return diff;
}

const STATUS_COLORS = {
  active:    { bg:"rgba(82,184,138,0.12)",  color:"#52b88a",  label:"Active" },
  trial:     { bg:"rgba(91,163,217,0.12)",  color:"#5ba3d9",  label:"Trial" },
  expired:   { bg:"rgba(224,82,82,0.12)",   color:"#e05252",  label:"Expired" },
  cancelled: { bg:"rgba(100,100,100,0.12)", color:"#888",     label:"Cancelled" },
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [actionUser, setActionUser]     = useState(null);
  const [actionData, setActionData]     = useState({ action:"activate", plan_id:"", billing_cycle:"monthly", days:30, notes:"" });
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) { router.push("/login"); return; }
    const u = JSON.parse(user);
    if (u.role !== "superadmin") { router.push("/dashboard"); return; }
    loadAll();
  }, []);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, plansRes] = await Promise.all([
        api.get("/superadmin/stats"),
        api.get("/superadmin/users"),
        api.get("/superadmin/plans"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPlans(plansRes.data);
    } catch { router.push("/login"); }
    finally { setLoading(false); }
  };

  const doAction = async () => {
    setSaving(true);
    try {
      const payload = { ...actionData, plan_id: parseInt(actionData.plan_id) || plans[0]?.id };
      // For 'activate', let backend compute days from billing_cycle — don't send days
      if (payload.action === "activate") delete payload.days;
      await api.post(`/superadmin/users/${actionUser.id}/subscription`, payload);
      showToast("Action completed successfully!");
      setActionUser(null);
      loadAll();
    } catch (err) { showToast(err.response?.data?.error || "Failed", "error"); }
    setSaving(false);
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user permanently? All their data will be lost.")) return;
    try { await api.delete(`/superadmin/users/${id}`); showToast("User deleted"); loadAll(); }
    catch (err) { showToast(err.response?.data?.error || "Failed", "error"); }
  };

  const logout = () => { localStorage.clear(); router.push("/login"); };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.org_name?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || u.sub_status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"var(--bg-base)", color:"var(--text-muted)", fontFamily:"var(--font-main)" }}>Loading...</div>;

  const statCards = [
    { label:"Total Users",     value:stats?.total_users||0,  color:"var(--teal)",    icon:"👥" },
    { label:"Active",          value:stats?.active||0,       color:"var(--success)", icon:"✅" },
    { label:"On Trial",        value:stats?.trial||0,        color:"var(--blue)",    icon:"⏳" },
    { label:"Expired",         value:stats?.expired||0,      color:"var(--danger)",  icon:"⚠️" },
    { label:"Total Revenue",   value:`₹${(stats?.total_revenue||0).toLocaleString()}`, color:"var(--warn)", icon:"💰" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-base)", display:"flex" }}>
      {toast && <div style={{ position:"fixed", top:20, right:20, zIndex:9999, background:toast.type==="success"?"var(--success)":"var(--danger)", color:"#fff", borderRadius:10, padding:"12px 20px", fontFamily:"var(--font-main)", fontWeight:600, fontSize:13, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>{toast.msg}</div>}

      {/* Sidebar */}
      <aside style={{ width:220, background:"var(--bg-surface)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", position:"fixed", top:0, bottom:0, left:0 }}>
        <div style={{ padding:"20px 18px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontFamily:"var(--font-main)", fontWeight:700, fontSize:16, color:"var(--text-primary)", marginBottom:4 }}>⚡ Super Admin</div>
          <div style={{ fontSize:11, color:"var(--teal)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Zalgo CRM</div>
        </div>
        <nav style={{ flex:1, padding:"12px 10px" }}>
          {[
            { label:"Dashboard",  icon:"📊", active:true },
            { label:"All Users",  icon:"👥", href:"#users" },
            { label:"Plans",      icon:"📋", href:"/superadmin/plans" },
          ].map(item=>(
            <a key={item.label} href={item.href||"#"} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, marginBottom:4, color: item.active?"var(--teal-light)":"var(--text-secondary)", background: item.active?"var(--teal-dim)":"transparent", fontFamily:"var(--font-main)", fontWeight: item.active?600:400, fontSize:13, textDecoration:"none", borderLeft: item.active?"2px solid var(--teal)":"2px solid transparent" }}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding:"14px", borderTop:"1px solid var(--border)" }}>
          <button onClick={logout} style={{ width:"100%", padding:"8px", borderRadius:7, background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:12, cursor:"pointer" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--danger)";e.currentTarget.style.color="var(--danger)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--text-muted)"}}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft:220, flex:1, padding:"28px 32px" }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"var(--font-main)", fontSize:22, fontWeight:700, color:"var(--text-primary)" }}>Super Admin Dashboard</h1>
          <p style={{ color:"var(--text-muted)", fontSize:13, marginTop:4 }}>Manage all users, subscriptions and plans</p>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))", gap:12, marginBottom:32 }}>
          {statCards.map(sc=>(
            <div key={sc.label} style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, padding:"16px 18px", borderTop:`3px solid ${sc.color}` }}>
              <div style={{ fontSize:22, marginBottom:8 }}>{sc.icon}</div>
              <div style={{ fontSize:26, fontWeight:700, color:sc.color, fontFamily:"var(--font-main)", lineHeight:1 }}>{sc.value}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:5, letterSpacing:"0.04em", textTransform:"uppercase" }}>{sc.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search user, org, email..."
            style={{ flex:1, minWidth:220, padding:"8px 12px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-primary)", fontSize:13, outline:"none" }} />
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding:"8px 12px", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text-primary)", fontSize:12, outline:"none", cursor:"pointer" }}>
            <option value="">All Status</option>
            {["active","trial","expired","cancelled"].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <a href="/superadmin/plans" style={{ padding:"8px 16px", background:"var(--teal)", color:"#fff", borderRadius:7, fontSize:12, fontWeight:600, fontFamily:"var(--font-main)", textDecoration:"none", display:"flex", alignItems:"center" }}>
            Manage Plans
          </a>
        </div>

        {/* Users Table */}
        <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
              <thead>
                <tr style={{ background:"var(--bg-surface)" }}>
                  {["#","User / Org","Email","Plan","Status","Expires","Leads","Customers","Actions"].map(h=>(
                    <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:10, color:"var(--text-muted)", fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", borderBottom:"1px solid var(--border)", fontFamily:"var(--font-main)", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>No users found</td></tr>
                ) : filtered.map((u,i)=>{
                  const sc = STATUS_COLORS[u.sub_status] || { bg:"rgba(100,100,100,0.12)", color:"#888", label:u.sub_status||"No Plan" };
                  const expiry = u.sub_status==="trial" ? u.trial_ends_at : u.ends_at;
                  const dl = daysLeft(expiry);
                  return (
                    <tr key={u.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"12px 14px", color:"var(--text-muted)", fontSize:12 }}>{i+1}</td>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          {u.logo_url ? (
                            <img src={u.logo_url} alt="" style={{ width:28, height:28, borderRadius:6, objectFit:"contain", border:"1px solid var(--border)" }} onError={e=>e.target.style.display="none"} />
                          ) : (
                            <div style={{ width:28, height:28, borderRadius:6, background:"var(--teal)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0, fontFamily:"var(--font-main)" }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontFamily:"var(--font-main)", fontWeight:600, fontSize:13, color:"var(--text-primary)" }}>{u.name}</div>
                            {u.org_name && <div style={{ fontSize:11, color:"var(--text-muted)" }}>{u.org_name}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"12px 14px", fontSize:12, color:"var(--text-secondary)" }}>{u.email}</td>
                      <td style={{ padding:"12px 14px", fontSize:12, color:"var(--text-secondary)" }}>{u.plan_name||"—"}</td>
                      <td style={{ padding:"12px 14px" }}>
                        <span style={{ background:sc.bg, color:sc.color, fontSize:10, fontWeight:700, borderRadius:20, padding:"3px 10px", fontFamily:"var(--font-main)" }}>{sc.label}</span>
                      </td>
                      <td style={{ padding:"12px 14px", fontSize:12, whiteSpace:"nowrap" }}>
                        {expiry ? (
                          <span style={{ color: dl!==null&&dl<=7?"var(--danger)":"var(--text-secondary)", fontWeight: dl!==null&&dl<=7?700:400 }}>
                            {dl!==null&&dl<=7&&dl>=0?`⚠ ${dl}d left `:""}{fmtDate(expiry)}
                          </span>
                        ) : <span style={{ color:"var(--text-muted)" }}>—</span>}
                      </td>
                      <td style={{ padding:"12px 14px", fontSize:12, color:"var(--text-secondary)", textAlign:"center" }}>{u.lead_count||0}</td>
                      <td style={{ padding:"12px 14px", fontSize:12, color:"var(--text-secondary)", textAlign:"center" }}>{u.customer_count||0}</td>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={()=>{ setActionUser(u); setActionData(d=>({...d, plan_id: u.plan_id||plans[0]?.id||""})); }} style={{ padding:"5px 10px", borderRadius:6, background:"transparent", border:"1px solid var(--border)", color:"var(--teal)", fontSize:11, cursor:"pointer", fontWeight:600 }}
                            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--teal)"}
                            onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>Manage</button>
                          <button onClick={()=>deleteUser(u.id)} style={{ padding:"5px 10px", borderRadius:6, background:"transparent", border:"1px solid var(--border)", color:"var(--danger)", fontSize:11, cursor:"pointer", fontWeight:600 }}
                            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--danger)"}
                            onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop:12, fontSize:12, color:"var(--text-muted)", textAlign:"right" }}>
          {filtered.length} of {users.length} users
        </div>
      </main>

      {/* Action Modal */}
      {actionUser && (
        <div onClick={e=>{if(e.target===e.currentTarget)setActionUser(null)}} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-strong)", borderRadius:14, padding:"26px 24px", width:"100%", maxWidth:460 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:"var(--font-main)", fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>Manage Subscription</h2>
                <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{actionUser.name} — {actionUser.email}</div>
              </div>
              <button onClick={()=>setActionUser(null)} style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:20, cursor:"pointer" }}>✕</button>
            </div>

            {/* Action selector */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
              {[
                { key:"activate", label:"✅ Activate Plan", color:"var(--success)" },
                { key:"extend",   label:"📅 Extend Days", color:"var(--blue)" },
                { key:"trial",    label:"⏳ Give Trial", color:"var(--teal)" },
                { key:"cancel",   label:"🚫 Cancel", color:"var(--danger)" },
              ].map(a=>(
                <button key={a.key} onClick={()=>setActionData(d=>({...d,action:a.key}))} style={{ padding:"10px 12px", borderRadius:8, cursor:"pointer", fontFamily:"var(--font-main)", fontWeight:600, fontSize:12, border:`2px solid ${actionData.action===a.key?a.color:"var(--border)"}`, background: actionData.action===a.key?`${a.color}18`:"transparent", color: actionData.action===a.key?a.color:"var(--text-secondary)" }}>
                  {a.label}
                </button>
              ))}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Plan selector */}
              {(actionData.action==="activate"||actionData.action==="trial") && (
                <div>
                  <Lbl>Select Plan</Lbl>
                  <select value={actionData.plan_id} onChange={e=>setActionData(d=>({...d,plan_id:e.target.value}))} style={inp}>
                    <option value="">-- Select Plan --</option>
                    {plans.map(p=><option key={p.id} value={p.id}>{p.name} — ₹{p.price_monthly}/mo</option>)}
                  </select>
                </div>
              )}

              {/* Billing cycle */}
              {actionData.action==="activate" && (
                <div>
                  <Lbl>Billing Cycle</Lbl>
                  <select value={actionData.billing_cycle} onChange={e=>setActionData(d=>({...d,billing_cycle:e.target.value}))} style={inp}>
                    <option value="monthly">Monthly (30 days)</option>
                    <option value="yearly">Yearly (365 days)</option>
                  </select>
                </div>
              )}

              {/* Days */}
              {(actionData.action==="extend"||actionData.action==="trial") && (
                <div>
                  <Lbl>Number of Days</Lbl>
                  <input type="number" value={actionData.days} onChange={e=>setActionData(d=>({...d,days:e.target.value}))} placeholder="30" style={inp} />
                </div>
              )}

              {/* Notes */}
              <div>
                <Lbl>Notes (optional)</Lbl>
                <input value={actionData.notes} onChange={e=>setActionData(d=>({...d,notes:e.target.value}))} placeholder="Reason for this action..." style={inp} />
              </div>
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
              <button onClick={()=>setActionUser(null)} style={{ padding:"9px 18px", borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--text-secondary)", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={doAction} disabled={saving} style={{ padding:"9px 20px", borderRadius:8, background: actionData.action==="cancel"?"var(--danger)":"var(--teal)", border:"none", color:"#fff", fontFamily:"var(--font-main)", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                {saving ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Lbl({children}) {
  return <label style={{ display:"block", fontSize:10, color:"var(--text-secondary)", marginBottom:5, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"var(--font-main)" }}>{children}</label>;
}
const inp = { width:"100%", padding:"9px 11px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text-primary)", fontSize:13, outline:"none" };
