"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";

export default function PasskeySetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState("idle"); // idle | working | error
  const [error, setError] = useState("");

  const handleSetup = async () => {
    setStatus("working");
    setError("");
    try {
      const optionsRes = await fetch("/api/admin/passkey/register-options");
      const options = await optionsRes.json();
      if (!optionsRes.ok) {
        setError(options.error || "Nem sikerült elindítani a passkey beállítást");
        setStatus("error");
        return;
      }

      let attResp;
      try {
        attResp = await startRegistration(options);
      } catch (e) {
        setError("A passkey létrehozása megszakadt vagy nem sikerült ezen az eszközön");
        setStatus("error");
        return;
      }

      const verifyRes = await fetch("/api/admin/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attResp),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.verified) {
        const detail = verifyData.debug ? ` (${verifyData.debug})` : "";
        setError((verifyData.error || "A passkey mentése nem sikerült") + detail);
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
    <div className="pkPage">
      <div className="pkCard">
        <h1 className="pkTitle">Állíts be egy passkey-t</h1>
        <p className="pkSubtitle">
          Az admin fiókod biztonsága érdekében minden 24 órában szükség lesz egy passkey-re a
          bejelentkezéshez a jelszó mellett. Állítsd be most az eszközödön (ujjlenyomat, arcfelismerés,
          biztonsági kulcs, vagy a Google jelszókezelő).
        </p>

        {error && <div className="pkError">{error}</div>}

        <button type="button" className="pkButton" onClick={handleSetup} disabled={status === "working"}>
          {status === "working" ? "Folyamatban..." : "Passkey beállítása"}
        </button>

        <p className="pkHint">
          A böngésződ meg fogja kérdezni, hogyan szeretnéd tárolni a passkey-t (pl. telefon, jelszókezelő,
          biztonsági kulcs).
        </p>
      </div>

      <style jsx>{`
        .pkPage {
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
        .pkCard {
          width: 100%;
          max-width: 480px;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 28px;
          padding: 40px 34px;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(18px);
        }
        .pkTitle {
          font-size: 26px;
          font-weight: 900;
          margin: 0 0 14px;
          color: #f8fafc;
          text-align: center;
        }
        .pkSubtitle {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(226, 232, 240, 0.75);
          text-align: center;
          margin: 0 0 26px;
        }
        .pkError {
          padding: 12px 14px;
          background: rgba(248, 113, 113, 0.14);
          border: 1px solid rgba(248, 113, 113, 0.28);
          border-radius: 12px;
          color: #fecaca;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 18px;
        }
        .pkButton {
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
        .pkButton:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 16px 36px rgba(143, 124, 255, 0.4);
        }
        .pkButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .pkHint {
          margin: 18px 0 0;
          font-size: 12px;
          color: rgba(226, 232, 240, 0.5);
          text-align: center;
        }
      `}</style>
    </div>
  );
}
