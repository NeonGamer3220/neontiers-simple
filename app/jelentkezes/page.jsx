"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function JelentkezesOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/applications");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Nem sikerült betölteni a jelentkezéseket");
          setLoading(false);
          return;
        }
        setForms(Array.isArray(data.forms) ? data.forms : []);
        setLoading(false);
      } catch (err) {
        setError("Hálózati hiba történt");
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="joPage">
      <div className="joBackdrop" />
      <main className="joCard">
        <Link href="/" className="joBack">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Vissza
        </Link>

        <h1 className="joTitle">Jelentkezés</h1>
        <p className="joIntro">Válaszd ki, melyik pozícióra szeretnél jelentkezni.</p>

        {loading && <div className="joState">Betöltés...</div>}

        {!loading && error && <div className="joState joStateError">{error}</div>}

        {!loading && !error && forms.length === 0 && (
          <div className="joState">Jelenleg nincs elérhető jelentkezés.</div>
        )}

        {!loading && !error && forms.length > 0 && (
          <div className="joList">
            {forms.map((form) => (
              <Link key={form.slug} href={`/jelentkezes/${form.slug}`} className="joItem">
                <span className="joItemTitle">{form.title}</span>
                <span className="joItemArrow">→</span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <style jsx global>{`
        .joPage {
          min-height: 100vh;
          position: relative;
          background: #05060a;
          color: #fff;
          font-family: inherit;
          font-weight: 800;
          display: flex;
          justify-content: center;
          padding: 48px 20px 80px;
        }
        .joBackdrop {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at top left, rgba(143, 124, 255, 0.14), transparent 40%),
            radial-gradient(circle at bottom right, rgba(214, 71, 71, 0.1), transparent 35%);
          pointer-events: none;
        }
        .joCard {
          position: relative;
          width: 100%;
          max-width: 680px;
          background: rgba(15, 16, 22, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
        }
        .joBack {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 26px;
          font-family: inherit;
        }
        .joBack:hover {
          color: #fff;
        }
        .joTitle {
          font-size: 26px;
          font-weight: 900;
          margin: 0 0 12px;
        }
        .joIntro {
          font-size: 14.5px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.68);
          margin: 0 0 28px;
        }
        .joState {
          text-align: center;
          padding: 40px 0;
          color: rgba(255, 255, 255, 0.7);
        }
        .joStateError {
          color: #ffb4b4;
          font-weight: 700;
        }
        .joList {
          display: grid;
          gap: 12px;
        }
        .joItem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
          text-decoration: none;
          font-family: inherit;
          font-weight: 800;
          font-size: 15px;
          transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
        }
        .joItem:hover {
          border-color: rgba(143, 124, 255, 0.5);
          background: rgba(143, 124, 255, 0.1);
          transform: translateY(-1px);
        }
        .joItemArrow {
          color: #8f7cff;
          font-size: 18px;
        }

        @media (max-width: 560px) {
          .joCard {
            padding: 28px 22px;
          }
        }
      `}</style>
    </div>
  );
}
