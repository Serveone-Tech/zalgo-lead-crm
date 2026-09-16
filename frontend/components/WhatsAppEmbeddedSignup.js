"use client";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import api from "../lib/api";

// Meta WhatsApp Embedded Signup — a Facebook login popup that lets a
// tenant connect their own WhatsApp Business Account without ever typing a
// Phone Number ID / Access Token / WABA ID by hand (the fields below this
// button still exist as a manual fallback for tenants who'd rather paste
// credentials themselves, or whose account was set up before this existed).
//
// Two async things Meta hands back that both have to be combined before
// this can be saved server-side:
//  1. FB.login()'s own callback — a one-time authorization `code`.
//  2. A separate `window.postMessage` event (type "WA_EMBEDDED_SIGNUP")
//     Meta's popup sends mid-flow, carrying the actual waba_id/phone_number_id
//     that got connected — the code itself doesn't contain these.
// Only once both have arrived does this call the backend to finish setup.
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

export default function WhatsAppEmbeddedSignup({ onConnected }) {
  const [status, setStatus] = useState("idle"); // idle | loading | connecting | success | error
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const sessionInfo = useRef(null); // { waba_id, phone_number_id } from the message event

  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const configId = process.env.NEXT_PUBLIC_META_CONFIG_ID;
  const configured = !!(appId && configId);

  useEffect(() => {
    if (!configured) return;
    const handler = (event) => {
      if (!event.origin?.includes("facebook.com")) return;
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data?.type === "WA_EMBEDDED_SIGNUP" && data?.event === "FINISH") {
        sessionInfo.current = {
          waba_id: data.data?.waba_id,
          phone_number_id: data.data?.phone_number_id,
        };
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [configured]);

  const finishConnection = async (code) => {
    setStatus("connecting");
    try {
      const info = sessionInfo.current;
      if (!info?.waba_id || !info?.phone_number_id) {
        throw new Error("Meta didn't send back a WhatsApp Business Account — please try connecting again.");
      }
      const { data } = await api.post("/automation/whatsapp/embedded-signup", {
        code,
        waba_id: info.waba_id,
        phone_number_id: info.phone_number_id,
      });
      setResult(data);
      setStatus("success");
      onConnected?.(data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not complete the connection");
      setStatus("error");
    }
  };

  const connect = async () => {
    setError("");
    setStatus("loading");
    sessionInfo.current = null;
    try {
      const FB = await loadFacebookSdk(appId);
      FB.login(
        (response) => {
          const code = response?.authResponse?.code;
          if (code) {
            finishConnection(code);
          } else {
            setStatus("idle");
          }
        },
        {
          config_id: configId,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {}, featureType: "whatsapp_business_app_onboarding", sessionInfoVersion: "3" },
        },
      );
    } catch (e) {
      setError(e.message || "Could not open the Facebook login popup");
      setStatus("error");
    }
  };

  if (!configured) {
    return (
      <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 16, padding: "10px 12px", background: "var(--bg-surface)", borderRadius: 8 }}>
        One-click WhatsApp connect isn't set up on this server yet — use the manual fields below for now.
      </div>
    );
  }

  if (status === "success" && result) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--success-dim)", border: "1px solid var(--success)", borderRadius: 8, marginBottom: 16 }}>
        <CheckCircle2 size={18} color="var(--success)" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-main)" }}>
            WhatsApp connected{result.display_phone_number ? ` — ${result.display_phone_number}` : ""}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {result.verified_name || "Your WhatsApp Business Account"} is now linked to this CRM.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={connect}
        disabled={status === "loading" || status === "connecting"}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "12px 18px", borderRadius: 8, border: "none",
          background: status === "loading" || status === "connecting" ? "var(--bg-hover)" : "var(--gradient-accent)",
          color: "#fff", fontFamily: "var(--font-main)", fontWeight: 700, fontSize: 13.5,
          cursor: status === "loading" || status === "connecting" ? "not-allowed" : "pointer",
          boxShadow: status === "loading" || status === "connecting" ? "none" : "var(--shadow-glow)",
        }}
      >
        {status === "connecting" ? (
          <><Loader2 size={16} className="spin" /> Connecting your WhatsApp…</>
        ) : status === "loading" ? (
          <><Loader2 size={16} className="spin" /> Opening Facebook…</>
        ) : (
          <><MessageCircle size={16} /> Connect WhatsApp with Facebook</>
        )}
      </button>
      {error && <div style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 8 }}>{error}</div>}
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
        Recommended — no need to copy any IDs or tokens by hand.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        <span style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>or configure manually</span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>
    </div>
  );
}
