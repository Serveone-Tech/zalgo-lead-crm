"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("crm_token") : "";
  return { Authorization: `Bearer ${token}` };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    website: "",
    logo_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (!localStorage.getItem("crm_token")) router.push("/login");
    setTheme(localStorage.getItem("crm_theme") || "dark");
  }, []);

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Organisation name is required");
    setSaving(true);
    setError("");
    try {
      await axios.post(`${BASE}/auth/onboarding`, form, {
        headers: authHeaders(),
      });
      const user = JSON.parse(localStorage.getItem("crm_user") || "{}");
      localStorage.setItem(
        "crm_user",
        JSON.stringify({ ...user, onboarded: true }),
      );
      router.push("/plans");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
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
      <div style={{ width: "100%", maxWidth: 580 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Image
            src={theme === "light" ? "/logo_light.png" : "/logo_dark.png"}
            alt="Zalgo Infotech"
            width={150}
            height={45}
            style={{ objectFit: "contain" }}
          />
          <h2
            style={{
              fontFamily: "var(--font-main)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginTop: 16,
              marginBottom: 6,
            }}
          >
            Set up your organisation
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Tell us about your coaching business
          </p>
        </div>

        {/* Steps */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            alignItems: "center",
            marginBottom: 28,
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
                      background:
                        i === 0
                          ? "var(--success)"
                          : i === 1
                            ? "var(--teal)"
                            : "var(--bg-card)",
                      border: `2px solid ${i === 0 ? "var(--success)" : i === 1 ? "var(--teal)" : "var(--border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: i < 2 ? "#fff" : "var(--text-muted)",
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    {i === 0 ? "✓" : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color:
                        i === 0
                          ? "var(--success)"
                          : i === 1
                            ? "var(--teal)"
                            : "var(--text-muted)",
                      fontFamily: "var(--font-main)",
                      fontWeight: i <= 1 ? 600 : 400,
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

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "32px 28px",
          }}
        >
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Logo preview */}
              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>Organisation Logo URL</label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <input
                    name="logo_url"
                    value={form.logo_url}
                    onChange={handle}
                    placeholder="https://yoursite.com/logo.png"
                    style={{ ...inp, flex: 1 }}
                  />
                  {form.logo_url && (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "var(--bg-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={form.logo_url}
                        alt="preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  Paste a publicly accessible image URL
                </div>
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>Organisation / Institute Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handle}
                  placeholder="e.g. Zalgo EduTech Coaching"
                  required
                  style={inp}
                />
              </div>

              <div>
                <label style={lbl}>Business Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handle}
                  placeholder="info@yourorg.com"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handle}
                  placeholder="+91 98765 43210"
                  style={inp}
                />
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handle}
                  placeholder="Street address, building, etc."
                  style={inp}
                />
              </div>

              <div>
                <label style={lbl}>City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handle}
                  placeholder="Mumbai"
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>State</label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handle}
                  placeholder="Maharashtra"
                  style={inp}
                />
              </div>

              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>Website (optional)</label>
                <input
                  name="website"
                  value={form.website}
                  onChange={handle}
                  placeholder="https://yourwebsite.com"
                  style={inp}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",
                marginTop: 24,
                padding: "12px",
                background: saving ? "var(--bg-hover)" : "var(--teal)",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                fontFamily: "var(--font-main)",
                fontWeight: 600,
                fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save & Choose Plan →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const lbl = {
  display: "block",
  fontSize: 10,
  color: "var(--text-secondary)",
  marginBottom: 6,
  fontWeight: 500,
  letterSpacing: "0.05em",
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
  fontSize: 13,
  outline: "none",
};
