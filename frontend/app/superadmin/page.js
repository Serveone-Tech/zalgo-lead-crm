"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../lib/api";
import EmployeesModal from "./EmployeesModal";
import Pagination from "../../components/Pagination";
import SuperAdminShell from "./SuperAdminShell";

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
  trialing:  { bg:"rgba(91,163,217,0.12)",  color:"#5ba3d9",  label:"Trial" },
  past_due:  { bg:"rgba(230,168,23,0.12)",  color:"#e6a817",  label:"Payment issue" },
  expired:   { bg:"rgba(224,82,82,0.12)",   color:"#e05252",  label:"Expired" },
  canceled:  { bg:"rgba(100,100,100,0.12)", color:"#888",     label:"Cancelled" },
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
  const [empLimitInput, setEmpLimitInput] = useState("");
  const [employeesModalUser, setEmployeesModalUser] = useState(null);
  const [savingLimit, setSavingLimit]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [reconciling, setReconciling] = useState(null);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [suspending, setSuspending] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
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
      setActionUser(null); setReconcileResult(null);
      loadAll();
    } catch (err) { showToast(err.response?.data?.error || "Failed", "error"); }
    setSaving(false);
  };

  const toggleSuspend = async (u) => {
    const suspending_ = !u.suspended_by_admin;
    const msg = suspending_
      ? `This will immediately suspend ${u.name}. Every employee under this tenant loses access too — they'll all be logged out on their next request. Nothing is deleted; reactivating restores everyone exactly as they were.`
      : `This will restore ${u.name}'s access, and every one of their employees who wasn't separately deactivated by the tenant itself.`;
    if (!confirm(msg)) return;
    setSuspending(u.id);
    try {
      await api.put(`/superadmin/users/${u.id}/suspend`, { suspended: suspending_ });
      showToast(suspending_ ? "Tenant suspended" : "Tenant reactivated");
      loadAll();
    } catch (err) { showToast(err.response?.data?.error || "Failed", "error"); }
    setSuspending(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmUser || deleteConfirmInput.trim() !== deleteConfirmUser.name.trim()) return;
    setDeleting(true);
    try {
      await api.delete(`/superadmin/users/${deleteConfirmUser.id}`, { data: { confirm_name: deleteConfirmInput.trim() } });
      showToast("Tenant permanently deleted");
      setDeleteConfirmUser(null);
      loadAll();
    } catch (err) { showToast(err.response?.data?.error || "Failed", "error"); }
    setDeleting(false);
  };

  const reconcileSubscription = async (u) => {
    if (!confirm(`This will check Razorpay directly for ${u.name}'s subscription status. If Razorpay confirms it's actually active (e.g. a webhook was missed), their plan will be activated immediately. It will NOT cancel or downgrade anything — a mismatch the other way (Razorpay shows cancelled/halted) will be flagged for you to review, not auto-corrected.`)) return;
    setReconciling(u.id);
    setReconcileResult(null);
    try {
      const { data } = await api.post(`/superadmin/users/${u.id}/reconcile-subscription`);
      setReconcileResult(data);
      if (data.reconciled) showToast(`Reconciled — plan is now active (Razorpay confirmed: ${data.razorpay_status})`);
      else if (!data.mismatch) showToast(`No change — Razorpay reports: ${data.razorpay_status}`);
      loadAll();
    } catch (err) { showToast(err.response?.data?.error || "Failed to reconcile", "error"); }
    setReconciling(null);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.org_name?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || u.sub_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus]);
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"var(--bg-base)", color:"var(--text-muted)", fontFamily:"var(--font-main)" }}>Loading...</div>;

  const statCards = [
    { label:"Total Users",     value:stats?.total_users||0,  color:"var(--teal)",    icon:"👥" },
    { label:"Active",          value:stats?.active||0,       color:"var(--success)", icon:"✅" },
    { label:"On Trial",        value:stats?.trial||0,        color:"var(--blue)",    icon:"⏳" },
    { label:"Expired",         value:stats?.expired||0,      color:"var(--danger)",  icon:"⚠️" },
    { label:"Total Revenue",   value:`₹${(stats?.total_revenue||0).toLocaleString()}`, color:"var(--warn)", icon:"💰" },
    { label:"New Contact Requests", value:stats?.newContactRequests||0, color:"var(--blue)", icon:"📩" },
  ];

  return (
    <SuperAdminShell>
      {toast && <div style={{ position:"fixed", top:20, right:20, zIndex:9999, background:toast.type==="success"?"var(--success)":"var(--danger)", color:"#fff", borderRadius:10, padding:"12px 20px", fontFamily:"var(--font-main)", fontWeight:600, fontSize:13, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>{toast.msg}</div>}

        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"var(--font-main)", fontSize:22, fontWeight:700, color:"var(--text-primary)" }}>Tenants</h1>
          <p style={{ color:"var(--text-muted)", fontSize:13, marginTop:4 }}>Manage all tenants, subscriptions and plans</p>
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
            {["active","trialing","past_due","expired","canceled"].map(s=><option key={s} value={s}>{STATUS_COLORS[s]?.label || s}</option>)}
          </select>
          <Link href="/superadmin/plans" style={{ padding:"8px 16px", background:"var(--teal)", color:"#fff", borderRadius:7, fontSize:12, fontWeight:600, fontFamily:"var(--font-main)", textDecoration:"none", display:"flex", alignItems:"center" }}>
            Manage Plans
          </Link>
        </div>

        {/* Users Table */}
        <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
              <thead>
                <tr style={{ background:"var(--bg-surface)" }}>
                  {["#","User / Org","Email","Plan","Status","Expires","Leads","Customers","Employees","Actions"].map(h=>(
                    <th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:10, color:"var(--text-muted)", fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", borderBottom:"1px solid var(--border)", fontFamily:"var(--font-main)", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>No users found</td></tr>
                ) : paged.map((u,i)=>{
                  const sc = STATUS_COLORS[u.sub_status] || { bg:"rgba(100,100,100,0.12)", color:"#888", label:u.sub_status||"No Plan" };
                  const expiry = u.sub_status==="trial" ? u.trial_ends_at : u.ends_at;
                  const dl = daysLeft(expiry);
                  return (
                    <tr key={u.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="var(--bg-hover)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"12px 14px", color:"var(--text-muted)", fontSize:12 }}>{(page-1)*pageSize+i+1}</td>
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
                        {u.suspended_by_admin && (
                          <span style={{ display:"block", marginTop:4, background:"rgba(224,82,82,0.12)", color:"var(--danger)", fontSize:9, fontWeight:700, borderRadius:20, padding:"2px 8px", fontFamily:"var(--font-main)", width:"fit-content" }}>🔒 Suspended</span>
                        )}
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
                      <td style={{ padding:"12px 14px", fontSize:12, textAlign:"center", whiteSpace:"nowrap" }}>
                        <button
                          onClick={()=>setEmployeesModalUser(u)}
                          title="View / manage this tenant's employees"
                          style={{ background:"transparent", border:"1px solid var(--border)", borderRadius:6, padding:"4px 10px", color:"var(--teal)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-main)" }}
                          onMouseEnter={e=>e.currentTarget.style.borderColor="var(--teal)"}
                          onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}
                        >
                          {u.employee_count||0} / {u.max_employees == null ? "—" : (u.employee_limit_override ?? u.max_employees) === -1 ? "∞" : (u.employee_limit_override ?? u.max_employees)}
                          {u.employee_limit_override != null && <span title="Custom limit set by Super Admin" style={{ color:"var(--teal)" }}> ★</span>}
                        </button>
                      </td>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={()=>{ setActionUser(u); setReconcileResult(null); setActionData(d=>({...d, plan_id: u.plan_id||plans[0]?.id||""})); setEmpLimitInput(u.employee_limit_override ?? ""); }} style={{ padding:"5px 10px", borderRadius:6, background:"transparent", border:"1px solid var(--border)", color:"var(--teal)", fontSize:11, cursor:"pointer", fontWeight:600 }}
                            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--teal)"}
                            onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>Manage</button>
                          <button
                            onClick={()=>toggleSuspend(u)}
                            disabled={suspending===u.id}
                            style={{ padding:"5px 10px", borderRadius:6, background:"transparent", border:`1px solid ${u.suspended_by_admin?"var(--success)":"var(--warn)"}`, color:u.suspended_by_admin?"var(--success)":"var(--warn)", fontSize:11, cursor: suspending===u.id?"not-allowed":"pointer", fontWeight:600 }}
                          >
                            {suspending===u.id ? "…" : u.suspended_by_admin ? "Reactivate" : "Suspend"}
                          </button>
                          <button onClick={()=>{ setDeleteConfirmUser(u); setDeleteConfirmInput(""); }} title="Permanently delete (irreversible)" style={{ padding:"5px 10px", borderRadius:6, background:"transparent", border:"1px solid var(--border)", color:"var(--danger)", fontSize:11, cursor:"pointer", fontWeight:600 }}
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

        {filtered.length > 0 && (
          <Pagination
            page={page}
            setPage={setPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            total={filtered.length}
          />
        )}

        <div style={{ marginTop:12, fontSize:12, color:"var(--text-muted)", textAlign:"right" }}>
          {filtered.length} of {users.length} users
        </div>

      {/* Action Modal */}
      {actionUser && (
        <div onClick={e=>{if(e.target===e.currentTarget){setActionUser(null); setReconcileResult(null);}}} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-strong)", borderRadius:14, padding:"26px 24px", width:"100%", maxWidth:460 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:"var(--font-main)", fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>Manage Subscription</h2>
                <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{actionUser.name} — {actionUser.email}</div>
              </div>
              <button onClick={()=>{setActionUser(null); setReconcileResult(null);}} style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:20, cursor:"pointer" }}>✕</button>
            </div>

            {/* Razorpay billing visibility */}
            <div style={{ marginBottom:20, padding:12, border:"1px solid var(--border)", borderRadius:10, background:"var(--bg-surface)" }}>
              <Lbl>Razorpay Billing</Lbl>
              {actionUser.razorpay_subscription_id ? (
                <>
                  <div style={{ fontSize:11, color:"var(--text-secondary)", fontFamily:"monospace", marginBottom:2 }}>
                    Customer: {actionUser.razorpay_customer_id || "—"}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-secondary)", fontFamily:"monospace", marginBottom:8 }}>
                    Subscription: {actionUser.razorpay_subscription_id}
                  </div>
                  {actionUser.sub_status === "past_due" && (
                    <div style={{ fontSize:11, color:"var(--warn)", marginBottom:8 }}>
                      Payment issue since {fmtDate(actionUser.past_due_since)}
                    </div>
                  )}
                  <button
                    onClick={()=>reconcileSubscription(actionUser)}
                    disabled={reconciling===actionUser.id}
                    style={{ padding:"6px 12px", borderRadius:6, background:"transparent", border:"1px solid var(--teal)", color:"var(--teal-light)", fontSize:11, fontWeight:600, cursor: reconciling===actionUser.id?"not-allowed":"pointer", fontFamily:"var(--font-main)" }}
                  >
                    {reconciling===actionUser.id ? "Checking with Razorpay…" : "🔄 Retry Reconciliation"}
                  </button>
                  {reconcileResult?.mismatch && (
                    <div style={{ marginTop:10, padding:"10px 12px", borderRadius:8, background:"rgba(224,82,82,0.12)", border:"1px solid rgba(224,82,82,0.4)" }}>
                      <div style={{ fontSize:11.5, color:"var(--danger)", fontWeight:700, marginBottom:3 }}>⚠ Status mismatch — not auto-corrected</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", lineHeight:1.5 }}>
                        Razorpay reports this subscription as <strong>{reconcileResult.razorpay_status}</strong>, but the local
                        record still shows <strong>{reconcileResult.local_status}</strong>. This was left as-is deliberately —
                        review and use the actions below to change it manually if that's correct.
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                  No recurring mandate — this tenant is on manual renewal (never set up auto-pay).
                </div>
              )}
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

            <div style={{ marginTop:20, padding:14, border:"1px solid var(--border)", borderRadius:10 }}>
              <Lbl>Employee Seat Limit — plan default is {actionUser.max_employees === -1 ? "unlimited" : (actionUser.max_employees ?? "—")}</Lbl>
              <div style={{ display:"flex", gap:8 }}>
                <input
                  type="number" min="0"
                  value={empLimitInput}
                  onChange={e=>setEmpLimitInput(e.target.value)}
                  placeholder="Leave blank to use plan default"
                  style={{ ...inp, flex:1 }}
                />
                <button
                  disabled={savingLimit}
                  onClick={async ()=>{
                    setSavingLimit(true);
                    try {
                      await api.put(`/superadmin/users/${actionUser.id}/employee-limit`, { limit: empLimitInput === "" ? null : parseInt(empLimitInput) });
                      showToast("Employee seat limit updated!");
                      loadAll();
                      setActionUser(null); setReconcileResult(null);
                    } catch { showToast("Failed to update seat limit", "error"); }
                    setSavingLimit(false);
                  }}
                  style={{ padding:"9px 16px", borderRadius:8, background:"var(--teal)", border:"none", color:"#fff", fontFamily:"var(--font-main)", fontWeight:600, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}
                >
                  {savingLimit ? "Saving..." : "Save Limit"}
                </button>
              </div>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:6 }}>
                Currently used: {actionUser.employee_count||0}. Set a number to override this tenant's seat count (e.g. after they request more), or leave blank to fall back to the plan's default.
              </div>
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
              <button onClick={()=>{setActionUser(null); setReconcileResult(null);}} style={{ padding:"9px 18px", borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--text-secondary)", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button onClick={doAction} disabled={saving} style={{ padding:"9px 20px", borderRadius:8, background: actionData.action==="cancel"?"var(--danger)":"var(--teal)", border:"none", color:"#fff", fontFamily:"var(--font-main)", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                {saving ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {employeesModalUser && (
        <EmployeesModal
          owner={employeesModalUser}
          onClose={()=>setEmployeesModalUser(null)}
          onChanged={loadAll}
        />
      )}

      {deleteConfirmUser && (
        <div onClick={e=>{if(e.target===e.currentTarget)setDeleteConfirmUser(null);}} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:300, padding:20 }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--danger)", borderRadius:14, padding:"26px 24px", width:"100%", maxWidth:440 }}>
            <h2 style={{ fontFamily:"var(--font-main)", fontSize:16, fontWeight:700, color:"var(--danger)", marginBottom:10 }}>⚠ Permanently Delete Tenant</h2>
            <p style={{ fontSize:12.5, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:6 }}>
              This will permanently delete <strong>{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email}) and every
              lead, customer, order, and employee under their account. <strong>This cannot be undone.</strong>
            </p>
            <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:16 }}>
              Consider <strong>Suspend</strong> instead — it's reversible and keeps their data intact.
            </p>
            <Lbl>Type the tenant's exact name to confirm: {deleteConfirmUser.name}</Lbl>
            <input
              value={deleteConfirmInput}
              onChange={e=>setDeleteConfirmInput(e.target.value)}
              placeholder={deleteConfirmUser.name}
              style={inp}
              autoFocus
            />
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
              <button onClick={()=>setDeleteConfirmUser(null)} style={{ padding:"9px 18px", borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--text-secondary)", fontSize:13, cursor:"pointer" }}>Cancel</button>
              <button
                onClick={confirmDelete}
                disabled={deleting || deleteConfirmInput.trim() !== deleteConfirmUser.name.trim()}
                style={{ padding:"9px 20px", borderRadius:8, background: deleteConfirmInput.trim()===deleteConfirmUser.name.trim() ? "var(--danger)" : "var(--bg-hover)", border:"none", color:"#fff", fontFamily:"var(--font-main)", fontWeight:600, fontSize:13, cursor: deleteConfirmInput.trim()===deleteConfirmUser.name.trim() ? "pointer" : "not-allowed" }}
              >
                {deleting ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminShell>
  );
}

function Lbl({children}) {
  return <label style={{ display:"block", fontSize:10, color:"var(--text-secondary)", marginBottom:5, fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase", fontFamily:"var(--font-main)" }}>{children}</label>;
}
const inp = { width:"100%", padding:"9px 11px", background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text-primary)", fontSize:13, outline:"none" };
