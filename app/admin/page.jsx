"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (res.ok) {
        router.push("/admin/dashboard");
      }
    };
    checkAuth();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_name: adminName, admin_password: adminPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Bejelentkezés sikertelen");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      setError("Hálózati hiba");
      setLoading(false);
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

            {error && <div className="formError">{error}</div>}

            <button type="submit" className="formButton" disabled={loading}>
              {loading ? "Bejelentkezés..." : "Bejelentkezés"}
            </button>
          </form>
        </div>
      </div>

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

        .glowRing {
          position: absolute;
          inset: 0;
          border-radius: 32px;
          pointer-events: none;
          background: radial-gradient(circle at top center, rgba(196, 30, 58, 0.18), transparent 28%);
          filter: blur(28px);
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
          font-weight: 800;
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
          font-weight: 700;
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
          font-weight: 800;
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

        @keyframes slideInError {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes focusRing {
          from {
            box-shadow: 0 0 0 0 rgba(196, 30, 58, 0.15);
          }
          to {
            box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.15);
          }
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

        .adminCard {
          animation: fadeInCard 0.4s ease-out;
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
