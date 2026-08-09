"use client";

import React, { useState } from "react";
import { renderMarkdownLite } from "../_lib/markdownLite";
import { MODERN_RULES, LEGACY_RULES, PRIVACY_POLICY, TOURNAMENT_RESULTS } from "../_lib/docsContent";

export const dynamic = "force-static";

const DOCS = [
  { id: "modern", label: "Modern Szabályzat", icon: "📜" },
  { id: "legacy", label: "Legacy Szabályzat", icon: "📖" },
  { id: "privacy", label: "Adatvédelmi tájékoztató", icon: "🔒" },
  { id: "tournaments", label: "Tournament eredmények", icon: "🏆" },
];

const TIER_COLORS = {
  HT1: "#f87171", LT1: "#fb923c",
  HT2: "#fbbf24", LT2: "#facc15",
  HT3: "#a3e635", LT3: "#4ade80",
  HT4: "#34d399", LT4: "#2dd4bf",
  HT5: "#38bdf8", LT5: "#818cf8",
};

const TOURNAMENT_ICONS = {
  SWORD: "/images/sword.png",
  AXE: "/images/axe.png",
  MACE: "/images/mace.png",
  POT: "/images/pot.png",
  NETHPOT: "/images/nethpot.png",
  SMP: "/images/smp.png",
  VANILLA: "/images/vanilla.png",
  UHC: "/images/uhc.png",
  OGV: "/images/ogvanilla.png",
  SHIELDLESSUHC: "/images/shieldlessuhc.png",
  CREEPER: "/images/creeper.png",
  CART: "/images/cart.png",
  DIASMP: "/images/diasmp.png",
  SPEARMACE: "/images/spear.png",
};

function tierColor(tier) {
  return TIER_COLORS[tier] || "#94a3b8";
}

function tournamentIcon(title) {
  const key = title.trim().toUpperCase().replace(/\s+/g, "");
  return TOURNAMENT_ICONS[key] || null;
}

function TournamentPicker({ onPick }) {
  return (
    <div className="tourPickerGrid">
      {TOURNAMENT_RESULTS.map((t, i) => {
        const icon = tournamentIcon(t.title);
        return (
          <button key={i} type="button" className="tourPickerBtn" onClick={() => onPick(i)}>
            <span className="tourPickerIconWrap">
              {icon ? (
                <img src={icon} alt="" className="tourPickerIcon" width={34} height={34} loading="lazy" />
              ) : (
                <span className="tourPickerIconFallback">🏆</span>
              )}
            </span>
            <span className="tourPickerText">
              <span className="tourPickerTitle">{t.title}</span>
              {t.winner && <span className="tourPickerWinner">🏆 {t.winner}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TournamentDetail({ tournament, onBack }) {
  const icon = tournamentIcon(tournament.title);
  return (
    <div className="tourDetail">
      <button type="button" className="tourDetailBack" onClick={onBack}>
        ← Az összes torna
      </button>

      <div className="tourDetailHead">
        {icon && <img src={icon} alt="" className="tourDetailIcon" width={44} height={44} />}
        <div>
          <h3 className="tourDetailTitle">{tournament.title}</h3>
          {tournament.winner && (
            <p className="tourDetailWinner">
              🏆 Tournament nyertes: <strong>{tournament.winner}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="tourDetailTiers">
        {tournament.tiers.map((tier, j) => (
          <div className="tourTierBlock" key={j}>
            <div className="tourTierHead" style={{ "--tier-color": tierColor(tier.tier) }}>
              {tier.tier}
            </div>
            <div className="tourNamesGrid">
              {tier.names.map((name, k) => (
                <span className="tourNamePill" key={k}>{name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TournamentResults() {
  const [selectedIdx, setSelectedIdx] = useState(null);

  if (selectedIdx === null) {
    return <TournamentPicker onPick={setSelectedIdx} />;
  }

  return (
    <TournamentDetail
      tournament={TOURNAMENT_RESULTS[selectedIdx]}
      onBack={() => setSelectedIdx(null)}
    />
  );
}

export default function DocsPage() {
  const [activeDoc, setActiveDoc] = useState("modern");
  const activeMeta = DOCS.find((d) => d.id === activeDoc);

  return (
    <div className="docsPage">
      <div className="bg" />

      <header className="navbar">
        <nav className="navInner">
          <h1 className="navLogo"><a href="/">NeonTiers</a></h1>
          <ul className="navLinks">
            <li>
              <a className="navLink" href="/">
                <svg className="navLinkIcon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M12 3.2 3.8 9.8a1 1 0 0 0-.38.78V20a1 1 0 0 0 1 1h5.1a1 1 0 0 0 1-1v-4.8h3V20a1 1 0 0 0 1 1h5.08a1 1 0 0 0 1-1v-9.42a1 1 0 0 0-.37-.78L12 3.2Z"/>
                </svg>
                <span className="navLinkText">Főoldal</span>
              </a>
            </li>
            <li>
              <a className="navLink active" href="/docs">
                <svg className="navLinkIcon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Zm7 1.5L18.5 9H13V3.5ZM7 12h10v1.5H7V12Zm0 4h10v1.5H7V16Zm0-8h4v1.5H7V8Z"/>
                </svg>
                <span className="navLinkText">Dokumentumok</span>
              </a>
            </li>
            <li>
              <a className="navLink" href="https://modrinth.com/mod/neontierstagger" target="_blank" rel="noreferrer">
                <svg className="navLinkIcon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M11.14 3.38a1.7 1.7 0 0 1 1.72 0l6 3.42A1.72 1.72 0 0 1 19.72 8v8a1.72 1.72 0 0 1-.86 1.48l-6 3.42a1.7 1.7 0 0 1-1.72 0l-6-3.42A1.72 1.72 0 0 1 4.28 16V8c0-.62.33-1.2.86-1.49l6-3.13Zm.86 2.03L7.16 8.17 12 10.93l4.84-2.76L12 5.41Zm-5.72 4.2V15L11 17.67v-5.52L6.28 9.6Zm7.72 8.06 4.72-2.68V9.6L13 12.15v5.52Z"/>
                </svg>
                <span className="navLinkText">Mod</span>
              </a>
            </li>
            <li>
              <a className="navLink" href="/legacy">
                <svg className="navLinkIcon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
                <span className="navLinkText">Legacy</span>
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="docsMain">
        <div className="docsShell">
          <aside className="docsSidebar">
            <p className="docsSidebarLabel">📁 Dokumentumok</p>
            <nav className="docsSidebarNav">
              {DOCS.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className={`docsSideBtn ${activeDoc === doc.id ? "active" : ""}`}
                  onClick={() => setActiveDoc(doc.id)}
                >
                  <span className="docsSideIcon">{doc.icon}</span>
                  <span>{doc.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <section className="docsPanel">
            <div className="docsPanelHead">
              <span className="docsPanelIcon">{activeMeta?.icon}</span>
              <h2 className="docsPanelTitle">{activeMeta?.label}</h2>
            </div>

            <div className={`docsContent ${activeDoc === "tournaments" ? "docsContentTour" : ""}`}>
              {activeDoc === "modern" && renderMarkdownLite(MODERN_RULES)}
              {activeDoc === "legacy" && renderMarkdownLite(LEGACY_RULES)}
              {activeDoc === "privacy" && renderMarkdownLite(PRIVACY_POLICY)}
              {activeDoc === "tournaments" && <TournamentResults />}
            </div>
          </section>
        </div>
      </main>

      <footer className="docsFooter">
        <p>© {new Date().getFullYear()} NeonTiers.hu</p>
      </footer>

      <style jsx>{`
        .docsPage {
          min-height: 100vh;
          position: relative;
          padding-bottom: 60px;
        }

        .bg {
          position: fixed;
          inset: 0;
          z-index: -1;
          background: var(--bg);
        }

        /* Navbar (matches main site) */
        .navbar {
          max-width: 1480px;
          margin: 0 auto;
          padding-left: 20px;
          padding-right: 20px;
          padding-top: 18px;
        }

        .navInner {
          display: flex;
          align-items: center;
          gap: 20px;
          min-height: 78px;
          padding: 14px 24px;
          background: var(--bg-panel-strong);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: 0 16px 42px #0000004d;
        }

        .navLogo {
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.04em;
        }

        .navLogo a {
          color: var(--text);
          text-decoration: none;
        }

        .navLinks {
          display: flex;
          gap: 4px;
          list-style: none;
          margin: 0 0 0 8px;
          padding: 0;
        }

        .navLink {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.45);
          font-size: 15px;
          padding: 8px 14px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }

        .navLink:hover, .navLink.active {
          color: white;
          background: rgba(255, 255, 255, 0.06);
        }

        .navLinkIcon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        /* Docs layout */
        .docsMain {
          max-width: 1480px;
          margin: 28px auto 0;
          padding: 0 20px;
        }

        .docsShell {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 20px;
          align-items: start;
        }

        .docsSidebar {
          position: sticky;
          top: 24px;
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 18px 14px;
        }

        .docsSidebarLabel {
          margin: 4px 8px 12px;
          font-size: 13px;
          font-weight: 800;
          color: var(--text);
        }

        .docsSidebarNav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .docsSideBtn {
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
          padding: 11px 12px;
          border-radius: 10px;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(255, 255, 255, 0.65);
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }

        .docsSideBtn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .docsSideBtn.active {
          background: var(--accent-soft);
          border-color: color-mix(in srgb, var(--accent) 45%, transparent);
          color: #fff;
        }

        .docsSideIcon {
          font-size: 17px;
        }

        .docsPanel {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px 32px 36px;
          min-height: 60vh;
        }

        .docsPanelHead {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 18px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }

        .docsPanelIcon {
          font-size: 22px;
        }

        .docsPanelTitle {
          font-size: 19px;
          font-weight: 900;
          color: var(--text);
          margin: 0;
        }

        .docsContent :global(.mdH1) {
          font-size: 24px;
          font-weight: 900;
          color: #f8fafc;
          margin: 0 0 18px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        }
        .docsContent :global(.mdH2) {
          font-size: 17.5px;
          font-weight: 800;
          color: #f8fafc;
          margin: 30px 0 12px;
          padding-top: 20px;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
        }
        .docsContent :global(.mdH2:first-child) {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }
        .docsContent :global(.mdH3) {
          font-size: 14px;
          font-weight: 800;
          color: #fca5a5;
          margin: 18px 0 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .docsContent :global(.mdP) {
          font-size: 14px;
          line-height: 1.8;
          color: rgba(226, 232, 240, 0.82);
          margin: 8px 0;
        }
        .docsContent :global(.mdItalic) {
          font-size: 12.5px;
          font-style: italic;
          color: rgba(226, 232, 240, 0.5);
          margin: 8px 0;
        }
        .docsContent :global(.mdList) {
          margin: 8px 0 6px;
          padding-left: 4px;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .docsContent :global(.mdList li) {
          position: relative;
          padding-left: 18px;
          font-size: 14px;
          line-height: 1.75;
          color: rgba(226, 232, 240, 0.82);
        }
        .docsContent :global(.mdList li::before) {
          content: "";
          position: absolute;
          left: 0;
          top: 8px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #c41e3a;
        }
        .docsContent :global(.mdInlineCode) {
          background: rgba(148, 163, 184, 0.16);
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 12.5px;
          color: #fca5a5;
        }
        .docsContent :global(strong) {
          color: #f8fafc;
        }

        /* Tables */
        .docsContent :global(.mdTableWrap) {
          margin: 14px 0 20px;
          overflow-x: auto;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 14px;
        }
        .docsContent :global(.mdTable) {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .docsContent :global(.mdTable thead) {
          background: rgba(196, 30, 58, 0.12);
        }
        .docsContent :global(.mdTable th) {
          text-align: left;
          padding: 12px 16px;
          font-size: 12.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #fca5a5;
          white-space: nowrap;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        }
        .docsContent :global(.mdTable td) {
          padding: 12px 16px;
          color: rgba(226, 232, 240, 0.86);
          border-bottom: 1px solid rgba(148, 163, 184, 0.08);
          line-height: 1.6;
        }
        .docsContent :global(.mdTable tbody tr:last-child td) {
          border-bottom: none;
        }
        .docsContent :global(.mdTable tbody tr:hover) {
          background: rgba(255, 255, 255, 0.03);
        }
        .docsContent :global(.mdTable tbody tr:nth-child(even)) {
          background: rgba(255, 255, 255, 0.015);
        }

        /* Tournament picker */
        :global(.tourPickerGrid) {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        :global(.tourPickerBtn) {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(148, 163, 184, 0.08);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 14px;
          cursor: pointer;
          text-align: left;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
        }

        :global(.tourPickerBtn:hover) {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(196, 30, 58, 0.45);
        }

        :global(.tourPickerIconWrap) {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }

        :global(.tourPickerIcon) {
          width: 30px;
          height: 30px;
          object-fit: contain;
        }

        :global(.tourPickerIconFallback) {
          font-size: 20px;
        }

        :global(.tourPickerText) {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        :global(.tourPickerTitle) {
          font-size: 14px;
          font-weight: 800;
          color: #f8fafc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        :global(.tourPickerWinner) {
          font-size: 11.5px;
          color: rgba(226, 232, 240, 0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Tournament detail */
        :global(.tourDetail) {
          display: flex;
          flex-direction: column;
        }

        :global(.tourDetailBack) {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(226, 232, 240, 0.85);
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
          padding: 7px 13px;
          border-radius: 10px;
          margin-bottom: 20px;
          transition: background 0.15s;
        }

        :global(.tourDetailBack:hover) {
          background: rgba(255, 255, 255, 0.12);
        }

        :global(.tourDetailHead) {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        }

        :global(.tourDetailIcon) {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          object-fit: contain;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 6px;
        }

        :global(.tourDetailTitle) {
          font-size: 19px;
          font-weight: 900;
          color: #f8fafc;
          margin: 0 0 4px;
        }

        :global(.tourDetailWinner) {
          font-size: 13px;
          color: rgba(226, 232, 240, 0.7);
          margin: 0;
        }

        :global(.tourDetailTiers) {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        :global(.tourTierBlock) {
          background: rgba(148, 163, 184, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 14px;
          padding: 14px 16px 16px;
        }

        :global(.tourTierHead) {
          display: inline-block;
          font-size: 12.5px;
          font-weight: 900;
          letter-spacing: 0.03em;
          color: var(--tier-color, #94a3b8);
          background: color-mix(in srgb, var(--tier-color, #94a3b8) 16%, transparent);
          border: 1px solid color-mix(in srgb, var(--tier-color, #94a3b8) 40%, transparent);
          padding: 3px 10px;
          border-radius: 8px;
          margin-bottom: 10px;
        }

        :global(.tourNamesGrid) {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        :global(.tourNamePill) {
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 5px 11px;
          border-radius: 20px;
        }

        .docsFooter {
          max-width: 1480px;
          margin: 40px auto 0;
          padding: 0 20px;
          text-align: center;
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.35);
        }

        @media (max-width: 860px) {
          .docsShell {
            grid-template-columns: 1fr;
          }
          .docsSidebar {
            position: static;
          }
          .docsSidebarNav {
            flex-direction: row;
            flex-wrap: wrap;
          }
          .docsSideBtn {
            flex: 1 1 auto;
          }
          .docsPanel {
            padding: 22px 18px 28px;
          }
          .navLinkText {
            display: none;
          }
          :global(.tourPickerGrid) {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
