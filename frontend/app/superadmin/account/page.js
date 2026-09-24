"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import SuperAdminShell from "../SuperAdminShell";

const inp = { width: "100%", padding: "9px 11px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 13, outline: "none" };
function Lbl({ children }) {
  return <label style={{ display: "block", fontSize: 10, color: "var(--text-secondary)", marginBottom: 5, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-main)" }}>{children}</label>;
}

export default function SuperAdminAccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("crm_user");
    if (!user) { router.push("/login"); return; }
    if (JSON.parse(user).role !== "superadmin") { router.push("/dashboard"); return; }
    load();
  }, []);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/superadmin/account");
      setAccount(data);
      setForm({ name: data.name, email: data.email });
    } catch {} finally { setLoading(false); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put("/superadmin/account", form);
      setAccount(data);
      // Keep the cached user's name in sync so the sidebar/header reflect
      // the change immediately without a re-login.
      const cached = JSON.parse(localStorage.getItem("crm_user") || "{}");
      localStorage.setItem("crm_user", JSON.stringify({ ...cached, name: data.name, email: data.email }));
      showToast("Account details updated!");
    } catch (err) { showToast(err.response?.data?.error || "Failed to update", "error"); }
    setSavingProfile(false);
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      showToast("New passwords don't match", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await api.put("/superadmin/account/password", pwForm);
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      showToast("Password changed!");
    } catch (err) { showToast(err.response?.data?.error || "Failed to change password", "error"); }
    setSavingPassword(false);
  };

  if (loading || !account) {
    return (
      <SuperAdminShell>
        <div style={{ color: "var(--text-muted)" }}>Loading…</div>
      </SuperAdminShell>
    );
  }

  return (
    <SuperAdminShell>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "success" ? "var(--success)" : "var(--danger)", color: "#fff", borderRadius: 10, padding: "12px 20px", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>{toast.msg}</div>}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-main)", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Account Settings</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Manage your own Super Admin login</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 820 }}>
        <form onSubmit={saveProfile} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontFamily: "var(--font-main)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Profile</h2>
          <div style={{ marginBottom: 14 }}>
            <Lbl>Name</Lbl>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={inp} required />
          </div>
          <div style={{ marginBottom: 18 }}>
            <Lbl>Email</Lbl>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inp} required />
          </div>
          <button type="submit" disabled={savingProfile} style={{ padding: "9px 20px", borderRadius: 8, background: savingProfile ? "var(--bg-hover)" : "var(--teal)", border: "none", color: "#fff", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {savingProfile ? "Saving…" : "Save Profile"}
          </button>
        </form>

        <form onSubmit={savePassword} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <h2 style={{ fontFamily: "var(--font-main)", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Change Password</h2>
          <div style={{ marginBottom: 14 }}>
            <Lbl>Current Password</Lbl>
            <input type="password" value={pwForm.current_password} onChange={(e) => setPwForm((f) => ({ ...f, current_password: e.target.value }))} style={inp} required />
          </div>
          <div style={{ marginBottom: 14 }}>
            <Lbl>New Password</Lbl>
            <input type="password" value={pwForm.new_password} onChange={(e) => setPwForm((f) => ({ ...f, new_password: e.target.value }))} style={inp} minLength={8} required />
          </div>
          <div style={{ marginBottom: 18 }}>
            <Lbl>Confirm New Password</Lbl>
            <input type="password" value={pwForm.confirm_password} onChange={(e) => setPwForm((f) => ({ ...f, confirm_password: e.target.value }))} style={inp} minLength={8} required />
          </div>
          <button type="submit" disabled={savingPassword} style={{ padding: "9px 20px", borderRadius: 8, background: savingPassword ? "var(--bg-hover)" : "var(--teal)", border: "none", color: "#fff", fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            {savingPassword ? "Changing…" : "Change Password"}
          </button>
        </form>
      </div>
    </SuperAdminShell>
  );
}
