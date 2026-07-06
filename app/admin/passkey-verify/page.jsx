"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";

export default function PasskeyVerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState("idle"); // idle | working | error
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setStatus("working");
    setError("");
    try {
      const optionsRes = await fetch("/api/admin/passkey/login-options");
      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        setError(options.error || "Nem sikerült elindítani a passkey ellenőrzést");
        setStatus("error");
        return;
      }

      let authResp;
      try {
        authResp = await startAuthentication(options);
      } catch (e) {
        // Log the real WebAuthn error so mismatches (wrong rpID/origin, no
        // matching credential on this device, user cancelled, etc.) are
        // diagnosable instead of only showing a generic message.
        console.error("WebAuthn authentication error:", e?.name, e?.message, e);
        const friendly =
          e?.name === "NotAllowedError"
            ? "A passkey ellenőrzés megszakadt, vagy ez az eszköz/böngésző nem rendelkezik a regisztrált passkey-vel. Próbáld ugyanazzal az eszközzel és ugyanazon a domainen, ahol a passkey-t regisztráltad."
            : "A passkey ellenőrzés megszakadt vagy nem sikerült ezen az eszközön";
        setError(friendly);
        setStatus("error");
        return;
      }

      const verifyRes = await fetch("/api/admin/passkey/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authResp),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.verified) {
        setError(verifyData.error || "A passkey ellenőrzés nem sikerült");
        setStatus("error");
        return;
      }

      router.push("/admin/dashboard");
    } catch (e) {
      setError("Hálózati hiba történt");
      setStatus("error");
    }
  };

  return (
    <div className="pvPage">
      <div className="pvCard">
        <h1 className="pvTitle">Erősítsd meg a passkey-eddel</h1>
        <p className="pvSubtitle">
          A jelszavad rendben volt. Az utolsó lépésként igazold magad a regisztrált passkey-vel a
          belépéshez.
        </p>

        {error && <div className="pvError">{error}</div>}

        <button type="button" className="pvButton" onClick={handleVerify} disabled={status === "working"}>
          {status === "working" ? "Folyamatban..." : "Belépés passkey-vel"}
        </button>
      </div>

      <style jsx>{`
        .pvPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.14), transparent 22%),
            radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 18%),
            linear-gradient(140deg, #0f172a 0%, #1f2937 45%, #0f172a 100%);
          padding: 20px;
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }
        .pvCard {
          width: 100%;
          max-width: 480px;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 28px;
          padding: 40px 34px;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(18px);
        }
        .pvTitle {
          font-size: 26px;
          font-weight: 900;
          margin: 0 0 14px;
          color: #f8fafc;
          text-align: center;
        }
        .pvSubtitle {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(226, 232, 240, 0.75);
          text-align: center;
          margin: 0 0 26px;
        }
        .pvError {
          padding: 12px 14px;
          background: rgba(248, 113, 113, 0.14);
          border: 1px solid rgba(248, 113, 113, 0.28);
          border-radius: 12px;
          color: #fecaca;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 18px;
        }
        .pvButton {
          width: 100%;
          padding: 15px 20px;
          background: linear-gradient(135deg, #8f7cff, #6f5cd6);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-weight: 900;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 12px 30px rgba(143, 124, 255, 0.3);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .pvButton:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 16px 36px rgba(143, 124, 255, 0.4);
        }
        .pvButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
