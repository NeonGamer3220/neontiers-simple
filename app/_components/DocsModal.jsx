"use client";

import React, { useState } from "react";
import { renderMarkdownLite } from "../_lib/markdownLite";
import { MODERN_RULES, LEGACY_RULES, PRIVACY_POLICY, TOURNAMENT_RESULTS } from "../_lib/docsContent";

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

export default function DocsModal({ open, onClose }) {
  const [activeDoc, setActiveDoc] = useState(null);

  if (!open) return null;

  const handleClose = () => {
    setActiveDoc(null);
    onClose();
  };

  const activeMeta = DOCS.find((d) => d.id === activeDoc);

  return (
    <div className="docsOverlay" onClick={handleClose}>
      <div className="docsModal" onClick={(e) => e.stopPropagation()}>
        <div className="docsHeader">
          {activeDoc ? (
            <button type="button" className="docsBackBtn" onClick={() => setActiveDoc(null)}>
              ← Vissza
            </button>
          ) : (
            <h2 className="docsTitle">📁 Dokumentumok</h2>
          )}
          {activeMeta && <span className="docsHeaderLabel">{activeMeta.icon} {activeMeta.label}</span>}
          <button type="button" className="docsCloseBtn" onClick={handleClose} aria-label="Bezárás">
            ✕
          </button>
        </div>

        {!activeDoc && (
          <div className="docsGrid">
            {DOCS.map((doc) => (
              <button
                key={doc.id}
                type="button"
                className="docsCard"
                onClick={() => setActiveDoc(doc.id)}
              >
                <span className="docsCardIcon">{doc.icon}</span>
                <span className="docsCardLabel">{doc.label}</span>
                <span className="docsCardArrow">→</span>
              </button>
            ))}
          </div>
        )}

        {activeDoc && (
          <div className={`docsContent ${activeDoc === "tournaments" ? "docsContentTour" : ""}`}>
            {activeDoc === "modern" && renderMarkdownLite(MODERN_RULES)}
            {activeDoc === "legacy" && renderMarkdownLite(LEGACY_RULES)}
            {activeDoc === "privacy" && renderMarkdownLite(PRIVACY_POLICY)}
            {activeDoc === "tournaments" && <TournamentResults />}
          </div>
        )}
      </div>

      <style jsx>{`
        .docsOverlay {
          position: fixed;
          inset: 0;
          background: rgba(6, 10, 20, 0.78);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 200;
          animation: docsFadeIn 0.2s ease-out;
        }

        .docsModal {
          width: 100%;
          max-width: 780px;
          height: min(760px, 88vh);
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, rgba(20, 27, 45, 0.98), rgba(13, 18, 32, 0.98));
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 26px;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.55);
          overflow: hidden;
        }

        .docsHeader {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 22px 26px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.02);
        }

        .docsTitle {
          font-size: 20px;
          font-weight: 900;
          color: #f8fafc;
          margin: 0;
          flex: 1;
        }

        .docsHeaderLabel {
          flex: 1;
          font-size: 14px;
          font-weight: 800;
          color: rgba(226, 232, 240, 0.9);
        }

        .docsBackBtn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(226, 232, 240, 0.85);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          padding: 8px 14px;
          border-radius: 10px;
          transition: background 0.15s, color 0.15s;
        }

        .docsBackBtn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }

        .docsCloseBtn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(226, 232, 240, 0.8);
          width: 34px;
          height: 34px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 15px;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }

        .docsCloseBtn:hover {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fecaca;
        }

        .docsGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          padding: 28px;
          overflow-y: auto;
        }

        .docsCard {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 10px;
          padding: 26px 22px;
          background: rgba(148, 163, 184, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          cursor: pointer;
          text-align: left;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
        }

        .docsCard:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(196, 30, 58, 0.45);
        }

        .docsCardIcon {
          font-size: 30px;
        }

        .docsCardLabel {
          font-size: 15px;
          font-weight: 800;
          color: #f8fafc;
        }

        .docsCardArrow {
          position: absolute;
          right: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(226, 232, 240, 0.3);
          font-size: 18px;
        }

        .docsContent {
          overflow-y: auto;
          padding: 24px 32px 36px;
          flex: 1;
        }

        .docsContentTour {
          padding: 24px 26px 30px;
        }

        .docsContent :global(.mdH1) {
          font-size: 22px;
          font-weight: 900;
          color: #f8fafc;
          margin: 0 0 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        }
        .docsContent :global(.mdH2) {
          font-size: 16.5px;
          font-weight: 800;
          color: #f8fafc;
          margin: 26px 0 10px;
          padding-top: 18px;
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
          margin: 16px 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .docsContent :global(.mdP) {
          font-size: 13.5px;
          line-height: 1.75;
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
          gap: 9px;
        }
        .docsContent :global(.mdList li) {
          position: relative;
          padding-left: 18px;
          font-size: 13.5px;
          line-height: 1.7;
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
          font-size: 12px;
          color: #fca5a5;
        }
        .docsContent :global(strong) {
          color: #f8fafc;
        }

        /* Tournament picker */
        .tourPickerGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .tourPickerBtn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(148, 163, 184, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 14px;
          cursor: pointer;
          text-align: left;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
        }

        .tourPickerBtn:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(196, 30, 58, 0.45);
        }

        .tourPickerIconWrap {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
        }

        .tourPickerIcon {
          width: 30px;
          height: 30px;
          object-fit: contain;
        }

        .tourPickerIconFallback {
          font-size: 20px;
        }

        .tourPickerText {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .tourPickerTitle {
          font-size: 14px;
          font-weight: 800;
          color: #f8fafc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tourPickerWinner {
          font-size: 11.5px;
          color: rgba(226, 232, 240, 0.55);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Tournament detail */
        .tourDetail {
          display: flex;
          flex-direction: column;
        }

        .tourDetailBack {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(226, 232, 240, 0.85);
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
          padding: 7px 13px;
          border-radius: 10px;
          margin-bottom: 20px;
          transition: background 0.15s;
        }

        .tourDetailBack:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .tourDetailHead {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        }

        .tourDetailIcon {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          object-fit: contain;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 6px;
        }

        .tourDetailTitle {
          font-size: 19px;
          font-weight: 900;
          color: #f8fafc;
          margin: 0 0 4px;
        }

        .tourDetailWinner {
          font-size: 13px;
          color: rgba(226, 232, 240, 0.7);
          margin: 0;
        }

        .tourDetailTiers {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .tourTierBlock {
          background: rgba(148, 163, 184, 0.04);
          border: 1px solid rgba(148, 163, 184, 0.1);
          border-radius: 14px;
          padding: 14px 16px 16px;
        }

        .tourTierHead {
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

        .tourNamesGrid {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .tourNamePill {
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(226, 232, 240, 0.88);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 5px 11px;
          border-radius: 20px;
        }

        @keyframes docsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 560px) {
          .docsGrid, .tourPickerGrid {
            grid-template-columns: 1fr;
          }
          .docsHeaderLabel {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
