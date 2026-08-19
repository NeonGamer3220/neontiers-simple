"use client";

import React, { useState } from "react";
import "./docs.css";
import { renderMarkdownLite } from "../_lib/markdownLite";
import {
  MODERN_RULES_TITLE, MODERN_RULES_SECTIONS,
  LEGACY_RULES_TITLE, LEGACY_RULES_SECTIONS,
  PRIVACY_POLICY_TITLE, PRIVACY_POLICY_SECTIONS,
  TOURNAMENT_RESULTS,
} from "../_lib/docsContent";

export const dynamic = "force-static";

const DOCS = [
  { id: "modern", label: "Modern Szabályzat", icon: "📜" },
  { id: "legacy", label: "Legacy Szabályzat", icon: "📖" },
  { id: "privacy", label: "Adatvédelmi tájékoztató", icon: "🔒" },
  { id: "tournaments", label: "Tournament eredmények", icon: "🏆" },
];

// Small rotating set of section icons (plain SVG paths, single color via
// currentColor) so each numbered section card gets a distinct glyph
// instead of just a number, without needing per-section icon data.
const SECTION_ICON_PATHS = [
  "M9.4 4.2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0 8.4c-3.7 0-6.7 1.9-6.7 4.3v2.9h13.4v-2.9c0-2.4-3-4.3-6.7-4.3Zm7.8-7.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm0 6.9c-.9 0-1.8.13-2.6.4 1.6 1.1 2.7 2.6 2.7 4.2v2.9h4.1v-2.7c0-2.3-2-4.8-4.2-4.8Z",
  "M12 3.2 5.1 10.1l1.42 1.42 4.47-4.47V20.4h2V7.05l4.47 4.47L18.9 10.1 12 3.2Z",
  "M12 2.6 4.8 5.3a1 1 0 0 0-.65.94v5.1c0 4.4 3 8.2 7.5 9.9.23.08.47.08.7 0 4.5-1.7 7.5-5.5 7.5-9.9v-5.1a1 1 0 0 0-.65-.94L12 2.6Zm0 2.14 5.85 2.2v4.4c0 3.44-2.28 6.5-5.85 8-3.57-1.5-5.85-4.56-5.85-8v-4.4L12 4.74Zm-1.05 9.5-2.1-2.1-1.32 1.33 3.42 3.42 5.52-5.52-1.33-1.32-4.19 4.19Z",
  "M12 4.1a9 9 0 0 0-7.8 13.5l1.73-1a7 7 0 1 1 12.14 0l1.73 1A9 9 0 0 0 12 4.1Zm4.03 4.13-4.9 3.44a1.8 1.8 0 1 0 1.14 1.64l3.76-5.08ZM6.4 11.2h2v1.9h-2v-1.9Zm9.2 0h2v1.9h-2v-1.9Zm-4.55-4.6h1.9v2h-1.9v-2Z",
  "M4 5.6h2.2v2.2H4V5.6Zm4.2 0h11.8v2.2H8.2V5.6ZM4 10.9h2.2v2.2H4v-2.2Zm4.2 0h11.8v2.2H8.2v-2.2ZM4 16.2h2.2v2.2H4v-2.2Zm4.2 0h11.8v2.2H8.2v-2.2Z",
  "M13.9 3.4h5.4a1 1 0 0 1 1 1v5.4h-2V6.83l-5.05 5.05-1.42-1.42 5.05-5.06H13.9v-2ZM4.7 3.4h5.4v2H7.12l9.5 9.5v-2.62h2v5.4a1 1 0 0 1-1 1h-5.4v-2h2.62L4.7 6.5V3.4Zm5.36 11.06 1.42 1.42-5.05 5.05h3.67v2H4.7a1 1 0 0 1-1-1v-5.4h2v3.67l4.36-5.74Z",
  "M3.2 7.6a1.3 1.3 0 0 1 2.05-1.06L8.6 8.9l2.3-4.6a1.3 1.3 0 0 1 2.2 0l2.3 4.6 3.35-2.36A1.3 1.3 0 0 1 20.8 7.6l-1.6 8.5a1.3 1.3 0 0 1-1.28 1.06H6.08A1.3 1.3 0 0 1 4.8 16.1L3.2 7.6Zm2.62 1.9 1.1 5.86h10.16l1.1-5.86-2.5 1.76a1.3 1.3 0 0 1-1.9-.5L12 7.42l-1.78 3.34a1.3 1.3 0 0 1-1.9.5L5.82 9.5ZM6 18.5h12v1.9H6v-1.9Z",
  "M4.6 3.9h14.8a1.6 1.6 0 0 1 1.6 1.6v3.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 9.1V5.5a1.6 1.6 0 0 1 1.6-1.6Zm.4 2v3h14v-3H5Zm-.4 7.4h14.8a1.6 1.6 0 0 1 1.6 1.6v3.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 18.5v-3.6a1.6 1.6 0 0 1 1.6-1.6Zm.4 2v3h14v-3H5Zm1.9-8.4h2v1.2h-2V6.9Zm0 9.4h2v1.2h-2v-1.2Z",
  "M5.2 3h1.9v18H5.2V3Zm3.1 1.1h9.9a1 1 0 0 1 .82 1.57l-2.2 3.16 2.2 3.16a1 1 0 0 1-.82 1.57H8.3V4.1Zm1.9 1.9v5.66h6.09l-1.5-2.16a1 1 0 0 1 0-1.14l1.5-2.36h-6.09Z",
  "M4.4 4.2h15.2a1.7 1.7 0 0 1 1.7 1.7v9.3a1.7 1.7 0 0 1-1.7 1.7h-5.4l.5 2h2.4v1.9H6.9v-1.9h2.4l.5-2H4.4a1.7 1.7 0 0 1-1.7-1.7V5.9a1.7 1.7 0 0 1 1.7-1.7Zm.3 2v8.7h14.6V6.2H4.7Z",
  "M12 2.9a9.1 9.1 0 1 0 0 18.2 9.1 9.1 0 0 0 0-18.2Zm0 2a7.1 7.1 0 1 1 0 14.2 7.1 7.1 0 0 1 0-14.2Zm-1.05 2.4h2.1v2.1h-2.1V7.3Zm0 3.5h2.1v6h-2.1v-6Z",
];

function sectionIcon(i) {
  return SECTION_ICON_PATHS[i % SECTION_ICON_PATHS.length];
}

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

function DocSections({ pageTitle, sections }) {
  return (
    <div className="docSections">
      {pageTitle && <h1 className="docSectionsPageTitle">{pageTitle}</h1>}
      {sections.map((section, i) => (
        <article className="docSectionCard" key={i}>
          <header className="docSectionHead">
            <span className="docSectionIcon" aria-hidden="true">
              <svg className="docSectionIconSvg" viewBox="0 0 24 24" width="19" height="19">
                <path d={sectionIcon(i)} fill="currentColor" />
              </svg>
            </span>
            <span className="docSectionHeadText">
              <span className="docSectionIndex">{i + 1}. szakasz</span>
              <h2 className="docSectionTitle">{section.title}</h2>
            </span>
          </header>
          <div className="docSectionBody">{renderMarkdownLite(section.body)}</div>
        </article>
      ))}
    </div>
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
          <ul className="navLinks" style={{ display: "flex", gap: 4, listStyle: "none", margin: 0, padding: 0, justifyContent: "center" }}>
            <li>
              <a className="navLink" href="/">
                <svg className="navLinkIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
                  <path d="M12 3.2 3.8 9.8a1 1 0 0 0-.38.78V20a1 1 0 0 0 1 1h5.1a1 1 0 0 0 1-1v-4.8h3V20a1 1 0 0 0 1 1h5.08a1 1 0 0 0 1-1v-9.42a1 1 0 0 0-.37-.78L12 3.2Z"/>
                </svg>
                <span className="navLinkText">Főoldal</span>
              </a>
            </li>
            <li>
              <a className="navLink active" href="/docs">
                <svg className="navLinkIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
                  <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Zm7 1.5L18.5 9H13V3.5ZM7 12h10v1.5H7V12Zm0 4h10v1.5H7V16Zm0-8h4v1.5H7V8Z"/>
                </svg>
                <span className="navLinkText">Dokumentumok</span>
              </a>
            </li>
            <li>
              <a className="navLink" href="https://modrinth.com/mod/neontierstagger" target="_blank" rel="noreferrer">
                <svg className="navLinkIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
                  <path d="M11.14 3.38a1.7 1.7 0 0 1 1.72 0l6 3.42A1.72 1.72 0 0 1 19.72 8v8a1.72 1.72 0 0 1-.86 1.48l-6 3.42a1.7 1.7 0 0 1-1.72 0l-6-3.42A1.72 1.72 0 0 1 4.28 16V8c0-.62.33-1.2.86-1.49l6-3.13Zm.86 2.03L7.16 8.17 12 10.93l4.84-2.76L12 5.41Zm-5.72 4.2V15L11 17.67v-5.52L6.28 9.6Zm7.72 8.06 4.72-2.68V9.6L13 12.15v5.52Z"/>
                </svg>
                <span className="navLinkText">Mod</span>
              </a>
            </li>
            <li>
              <a className="navLink" href="/legacy">
                <svg className="navLinkIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
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
              {activeDoc === "modern" && <DocSections pageTitle={MODERN_RULES_TITLE} sections={MODERN_RULES_SECTIONS} />}
              {activeDoc === "legacy" && <DocSections pageTitle={LEGACY_RULES_TITLE} sections={LEGACY_RULES_SECTIONS} />}
              {activeDoc === "privacy" && <DocSections pageTitle={PRIVACY_POLICY_TITLE} sections={PRIVACY_POLICY_SECTIONS} />}
              {activeDoc === "tournaments" && <TournamentResults />}
            </div>
          </section>
        </div>
      </main>

      <footer className="docsFooter">
        <p>© {new Date().getFullYear()} NeonTiers.hu</p>
      </footer>

    </div>
  );
}
