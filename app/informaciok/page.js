"use client";

import Link from "next/link";

export default function Informaciok() {
  return (
    <div className="infoPage">
      <div className="infoBackdrop" />
      <main className="infoCard">
        <Link href="/" className="infoBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Vissza
        </Link>

        <h1>Információ</h1>

        <p className="infoText">
          A <strong>NeonTiers</strong> a magyar Minecraft PvP közösség ranglistája.
          Minden felmérés a teszterek segítségével történik, így a rangsor a
          legpontosabb adatokon alapul.
        </p>
        <p className="infoText">
          Válaszd ki a játékmódot a füleken - Összes, Vanilla, UHC, Pot, Sword,
          Axe, Mace és sok más - és tekintsd meg a játékosok pontszámait és
          rangjaikat. A ranglista a legmagasabbra értékesített eredmények
          alapján készül, így mindig a legfrissebb adatokat látod.
        </p>

        <h2 className="infoSub">API</h2>
        <div className="endpoint">
          <span className="method">GET</span>
          <span className="path">/api/tests</span>
          <span className="desc">Összes felmérés listázása</span>
        </div>
        <div className="endpoint">
          <span className="method">GET</span>
          <span className="path">/api/mojang/{"{username}"}</span>
          <span className="desc">Játékos UUID lekérdezése a Mojang API-ból</span>
        </div>

        <footer>
          © {new Date().getFullYear()} NeonTiers
        </footer>
      </main>

      <style jsx global>{`
        .infoPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-family: Montserrat, ui-sans-serif, system-ui, sans-serif;
        }
        .infoBackdrop {
          position: fixed;
          inset: 0;
          background: #0b0e14;
          z-index: -1;
        }
        .infoCard {
          background: #0b0d11f5;
          border: 1px solid #ffffff14;
          border-radius: 24px;
          padding: 32px;
          max-width: 600px;
          width: 90%;
          box-shadow: 0 24px 72px #00000061;
        }
        .infoBack {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .infoBack:hover { color: #fff; }
        .infoCard h1 {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 24px;
        }
        .infoText {
          color: rgba(255,255,255,0.85);
          line-height: 1.6;
          margin: 0 0 12px;
        }
        .infoText strong { color: #fff; font-weight: 700; }
        .infoSub {
          font-size: 16px;
          font-weight: 700;
          color: #8f7cff;
          margin: 24px 0 8px;
        }
        .endpoint {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 5px 0;
        }
        .method {
          font-family: "JetBrains Mono", monospace;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 4px;
          background: #22c55e18;
          color: #4ade80;
          border: 1px solid #22c55e30;
        }
        .path {
          font-family: "JetBrains Mono", monospace;
          font-size: 14px;
          color: #fff;
          background: rgba(255,255,255,0.08);
          padding: 4px 12px;
          border-radius: 4px;
        }
        .desc {
          color: rgba(255,255,255,0.6);
          font-size: 13px;
        }
        footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}