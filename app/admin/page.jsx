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
          background: linear-gradient(135deg, #c41e3a 0%, #8b1429 100%);
          padding: 20px;
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }

        .adminContainer {
          width: 100%;
          max-width: 500px;
        }

        .adminCard {
          background: rgba(11, 14, 20, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 40px 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }

        .adminTitle {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #fff;
          text-align: center;
        }

        .adminSubtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
          margin: 0 0 30px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .adminForm {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .formGroup {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .formLabel {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .formInput {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
          transition: all 0.15s;
        }

        .formInput:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .formInput:focus {
          outline: none;
          border-color: #c41e3a;
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.15);
          animation: focusRing 0.3s ease-out;
        }

        .formInput:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .formError {
          padding: 12px 14px;
          background: rgba(196, 30, 58, 0.15);
          border: 1px solid rgba(196, 30, 58, 0.4);
          border-radius: 8px;
          color: #ff6b6b;
          font-size: 13px;
          font-weight: 600;
          animation: slideInError 0.3s ease-out;
        }

        .formButton {
          padding: 12px 20px;
          background: linear-gradient(135deg, #c41e3a 0%, #8b1429 100%);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .formButton:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(196, 30, 58, 0.3);
        }

        .formButton:active:not(:disabled) {
          transform: translateY(0);
        }

        .formButton:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @keyframes focusRing {
          from {
            box-shadow: 0 0 0 0 rgba(196, 30, 58, 0.15);
          }
          to {
            box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.15);
          }
        }

        @keyframes slideInError {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
