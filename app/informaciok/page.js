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

        <h1>Információk</h1>

        <section>
          <h2>NeonTiers</h2>
          <p>A NeonTiers egy Minecraft teljesítmény követő rendszer, amely nyomon követi a játékosok teszt eredményeit különböző gamemode-okban.</p>
        </section>

        <section>
          <h2>Rangsor</h2>
          <p>A rangok összpontszámítás alapján vannak kiszámítva. Minden gamemode pontszáma a megfelelő tier-hez rendelődik.</p>
        </section>

        <section>
          <h2>API</h2>
          <p>Teszt eredmények lekérése:</p>
          <div className="endpoint">
            <span className="method">GET</span>
            <span className="path">/api/tests</span>
          </div>
        </section>

        <footer>
          <p>© {new Date().getFullYear()} NeonTiers</p>
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
        .infoCard h2 {
          font-size: 16px;
          font-weight: 700;
          color: #8f7cff;
          margin: 24px 0 8px;
        }
        .infoCard p {
          color: rgba(255,255,255,0.85);
          line-height: 1.6;
          margin: 0 0 12px;
        }
        .endpoint {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
        }
        .method {
          font-family: monospace;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 4px;
          background: #22c55e18;
          color: #4ade80;
          border: 1px solid #22c55e30;
        }
        .path {
          font-family: monospace;
          font-size: 14px;
          color: #fff;
          background: rgba(255,255,255,0.08);
          padding: 4px 12px;
          border-radius: 4px;
        }
        footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
          text-align: center;
          color: rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  );
}