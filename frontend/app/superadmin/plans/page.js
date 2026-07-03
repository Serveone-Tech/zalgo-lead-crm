"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";

const EMPTY = { name:"", description:"", price_monthly:"", price_yearly:"", trial_days:"0", is_free:false, max_leads:"-1", max_customers:"-1", is_active:true, sort_order:"0", features:"" };

export default function SuperAdminPlansPage() {
  const router = useRouter();
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) { router.push("/login"); return; }
    if (JSON.parse(user).role !== "superadmin") { router.push("/dashboard"); return; }
    load();
  }, []);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const load = async () => {
    setLoading(true);
    try { const {data}=await api.get("/superadmin/plans"); setPlans(data); }
    catch {} finally { setLoading(false); }
  };

  const openAdd = () => { setEditPlan(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (p) => {
    setEditPlan(p);
    const features = Array.isArray(p.features)?p.features:JSON.parse(p.features||"[]");
    setForm({ ...p, features: features.join("\n"), price_monthly:p.price_monthly||"", price_yearly:p.price_yearly||"", max_leads: p.max_leads||"-1", max_customers: p.max_customers||"-1", sort_order: p.sort_order||"0", trial_days: p.trial_days||"0" });
    setShowForm(true);
  };

  const savePlan = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const features = form.features.split("\n").map(f=>f.trim()).filter(Boolean);
      const payload = { ...form, features };
      if (editPlan) await api.put(`/superadmin/plans/${editPlan.id}`, payload);
      else await api.post("/superadmin/plans", payload);
      showToast(editPlan?"Plan updated!":"Plan created!");
      setShowForm(false); load();
    } catch (err) { showToast(err.response?.data?.error||"Failed","error"); }
    setSaving(false);
  };

  const deletePlan = async (id) => {
    if (!confirm("Delete this plan?")) return;
    try { await api.delete(`/superadmin/plans/${id}`); showToast("Plan deleted"); load(); }
    catch (err) { showToast(err.response?.data?.error||"Cannot delete","error"); }
  };

  const handle = (e) => {
    const val = e.target.type==="checkbox" ? e.target.checked : e.target.value;
    setForm(f=>({...f,[e.target.name]:val}));
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-base)", display:"flex" }}>
      {toast && <div style={{ position:"fixed",top:20,right:20,zIndex:9999,background:toast.type==="success"?"var(--success)":"var(--danger)",color:"#fff",borderRadius:10,padding:"12px 20px",fontFamily:"var(--font-main)",fontWeight:600,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>{toast.msg}</div>}

      {/* Sidebar */}
      <aside style={{ width:220, background:"var(--bg-surface)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", position:"fixed", top:0, bottom:0, left:0 }}>
        <div style={{ padding:"20px 18px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ fontFamily:"var(--font-main)", fontWeight:700, fontSize:16, color:"var(--text-primary)", marginBottom:4 }}>⚡ Super Admin</div>
          <div style={{ fontSize:11, color:"var(--teal)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Zalgo CRM</div>
        </div>
        <nav style={{ flex:1, padding:"12px 10px" }}>
          {[
            { label:"Dashboard", icon:"📊", href:"/superadmin" },
            { label:"All Users",  icon:"👥", href:"/superadmin" },
            { label:"Plans",      icon:"📋", href:"/superadmin/plans", active:true },
          ].map(item=>(
            <a key={item.label} href={item.href} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, marginBottom:4, color: item.active?"var(--teal-light)":"var(--text-secondary)", background: item.active?"var(--teal-dim)":"transparent", fontFamily:"var(--font-main)", fontWeight: item.active?600:400, fontSize:13, textDecoration:"none", borderLeft: item.active?"2px solid var(--teal)":"2px solid transparent" }}>
              <span>{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div style={{ padding:"14px", borderTop:"1px solid var(--border)" }}>
          <button onClick={()=>{localStorage.clear();router.push("/login")}} style={{ width:"100%", padding:"8px", borderRadius:7, background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:12, cursor:"pointer" }}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft:220, flex:1, padding:"28px 32px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:"var(--font-main)", fontSize:22, fontWeight:700, color:"var(--text-primary)" }}>Plans Management</h1>
            <p style={{ color:"var(--text-muted)", fontSize:13, marginTop:4 }}>Create and manage subscription plans</p>
          </div>
          <button onClick={openAdd} style={{ background:"var(--teal)", color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontFamily:"var(--font-main)", fontWeight:600, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:16 }}>+</span> New Plan
          </button>
        </div>

        {loading ? <div style={{ padding:48, textAlign:"center", color:"var(--text-muted)" }}>Loading...</div> : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:16 }}>
            {plans.map(plan=>{
              const features = Array.isArray(plan.features)?plan.features:JSON.parse(plan.features||"[]");
              return (
                <div key={plan.id} style={{ background:"var(--bg-card)", border:`1px solid ${plan.is_active?"var(--border)":"rgba(100,100,100,0.3)"}`, borderRadius:12, overflow:"hidden", opacity: plan.is_active?1:0.65 }}>
                  <div style={{ height:3, background: plan.is_free?"var(--teal)":plan.price_monthly<700?"var(--blue)":"var(--warn)" }} />
                  <div style={{ padding:"18px 20px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <h3 style={{ fontFamily:"var(--font-main)", fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{plan.name}</h3>
                        <p style={{ fontSize:11, color:"var(--text-muted)" }}>{plan.description}</p>
                      </div>
                      {!plan.is_active && <span style={{ fontSize:10, background:"rgba(100,100,100,0.2)", color:"#888", borderRadius:20, padding:"2px 8px" }}>Inactive</span>}
                    </div>

                    <div style={{ marginBottom:14 }}>
                      {plan.is_free ? (
                        <div style={{ fontFamily:"var(--font-main)", fontSize:20, fontWeight:700, color:"var(--teal)" }}>Free — {plan.trial_days}d Trial</div>
                      ) : (
                        <div>
                          <span style={{ fontFamily:"var(--font-main)", fontSize:20, fontWeight:700, color:"var(--text-primary)" }}>₹{plan.price_monthly}/mo</span>
                          {plan.price_yearly>0 && <span style={{ fontSize:12, color:"var(--text-muted)", marginLeft:8 }}>₹{plan.price_yearly}/yr</span>}
                        </div>
                      )}
                      <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>
                        Leads: {plan.max_leads===-1||plan.max_leads==="-1"?"Unlimited":plan.max_leads} &nbsp;•&nbsp; Customers: {plan.max_customers===-1||plan.max_customers==="-1"?"Unlimited":plan.max_customers}
                      </div>
                    </div>

                    <ul style={{ listStyle:"none", margin:"0 0 16px", padding:0 }}>
                      {features.slice(0,4).map((f,i)=>(
                        <li key={i} style={{ fontSize:11, color:"var(--text-secondary)", marginBottom:4, display:"flex", gap:6 }}>
                          <span style={{ color:"var(--success)" }}>✓</span>{f}
                        </li>
                      ))}
                      {features.length>4 && <li style={{ fontSize:11, color:"var(--text-muted)" }}>+{features.length-4} more...</li>}
                    </ul>

                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>openEdit(plan)} style={{ flex:1, padding:"7px", borderRadius:7, background:"transparent", border:"1px solid var(--border)", color:"var(--teal)", fontSize:12, cursor:"pointer", fontWeight:600 }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="var(--teal)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>Edit</button>
                      <button onClick={()=>deletePlan(plan.id)} style={{ padding:"7px 12px", borderRadius:7, background:"transparent", border:"1px solid var(--border)", color:"var(--danger)", fontSize:12, cursor:"pointer" }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="var(--danger)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create/Edit Plan Modal */}
      {showForm && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-strong)", borderRadius:14, padding:"26px 24px", width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
              <h2 style={{ fontFamily:"var(--font-main)", fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{editPlan?"Edit Plan":"Create New Plan"}</h2>
              <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:20, cursor:"pointer" }}>✕</button>
            </div>
            <form onSubmit={savePlan}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <Lbl>Plan Name *</Lbl>
                  <input name="name" value={form.name} onChange={handle} required placeholder="e.g. Pro" style={inp} />
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <Lbl>Description</Lbl>
                  <input name="description" value={form.description} onChange={handle} placeholder="Brief description" style={inp} />
                </div>
                <div>
                  <Lbl>Monthly Price (₹)</Lbl>
                  <input name="price_monthly" type="number" value={form.price_monthly} onChange={handle} placeholder="499" style={inp} />
                </div>
                <div>
                  <Lbl>Yearly Price (₹)</Lbl>
                  <input name="price_yearly" type="number" value={form.price_yearly} onChange={handle} placeholder="4999" style={inp} />
                </div>
                <div>
                  <Lbl>Trial Days</Lbl>
                  <input name="trial_days" type="number" value={form.trial_days} onChange={handle} placeholder="0" style={inp} />
                </div>
                <div>
                  <Lbl>Sort Order</Lbl>
                  <input name="sort_order" type="number" value={form.sort_order} onChange={handle} placeholder="0" style={inp} />
                </div>
                <div>
                  <Lbl>Max Leads (-1 = unlimited)</Lbl>
                  <input name="max_leads" type="number" value={form.max_leads} onChange={handle} placeholder="-1" style={inp} />
                </div>
                <div>
                  <Lbl>Max Customers (-1 = unlimited)</Lbl>
                  <input name="max_customers" type="number" value={form.max_customers} onChange={handle} placeholder="-1" style={inp} />
                </div>

                {/* Toggles */}
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="checkbox" name="is_free" id="is_free" checked={!!form.is_free} onChange={handle} />
                  <label htmlFor="is_free" style={{ fontSize:13, color:"var(--text-secondary)", cursor:"pointer" }}>Free / Trial Plan</label>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="checkbox" name="is_active" id="is_active" checked={!!form.is_active} onChange={handle} />
                  <label htmlFor="is_active" style={{ fontSize:13, color:"var(--text-secondary)", cursor:"pointer" }}>Active (visible to users)</label>
                </div>

                <div style={{ gridColumn:"1/-1" }}>
                  <Lbl>Features (one per line)</Lbl>
                  <textarea name="features" value={form.features} onChange={handle} rows={5} placeholder={"Unlimited Leads\nPayment Tracking\nAutomation\nEmail Support"} style={{ ...inp, resize:"vertical", minHeight:100 }} />
                </div>
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20 }}>
                <button type="button" onClick={()=>setShowForm(false)} style={{ padding:"9px 18px", borderRadius:8, background:"transparent", border:"1px solid var(--border)", color:"var(--text-secondary)", fontSize:13, cursor:"pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding:"9px 20px", borderRadius:8, background:saving?"var(--bg-hover)":"var(--teal)", border:"none", color:"#fff", fontFamily:"var(--font-main)", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  {saving?"Saving...":(editPlan?"Update Plan":"Create Plan")}
                </button>
              </div>
            </form>
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
