"use client";

import React, { useState, useEffect, useRef } from "react";
import AdminShell from "./_components/AdminShell";

// The entire admin panel now lives on this single /admin route: this
// component shows the login form (with the passkey step) until the admin
// is fully authenticated, then swaps in <AdminShell/>, which renders the
// tabbed panel (Dashboard / Logs / Applications / High-test / Staff) without
// any further page navigation.
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [honeypot, setHoneypot] = useState(""); // hidden field — real users never fill this in
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const formLoadedAtRef = useRef(Date.now());

  // Passkey popup state. "setup" = no passkey registered yet, needs one.
  // "verify" = passkey already exists, needs confirming. null = popup closed.
  const [passkeyStep, setPasskeyStep] = useState(null);
  const [passkeyStatus, setPasskeyStatus] = useState("idle"); // idle | working | error
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeyValue, setPasskeyValue] = useState("");
  const [passkeyConfirm, setPasskeyConfirm] = useState("");

  useEffect(() => {
    // Check if already fully logged in, or mid-way through the passkey step.
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (res.ok) {
        setAuthed(true);
        setCheckingAuth(false);
        return;
      }
      try {
        const data = await res.json();
        if (data?.pending) {
          setPasskeyStep(data.hasPasskey ? "verify" : "setup");
        }
      } catch {
        // not authenticated at all — stay on the login form
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  // If the panel later discovers the session died (expired, logged out from
  // another tab, etc.), it calls this to fall back to the login form again.
  const handleLoggedOut = () => {
    setAuthed(false);
    setPasskeyStep(null);
    setPasskeyValue("");
    setPasskeyConfirm("");
  };

  if (authed) {
    return <AdminShell onLoggedOut={handleLoggedOut} />;
  }

  if (checkingAuth) {
    return (
      <div className="adminPage">
        <div className="adminContainer" />
      </div>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_name: adminName,
          admin_password: adminPassword,
          // Custom bot check signals — no third-party service involved.
          hp_field: honeypot,
          form_started_at: formLoadedAtRef.current,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bejelentkezés sikertelen");
        setLoading(false);
        return;
      }

      setLoading(false);
      setPasskeyStep(data.hasPasskey ? "verify" : "setup");
    } catch (err) {
      setError("Hálózati hiba");
      setLoading(false);
    }
  };

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

      setAuthed(true);
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

      setAuthed(true);
    } catch (e) {
      setPasskeyError("Hálózati hiba történt");
      setPasskeyStatus("error");
    }
  };

  return (
    <div className="adminPage">
      <div className="adminContainer">
        <div className="adminCard">
          <h1 className="adminTitle">Admin panel</h1>
          <p className="adminSubtitle">Adminok számára fenntartott terület</p>

          <form onSubmit={handleLogin} className="adminForm">
            <div className="formGroup">
              <label htmlFor="adminName" className="formLabel">
                Admin név
              </label>
              <input
                id="adminName"
                type="text"
                className="formInput"
                placeholder="Adminisztrátor neve..."
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="adminPassword" className="formLabel">
                Admin jelszó
              </label>
              <input
                id="adminPassword"
                type="password"
                className="formInput"
                placeholder="Jelszó..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            {/* Honeypot field: hidden from real users via CSS, but visible to
                most bots that blindly fill in every input on the page. Any
                value here means "not human" — checked server-side too. */}
            <div className="hpField" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {error && <div className="formError">{error}</div>}

            <button type="submit" className="formButton" disabled={loading}>
              {loading ? "Bejelentkezés..." : "Bejelentkezés"}
            </button>
          </form>
        </div>
      </div>

      {passkeyStep && (
        <div className="pkOverlay">
          <div className="pkModal">
            {passkeyStep === "setup" ? (
              <form onSubmit={handlePasskeySetup}>
                <h2 className="pkTitle">Állíts be egy passkey-t</h2>
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
                <h2 className="pkTitle">Erősítsd meg a passkey-eddel</h2>
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
        </div>
      )}

      <style jsx>{`
        .adminPage {
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

        .adminContainer {
          width: 100%;
          max-width: 520px;
          position: relative;
          padding: 24px;
        }

        .adminCard {
          position: relative;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 28px;
          padding: 44px 36px;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(18px);
          overflow: hidden;
          animation: fadeInCard 0.4s ease-out;
        }

        .adminCard::before {
          content: "";
          position: absolute;
          top: -70px;
          right: -100px;
          width: 260px;
          height: 260px;
          background: rgba(196, 30, 58, 0.14);
          border-radius: 50%;
          filter: blur(24px);
          pointer-events: none;
        }

        .adminTitle {
          font-size: 34px;
          font-weight: 900;
          margin: 0 0 10px 0;
          color: #f8fafc;
          text-align: center;
          letter-spacing: 0.02em;
        }

        .adminSubtitle {
          font-size: 15px;
          color: rgba(226, 232, 240, 0.75);
          text-align: center;
          margin: 0 0 30px 0;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .adminForm {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .formGroup {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .formLabel {
          font-size: 12px;
          font-weight: 800;
          color: rgba(148, 163, 184, 0.95);
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        .formInput {
          padding: 14px 18px;
          background: rgba(148, 163, 184, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 14px;
          color: #f8fafc;
          font-family: inherit;
          font-size: 15px;
          transition: all 0.2s ease;
          box-shadow: inset 0 1px 4px rgba(15, 23, 42, 0.35);
        }

        .formInput:hover {
          border-color: rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.08);
        }

        .formInput:focus {
          outline: none;
          border-color: #c41e3a;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.14);
        }

        .formInput:disabled {
          opacity: 0.64;
          cursor: not-allowed;
        }

        /* Visually hidden but still present/interactable in the DOM for bots
           that don't respect CSS the way real browsers rendering for humans do. */
        .hpField {
          position: absolute;
          left: -9999px;
          top: -9999px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }

        .formError {
          padding: 12px 14px;
          background: rgba(248, 113, 113, 0.14);
          border: 1px solid rgba(248, 113, 113, 0.28);
          border-radius: 12px;
          color: #fecaca;
          font-size: 13px;
          font-weight: 700;
          animation: slideInError 0.3s ease-out;
        }

        .formButton {
          padding: 14px 20px;
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-weight: 900;
          font-size: 15px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .formButton:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 18px 40px rgba(239, 68, 68, 0.22);
        }

        .formButton:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .pkOverlay {
          position: fixed;
          inset: 0;
          background: rgba(6, 10, 20, 0.72);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 50;
          animation: fadeInOverlay 0.25s ease-out;
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

        @keyframes slideInError {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
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

        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 480px) {
          .adminCard {
            padding: 30px 20px;
          }

          .adminTitle {
            font-size: 24px;
          }

          .formButton {
            padding: 14px 18px;
          }
        }
      `}</style>
    </div>
  );
}
