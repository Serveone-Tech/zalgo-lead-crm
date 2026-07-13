"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");

  // forgot password flow: null | 'email' | 'otp' | 'reset'
  const [fpStep, setFpStep] = useState(null);
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpResetToken, setFpResetToken] = useState("");
  const [fpNew, setFpNew] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpSuccess, setFpSuccess] = useState("");

  useEffect(() => {
    setTheme(localStorage.getItem("crm_theme") || "dark");
    const token = localStorage.getItem("crm_token");
    const user = localStorage.getItem("crm_user");
    if (token && user) {
      try {
        const u = JSON.parse(user);
        if (u.role === "superadmin") window.location.href = "/superadmin";
        else window.location.href = "/dashboard";
      } catch {}
    }
  }, []);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE}/auth/login`, form);
      localStorage.setItem("crm_token", data.token);
      localStorage.setItem("crm_user", JSON.stringify(data.user));
      window.location.href = data.redirect || "/dashboard";
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
      setLoading(false);
    }
  };

  // ── Forgot password handlers ───────────────────────────────────
  const openForgot = () => {
    setFpStep("email");
    setFpEmail(form.email); // pre-fill if already typed
    setFpOtp(""); setFpResetToken(""); setFpNew(""); setFpConfirm("");
    setFpError(""); setFpSuccess("");
  };

  const closeForgot = () => {
    setFpStep(null);
    setFpError(""); setFpSuccess("");
  };

  const sendOtp = async () => {
    if (!fpEmail) { setFpError("Please enter your email"); return; }
    setFpLoading(true); setFpError("");
    try {
      await axios.post(`${BASE}/auth/forgot-password`, { email: fpEmail });
      setFpStep("otp");
      setFpSuccess("OTP sent! Check your email.");
    } catch (err) {
      setFpError(err.response?.data?.error || "Failed to send OTP");
    }
    setFpLoading(false);
  };

  const verifyOtp = async () => {
    if (fpOtp.length !== 6) { setFpError("Enter the 6-digit OTP"); return; }
    setFpLoading(true); setFpError(""); setFpSuccess("");
    try {
      const { data } = await axios.post(`${BASE}/auth/verify-otp`, { email: fpEmail, otp: fpOtp });
      setFpResetToken(data.reset_token);
      setFpStep("reset");
      setFpSuccess("");
    } catch (err) {
      setFpError(err.response?.data?.error || "Invalid OTP");
    }
    setFpLoading(false);
  };

  const resetPassword = async () => {
    if (!fpNew || !fpConfirm) { setFpError("Please fill both fields"); return; }
    if (fpNew !== fpConfirm) { setFpError("Passwords do not match"); return; }
    if (fpNew.length < 6) { setFpError("Password must be at least 6 characters"); return; }
    setFpLoading(true); setFpError("");
    try {
      await axios.post(`${BASE}/auth/reset-password`, { reset_token: fpResetToken, new_password: fpNew });
      setFpSuccess("Password reset successfully! You can now log in.");
      setFpStep("done");
    } catch (err) {
      setFpError(err.response?.data?.error || "Failed to reset password");
    }
    setFpLoading(false);
  };

  // ── Shared styles ──────────────────────────────────────────────
  const focusBorder = (e) => (e.target.style.borderColor = "var(--teal)");
  const blurBorder  = (e) => (e.target.style.borderColor = "var(--border)");

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 15% 15%, var(--teal-dim) 0%, transparent 45%), radial-gradient(circle at 85% 85%, var(--teal-dim) 0%, transparent 45%), var(--bg-base)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Image
            src={theme === "light" ? "/logo_light.png" : "/logo_dark.png"}
            alt="Zalgo Infotech" width={180} height={54}
            style={{ objectFit: "contain" }}
          />
          <div style={{
            marginTop: 10, fontSize: 11,
            background: "var(--gradient-accent)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", letterSpacing: "0.18em",
            textTransform: "uppercase", fontFamily: "var(--font-main)", fontWeight: 700,
          }}>
            Lead Management System
          </div>
        </div>

        <div style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "34px 30px",
          boxShadow: "var(--shadow-lg)",
        }}>

          {/* ── LOGIN FORM ─────────────────────────────────────── */}
          {!fpStep && (
            <>
              <h1 style={{ fontFamily: "var(--font-main)", fontSize: 21, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                Welcome back
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
                Sign in to your coach workspace
              </p>

              {error && <ErrBox msg={error} />}

              <form onSubmit={submit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={lbl}>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handle}
                    placeholder="you@email.com" required style={inp}
                    onFocus={focusBorder} onBlur={blurBorder} />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label style={lbl}>Password</label>
                  <input name="password" type="password" value={form.password} onChange={handle}
                    placeholder="••••••••" required style={inp}
                    onFocus={focusBorder} onBlur={blurBorder} />
                </div>

                <div style={{ textAlign: "right", marginBottom: 18 }}>
                  <button type="button" onClick={openForgot} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--teal)", fontSize: 12, fontFamily: "var(--font-main)",
                    fontWeight: 500, padding: 0,
                  }}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: "100%", padding: "12px",
                  background: loading ? "var(--bg-hover)" : "var(--gradient-accent)",
                  color: "#fff", border: "none", borderRadius: "var(--radius-sm)",
                  fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "var(--shadow-glow)",
                }}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-muted)" }}>
                Don&apos;t have an account?{" "}
                <a href="/register" style={{ color: "var(--teal)", fontWeight: 600, textDecoration: "none" }}>
                  Register free
                </a>
              </div>
            </>
          )}

          {/* ── STEP 1: Enter Email ────────────────────────────── */}
          {fpStep === "email" && (
            <>
              <StepHeader title="Forgot Password" subtitle="Enter your registered email address and we'll send you an OTP." />
              {fpError && <ErrBox msg={fpError} />}
              {fpSuccess && <OkBox msg={fpSuccess} />}

              <label style={lbl}>Registered Email</label>
              <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                placeholder="you@email.com" style={{ ...inp, marginBottom: 20 }}
                onFocus={focusBorder} onBlur={blurBorder}
                onKeyDown={e => e.key === "Enter" && sendOtp()} />

              <PrimaryBtn label="Send OTP" loadingLabel="Sending..." loading={fpLoading} onClick={sendOtp} />
              <BackLink onClick={closeForgot} />
            </>
          )}

          {/* ── STEP 2: Enter OTP ─────────────────────────────── */}
          {fpStep === "otp" && (
            <>
              <StepHeader title="Enter OTP" subtitle={`A 6-digit OTP was sent to ${fpEmail}`} />
              {fpError && <ErrBox msg={fpError} />}
              {fpSuccess && <OkBox msg={fpSuccess} />}

              <label style={lbl}>OTP</label>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={fpOtp} onChange={e => setFpOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • • •"
                style={{
                  ...inp, marginBottom: 20,
                  textAlign: "center", fontSize: 22, fontWeight: 700,
                  letterSpacing: "0.35em",
                }}
                onFocus={focusBorder} onBlur={blurBorder}
                onKeyDown={e => e.key === "Enter" && verifyOtp()}
                autoFocus
              />

              <PrimaryBtn label="Verify OTP" loadingLabel="Verifying..." loading={fpLoading} onClick={verifyOtp} />

              <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                Didn&apos;t receive it?{" "}
                <button type="button" onClick={() => { setFpStep("email"); setFpError(""); setFpSuccess(""); }} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--teal)", fontSize: 12, fontWeight: 600, padding: 0,
                }}>
                  Resend OTP
                </button>
              </div>
              <BackLink onClick={closeForgot} />
            </>
          )}

          {/* ── STEP 3: New Password ───────────────────────────── */}
          {fpStep === "reset" && (
            <>
              <StepHeader title="Set New Password" subtitle="Choose a strong password (minimum 6 characters)." />
              {fpError && <ErrBox msg={fpError} />}

              <label style={lbl}>New Password</label>
              <input type="password" value={fpNew} onChange={e => setFpNew(e.target.value)}
                placeholder="••••••••" style={{ ...inp, marginBottom: 14 }}
                onFocus={focusBorder} onBlur={blurBorder} />

              <label style={lbl}>Confirm New Password</label>
              <input type="password" value={fpConfirm} onChange={e => setFpConfirm(e.target.value)}
                placeholder="••••••••" style={{ ...inp, marginBottom: 20 }}
                onFocus={focusBorder} onBlur={blurBorder}
                onKeyDown={e => e.key === "Enter" && resetPassword()} />

              <PrimaryBtn label="Reset Password" loadingLabel="Resetting..." loading={fpLoading} onClick={resetPassword} />
              <BackLink onClick={closeForgot} />
            </>
          )}

          {/* ── DONE ──────────────────────────────────────────── */}
          {fpStep === "done" && (
            <>
              <div style={{ textAlign: "center", padding: "12px 0 24px" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(31,138,92,0.15)", border: "2px solid var(--success)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 style={{ fontFamily: "var(--font-main)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Password Reset!
                </h2>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
                  Your password has been updated successfully.
                </p>
                <button onClick={closeForgot} style={{
                  width: "100%", padding: "12px",
                  background: "var(--gradient-accent)", color: "#fff", border: "none",
                  borderRadius: "var(--radius-sm)", fontFamily: "var(--font-main)",
                  fontWeight: 600, fontSize: 14, cursor: "pointer",
                  boxShadow: "var(--shadow-glow)",
                }}>
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ fontFamily: "var(--font-main)", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
        {title}
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{subtitle}</p>
    </div>
  );
}

function PrimaryBtn({ label, loadingLabel, loading, onClick }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width: "100%", padding: "12px",
      background: loading ? "var(--bg-hover)" : "var(--gradient-accent)",
      color: "#fff", border: "none", borderRadius: "var(--radius-sm)",
      fontFamily: "var(--font-main)", fontWeight: 600, fontSize: 14,
      cursor: loading ? "not-allowed" : "pointer",
      boxShadow: loading ? "none" : "var(--shadow-glow)",
      transition: "background 0.2s",
    }}>
      {loading ? loadingLabel : label}
    </button>
  );
}

function ErrBox({ msg }) {
  return (
    <div style={{
      background: "var(--danger-dim)", border: "1px solid var(--danger)",
      borderRadius: 8, padding: "10px 14px", marginBottom: 16,
      color: "var(--danger)", fontSize: 13,
    }}>{msg}</div>
  );
}

function OkBox({ msg }) {
  return (
    <div style={{
      background: "rgba(31,138,92,0.12)", border: "1px solid var(--success)",
      borderRadius: 8, padding: "10px 14px", marginBottom: 16,
      color: "var(--success)", fontSize: 13, fontWeight: 500,
    }}>{msg}</div>
  );
}

function BackLink({ onClick }) {
  return (
    <div style={{ textAlign: "center", marginTop: 16 }}>
      <button type="button" onClick={onClick} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "var(--text-muted)", fontSize: 12, fontFamily: "var(--font-main)",
      }}>
        ← Back to Login
      </button>
    </div>
  );
}

const lbl = {
  display: "block", fontSize: 11, color: "var(--text-secondary)", marginBottom: 6,
  fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase",
  fontFamily: "var(--font-main)",
};
const inp = {
  width: "100%", padding: "10px 12px", background: "var(--bg-input)",
  border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)",
  fontSize: 14, outline: "none", transition: "border-color 0.2s",
  boxSizing: "border-box",
};
