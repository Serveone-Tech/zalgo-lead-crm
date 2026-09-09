"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";

// Direct axios — no api.js dependency
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [step, setStep] = useState("form"); // 'form' | 'otp'
  const [otp, setOtp] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setTheme(localStorage.getItem("crm_theme") || "dark");
    const params = new URLSearchParams(window.location.search);
    const verifyEmail = params.get("verifyEmail");
    if (verifyEmail) {
      setForm((f) => ({ ...f, email: verifyEmail }));
      setStep("otp");
      setOtpMsg("Sending a new OTP...");
      axios
        .post(`${BASE}/auth/register/resend-otp`, { email: verifyEmail })
        .then(() => setOtpMsg(`We sent a 6-digit OTP to ${verifyEmail}`))
        .catch((err) => setError(err.response?.data?.error || "Failed to send OTP"));
    }
  }, []);

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm)
      return setError("Passwords do not match");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE}/auth/register`, {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (data.email_verification_required) {
        setStep("otp");
        setOtpMsg(`We sent a 6-digit OTP to ${form.email}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) return setError("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE}/auth/register/verify-otp`, {
        email: form.email,
        otp,
      });
      localStorage.setItem("crm_token", data.token);
      localStorage.setItem("crm_user", JSON.stringify(data.user));
      router.push("/onboarding");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setOtpMsg("");
    setResending(true);
    try {
      await axios.post(`${BASE}/auth/register/resend-otp`, { email: form.email });
      setOtpMsg("A new OTP has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image
            src={theme === "light" ? "/logo_light.png" : "/logo_dark.png"}
            alt="Zalgo Infotech"
            width={180}
            height={54}
            style={{ objectFit: "contain" }}
          />
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: "var(--teal)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "var(--font-main)",
              fontWeight: 500,
            }}
          >
            Lead Management System
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "32px 28px",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-main)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Create account
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            Start managing your leads and customers
          </p>

          {error && (
            <div
              style={{
                background: "var(--danger-dim)",
                border: "1px solid var(--danger)",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                color: "var(--danger)",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {step === "form" && (
            <form onSubmit={submit}>
              {[
                {
                  name: "name",
                  label: "Full Name",
                  type: "text",
                  ph: "Your full name",
                },
                {
                  name: "email",
                  label: "Email",
                  type: "email",
                  ph: "you@email.com",
                },
                {
                  name: "password",
                  label: "Password",
                  type: "password",
                  ph: "Min 6 characters",
                },
                {
                  name: "confirm",
                  label: "Confirm Password",
                  type: "password",
                  ph: "Repeat password",
                },
              ].map((f) => (
                <div key={f.name} style={{ marginBottom: 14 }}>
                  <label style={lbl}>{f.label}</label>
                  <input
                    name={f.name}
                    type={f.type}
                    value={form[f.name]}
                    onChange={handle}
                    placeholder={f.ph}
                    required
                    style={inp}
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "11px",
                  marginTop: 8,
                  background: loading ? "var(--bg-hover)" : "var(--teal)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontFamily: "var(--font-main)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Creating account..." : "Create Account →"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={verifyOtp}>
              {otpMsg && (
                <div
                  style={{
                    background: "var(--teal-dim)",
                    border: "1px solid var(--teal)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    color: "var(--teal-light)",
                    fontSize: 12.5,
                  }}
                >
                  {otpMsg}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Enter OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  required
                  style={{ ...inp, letterSpacing: "0.3em", textAlign: "center", fontSize: 18 }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "11px",
                  marginTop: 8,
                  background: loading ? "var(--bg-hover)" : "var(--teal)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontFamily: "var(--font-main)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Verifying..." : "Verify & Continue →"}
              </button>
              <div style={{ textAlign: "center", marginTop: 14 }}>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resending}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--teal)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: resending ? "not-allowed" : "pointer",
                  }}
                >
                  {resending ? "Resending..." : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            Already have an account?{" "}
            <a
              href="/login"
              style={{
                color: "var(--teal)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </a>
          </div>
        </div>

        {/* Steps indicator */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "center",
            gap: 8,
            alignItems: "center",
          }}
        >
          {["Register", "Organisation", "Choose Plan", "Dashboard"].map(
            (s, i) => (
              <div
                key={s}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: i === 0 ? "var(--teal)" : "var(--bg-card)",
                      border: `2px solid ${i === 0 ? "var(--teal)" : "var(--border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: i === 0 ? "#fff" : "var(--text-muted)",
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-main)",
                      color: i === 0 ? "var(--teal)" : "var(--text-muted)",
                      fontWeight: i === 0 ? 600 : 400,
                    }}
                  >
                    {s}
                  </span>
                </div>
                {i < 3 && (
                  <span style={{ color: "var(--border)", fontSize: 16 }}>
                    ›
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

const lbl = {
  display: "block",
  fontSize: 11,
  color: "var(--text-secondary)",
  marginBottom: 6,
  fontWeight: 500,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontFamily: "var(--font-main)",
};
const inp = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
};
