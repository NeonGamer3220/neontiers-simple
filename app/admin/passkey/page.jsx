"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Second login factor, as its own page (neontiers.hu/admin/passkey)
// instead of a popup glued to the login form. Only reachable mid-login:
// you land here after the password step succeeds (session is "pending"
// but not passkey_verified yet). Landing here with no pending session
// bounces back to /admin to start over, and landing here already fully
// authenticated skips straight to the dashboard.
export default function AdminPasskeyPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(null); // "setup" | "verify"

  const [passkeyStatus, setPasskeyStatus] = useState("idle"); // idle | working | error
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeyValue, setPasskeyValue] = useState("");
  const [passkeyConfirm, setPasskeyConfirm] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (res.ok) {
        router.push("/admin/dashboard");
        return;
      }
      try {
        const data = await res.json();
        if (data?.pending) {
          setStep(data.hasPasskey ? "verify" : "setup");
          setChecking(false);
          return;
        }
      } catch {
        // fall through to redirect below
      }
      // No pending session — the person needs to log in with their
      // password first before they can reach this step.
      router.push("/admin");
    };
    checkAuth();
  }, [router]);

  const handlePasskeySetup = async (e) => {
    e.preventDefault();
    setPasskeyError("");

    if (passkeyValue.length < 6) {
      setPasskeyError("A passkey legalább 6 karakter legyen");
      return;
    }
    if (passkeyValue !== passkeyConfirm) {
      setPasskeyError("A két passkey nem egyezik");
      return;
    }

    setPasskeyStatus("working");
    try {
      const res = await fetch("/api/admin/passkey/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: passkeyValue }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPasskeyError(data.error || "A passkey mentése nem sikerült");
        setPasskeyStatus("error");
        return;
      }

      router.push("/admin/dashboard");
    } catch (e) {
      setPasskeyError("Hálózati hiba történt");
      setPasskeyStatus("error");
    }
  };

  const handlePasskeyVerify = async (e) => {
    e.preventDefault();
    setPasskeyError("");

    if (!passkeyValue) {
      setPasskeyError("Add meg a passkey-t");
      return;
    }

    setPasskeyStatus("working");
    try {
      const res = await fetch("/api/admin/passkey/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: passkeyValue }),
      });
      const data = await res.json();

      if (!res.ok || !data.verified) {
        setPasskeyError(data.error || "A passkey ellenőrzés nem sikerült");
        setPasskeyStatus("error");
        setPasskeyValue("");
        return;
      }

      router.push("/admin/dashboard");
    } catch (e) {
      setPasskeyError("Hálózati hiba történt");
      setPasskeyStatus("error");
    }
  };

  if (checking || !step) {
    return (
      <div className="pkPage">
        <div className="pkSpinner" />
        <style jsx>{`
          .pkPage {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: linear-gradient(140deg, #0f172a 0%, #1f2937 45%, #0f172a 100%);
          }
          .pkSpinner {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid rgba(143, 124, 255, 0.2);
            border-top-color: #8f7cff;
            animation: pkSpin 0.8s linear infinite;
          }
          @keyframes pkSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="pkPage">
      <div className="pkModal">
        {step === "setup" ? (
          <form onSubmit={handlePasskeySetup}>
            <h1 className="pkTitle">Állíts be egy passkey-t</h1>
            <p className="pkSubtitle">
              Az admin fiókod biztonsága érdekében minden 24 órában szükség lesz egy passkey-re a
              bejelentkezéshez a jelszó mellett. Ez egy általad választott titkos kód (min. 6
              karakter) — nem a böngésződ/eszközöd tárolja, hanem ide, ehhez a fiókhoz mentjük el.
            </p>

            <div className="pkFormGroup">
              <label htmlFor="pkNew" className="pkLabel">Új passkey</label>
              <input
                id="pkNew"
                type="password"
                className="pkInput"
                placeholder="Legalább 6 karakter..."
                value={passkeyValue}
                onChange={(e) => setPasskeyValue(e.target.value)}
                disabled={passkeyStatus === "working"}
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div className="pkFormGroup">
              <label htmlFor="pkConfirm" className="pkLabel">Passkey megerősítése</label>
              <input
                id="pkConfirm"
                type="password"
                className="pkInput"
                placeholder="Add meg újra..."
                value={passkeyConfirm}
                onChange={(e) => setPasskeyConfirm(e.target.value)}
                disabled={passkeyStatus === "working"}
                autoComplete="new-password"
              />
            </div>

            {passkeyError && <div className="pkError">{passkeyError}</div>}

            <button type="submit" className="pkButton" disabled={passkeyStatus === "working"}>
              {passkeyStatus === "working" ? "Folyamatban..." : "Passkey beállítása"}
            </button>
            <p className="pkHint">Jegyezd meg ezt a kódot — a következő bejelentkezéskor szükséged lesz rá.</p>
          </form>
        ) : (
          <form onSubmit={handlePasskeyVerify}>
            <h1 className="pkTitle">Erősítsd meg a passkey-eddel</h1>
            <p className="pkSubtitle">
              A jelszavad rendben volt. Az utolsó lépésként add meg a passkey-edet a belépéshez.
            </p>

            <div className="pkFormGroup">
              <label htmlFor="pkVerify" className="pkLabel">Passkey</label>
              <input
                id="pkVerify"
                type="password"
                className="pkInput"
                placeholder="Passkey-ed..."
                value={passkeyValue}
                onChange={(e) => setPasskeyValue(e.target.value)}
                disabled={passkeyStatus === "working"}
                autoComplete="current-password"
                autoFocus
              />
            </div>

            {passkeyError && <div className="pkError">{passkeyError}</div>}

            <button type="submit" className="pkButton" disabled={passkeyStatus === "working"}>
              {passkeyStatus === "working" ? "Folyamatban..." : "Belépés passkey-vel"}
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .pkPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.14), transparent 22%),
            radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 18%),
            linear-gradient(140deg, #0f172a 0%, #1f2937 45%, #0f172a 100%);
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }

        .pkModal {
          width: 100%;
          max-width: 480px;
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 28px;
          padding: 40px 34px;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.5);
          animation: fadeInCard 0.3s ease-out;
        }

        .pkTitle {
          font-size: 24px;
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

        .pkFormGroup {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 18px;
        }

        .pkLabel {
          font-size: 12px;
          font-weight: 800;
          color: rgba(148, 163, 184, 0.95);
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        .pkInput {
          padding: 13px 16px;
          background: rgba(148, 163, 184, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 12px;
          color: #f8fafc;
          font-family: inherit;
          font-size: 15px;
          transition: all 0.2s ease;
          width: 100%;
        }

        .pkInput:hover {
          border-color: rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.08);
        }

        .pkInput:focus {
          outline: none;
          border-color: #8f7cff;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 3px rgba(143, 124, 255, 0.14);
        }

        .pkInput:disabled {
          opacity: 0.64;
          cursor: not-allowed;
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

        @keyframes fadeInCard {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 480px) {
          .pkModal {
            padding: 30px 20px;
          }
          .pkTitle {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}
