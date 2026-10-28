"use client";
import { useState } from "react";
import { CheckCircle2, Loader2, Target } from "lucide-react";
import api from "../lib/api";

// Meta Lead Ads connect — a Facebook Login popup that lets a tenant connect
// a Facebook Page they manage, so lead-form submissions on their Meta/
// Instagram ads land straight in Leads instead of a manual CSV export.
// Shares the same Facebook SDK loader as WhatsAppEmbeddedSignup (the SDK is
// app-wide, not per-feature) — if that component is also rendered on this
// page, the second loadFacebookSdk() call just resolves immediately since
// window.FB already exists; FB.login() itself is what carries the specific
// permission scopes for this feature, requested fresh on every connect.
let fbSdkPromise = null;
function loadFacebookSdk(appId) {
  if (fbSdkPromise) return fbSdkPromise;
  fbSdkPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    if (window.FB) return resolve(window.FB);

    window.fbAsyncInit = function () {
      window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version: "v20.0" });
      resolve(window.FB);
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Could not load the Facebook SDK"));
    document.body.appendChild(script);
  });
  return fbSdkPromise;
}

export default function FacebookLeadAdsConnect({ status, onConnected, onDisconnected }) {
  const [state, setState] = useState("idle"); // idle | loading | connecting | picking | error
  const [error, setError] = useState("");
  const [pages, setPages] = useState([]);

  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const configured = !!appId;

  const finishConnection = async (code) => {
    setState("connecting");
    try {
      const { data } = await api.post("/meta-ads/connect", { code });
      if (data?.needsSelection) {
        setPages(data.pages || []);
        setState("picking");
        return;
      }
      setState("idle");
      onConnected?.(data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not connect this Facebook Page");
      setState("error");
    }
  };

  const selectPage = async (page) => {
    setState("connecting");
    try {
      const { data } = await api.post("/meta-ads/connect-page", page);
      setState("idle");
      setPages([]);
      onConnected?.(data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not connect this Facebook Page");
      setState("error");
    }
  };

  const connect = async () => {
    setError("");
    setState("loading");
    try {
      const FB = await loadFacebookSdk(appId);
      FB.login(
        (response) => {
          const code = response?.authResponse?.code;
          if (code) {
            finishConnection(code);
          } else {
            setState("idle");
          }
        },
        {
          scope: "pages_show_list,leads_retrieval,pages_manage_ads,pages_read_engagement",
          response_type: "code",
          override_default_response_type: true,
        },
      );
    } catch (e) {
      setError(e.message || "Could not open the Facebook login popup");
      setState("error");
    }
  };

  const disconnect = async () => {
    setState("connecting");
    try {
      await api.delete("/meta-ads");
      onDisconnected?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not disconnect");
      setState("error");
    } finally {
      setState("idle");
    }
  };

  if (!configured) {
    return (
      <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 16, padding: "10px 12px", background: "var(--bg-surface)", borderRadius: 8 }}>
        Meta Lead Ads connect isn't set up on this server yet.
      </div>
    );
  }

  if (status?.page_id) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: 8, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle2 size={18} color="var(--success)" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-main)" }}>
              Connected — {status.page_name || status.page_id}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              New lead-form submissions on this Page arrive in Leads automatically.
            </div>
          </div>
        </div>
        <button
          onClick={disconnect}
          disabled={state === "connecting"}
          style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px", fontSize: 11.5, fontWeight: 600, color: "var(--danger)", cursor: "pointer" }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (state === "picking") {
    return (
      <div style={{ marginBottom: 16, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, fontFamily: "var(--font-main)" }}>
          Choose which Page to connect
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPage(p)}
              disabled={state === "connecting"}
              style={{ textAlign: "left", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", fontSize: 12.5 }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={connect}
        disabled={state === "loading" || state === "connecting"}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "12px 18px", borderRadius: 8, border: "none",
          background: state === "loading" || state === "connecting" ? "var(--bg-hover)" : "var(--gradient-accent)",
          color: "#fff", fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 13.5,
          cursor: state === "loading" || state === "connecting" ? "not-allowed" : "pointer",
          boxShadow: state === "loading" || state === "connecting" ? "none" : "var(--shadow-glow)",
        }}
      >
        {state === "connecting" ? (
          <><Loader2 size={16} className="spin" /> Connecting your Page…</>
        ) : state === "loading" ? (
          <><Loader2 size={16} className="spin" /> Opening Facebook…</>
        ) : (
          <><Target size={16} /> Connect Facebook Page for Lead Ads</>
        )}
      </button>
      {error && <div style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 8 }}>{error}</div>}
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
        Lets you capture leads from Facebook & Instagram lead-generation ads automatically.
      </div>
    </div>
  );
}
