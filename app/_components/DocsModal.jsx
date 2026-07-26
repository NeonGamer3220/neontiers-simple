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

function TournamentResults() {
  return (
    <div className="tourWrap">
      {TOURNAMENT_RESULTS.map((t, i) => (
        <div className="tourCard" key={i}>
          <h3 className="tourTitle">{t.title}</h3>
          {t.winner && (
            <p className="tourWinner">
              🏆 Nyertes: <strong>{t.winner}</strong>
            </p>
          )}
          <div className="tourTiers">
            {t.tiers.map((tier, j) => (
              <div className="tourTierRow" key={j}>
                <span className="tourTierLabel">{tier.tier}</span>
                <span className="tourTierNames">{tier.names.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DocsModal({ open, onClose }) {
  const [activeDoc, setActiveDoc] = useState(null);

  if (!open) return null;

  const handleClose = () => {
    setActiveDoc(null);
    onClose();
  };

  return (
    <div className="docsOverlay" onClick={handleClose}>
      <div className="docsModal" onClick={(e) => e.stopPropagation()}>
        <div className="docsHeader">
          {activeDoc ? (
            <button type="button" className="docsBackBtn" onClick={() => setActiveDoc(null)}>
              ← Vissza
            </button>
          ) : (
            <h2 className="docsTitle">Dokumentumok</h2>
          )}
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
              </button>
            ))}
          </div>
        )}

        {activeDoc && (
          <div className="docsContent">
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
          background: rgba(6, 10, 20, 0.72);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 200;
          animation: docsFadeIn 0.2s ease-out;
        }

        .docsModal {
          width: 100%;
          max-width: 720px;
          max-height: 84vh;
          display: flex;
          flex-direction: column;
          background: rgba(15, 23, 42, 0.97);
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 24px;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.5);
          overflow: hidden;
        }

        .docsHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
          flex-shrink: 0;
        }

        .docsTitle {
          font-size: 20px;
          font-weight: 900;
          color: #f8fafc;
          margin: 0;
        }

        .docsBackBtn {
          background: none;
          border: none;
          color: rgba(226, 232, 240, 0.8);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 10px;
          transition: background 0.15s, color 0.15s;
        }

        .docsBackBtn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
        }

        .docsCloseBtn {
          background: rgba(255, 255, 255, 0.06);
          border: none;
          color: rgba(226, 232, 240, 0.8);
          width: 32px;
          height: 32px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 15px;
          transition: background 0.15s, color 0.15s;
        }

        .docsCloseBtn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #f8fafc;
        }

        .docsGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          padding: 24px;
        }

        .docsCard {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 28px 16px;
          background: rgba(148, 163, 184, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
        }

        .docsCard:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(196, 30, 58, 0.4);
        }

        .docsCardIcon {
          font-size: 30px;
        }

        .docsCardLabel {
          font-size: 14px;
          font-weight: 800;
          color: #f8fafc;
          text-align: center;
        }

        .docsContent {
          overflow-y: auto;
          padding: 8px 26px 28px;
        }

        .docsContent :global(.mdH1) {
          font-size: 21px;
          font-weight: 900;
          color: #f8fafc;
          margin: 18px 0 10px;
        }
        .docsContent :global(.mdH2) {
          font-size: 17px;
          font-weight: 800;
          color: #f8fafc;
          margin: 18px 0 8px;
        }
        .docsContent :global(.mdH3) {
          font-size: 15px;
          font-weight: 800;
          color: rgba(226, 232, 240, 0.92);
          margin: 14px 0 6px;
        }
        .docsContent :global(.mdP) {
          font-size: 13.5px;
          line-height: 1.65;
          color: rgba(226, 232, 240, 0.82);
          margin: 6px 0;
        }
        .docsContent :global(.mdItalic) {
          font-size: 12.5px;
          font-style: italic;
          color: rgba(226, 232, 240, 0.55);
          margin: 6px 0;
        }
        .docsContent :global(.mdList) {
          margin: 6px 0 14px;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .docsContent :global(.mdList li) {
          font-size: 13.5px;
          line-height: 1.6;
          color: rgba(226, 232, 240, 0.82);
        }
        .docsContent :global(.mdInlineCode) {
          background: rgba(148, 163, 184, 0.14);
          padding: 1px 6px;
          border-radius: 6px;
          font-size: 12.5px;
          color: #fca5a5;
        }
        .docsContent :global(strong) {
          color: #f8fafc;
        }

        .tourWrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tourCard {
          background: rgba(148, 163, 184, 0.05);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 16px;
          padding: 16px 18px;
        }

        .tourTitle {
          font-size: 15px;
          font-weight: 900;
          color: #f8fafc;
          margin: 0 0 6px;
        }

        .tourWinner {
          font-size: 13px;
          color: rgba(226, 232, 240, 0.75);
          margin: 0 0 12px;
        }

        .tourTiers {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tourTierRow {
          display: flex;
          gap: 8px;
          font-size: 13px;
          line-height: 1.5;
        }

        .tourTierLabel {
          flex-shrink: 0;
          font-weight: 800;
          color: #c41e3a;
          min-width: 40px;
        }

        .tourTierNames {
          color: rgba(226, 232, 240, 0.82);
        }

        @keyframes docsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 560px) {
          .docsGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
