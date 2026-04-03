"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, form);
      localStorage.setItem("crm_token", data.token);
      localStorage.setItem("crm_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
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
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Image
            src="/logo.png"
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
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            {mode === "login"
              ? "Sign in to your coach workspace"
              : "Start tracking your conversations"}
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

          <form onSubmit={submit}>
            {mode === "register" && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handle}
                  placeholder="Your name"
                  required
                  style={inputStyle}
                />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handle}
                placeholder="you@email.com"
                required
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={labelStyle}>Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handle}
                placeholder="••••••••"
                required
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                background: loading ? "var(--bg-hover)" : "var(--teal)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontFamily: "var(--font-main)",
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() => {
                setMode((m) => (m === "login" ? "register" : "login"));
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--teal)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {mode === "login" ? "Register" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  color: "var(--text-secondary)",
  marginBottom: 6,
  fontWeight: 500,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontFamily: "var(--font-main)",
};
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
  transition: "border-color 0.2s",
};
