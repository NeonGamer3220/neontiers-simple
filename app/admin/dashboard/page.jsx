"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../_components/AdminNavbar";
import "../admin-theme.css";
import {
  HIGH_TIERS, categoryForGamemode, scoreOptionsFor, resolveTierFromTest, makeFightRow, getFT,
} from "../../_lib/highTestShared";

const RANKS = [
  { value: "", label: "Rangsorolatlan", points: 0, color: "rgba(255, 255, 255, 0.68)" },
  { value: "LT5", label: "LT5", points: 1, color: "#40384f" },
  { value: "HT5", label: "HT5", points: 2, color: "#6f6389" },
  { value: "LT4", label: "LT4", points: 3, color: "#514764" },
  { value: "HT4", label: "HT4", points: 4, color: "#b7aadf" },
  { value: "LT3", label: "LT3", points: 6, color: "#b36830" },
  { value: "HT3", label: "HT3", points: 10, color: "#dd8849" },
  { value: "LT2", label: "LT2", points: 16, color: "#888d95" },
  { value: "HT2", label: "HT2", points: 22, color: "#a4b3c7" },
  { value: "LT1", label: "LT1", points: 40, color: "#d5b355" },
  { value: "HT1", label: "HT1", points: 60, color: "#ffcf4a" },
  // "Retired" options: these don't introduce new tier codes — a retired
  // player still keeps a real tier (LT2/HT2/LT1/HT1), just flagged as
  // retired. `value` is the *actual* tier saved to the DB; the "R" label
  // is only a display convention (see rankBadgeColor/eloRankLabel on the
  // public pages, which already prefix "R" whenever retired === true).
  { value: "LT2", label: "RLT2", points: 16, color: "#8f7cff", retiredOption: true },
  { value: "HT2", label: "RHT2", points: 22, color: "#8f7cff", retiredOption: true },
  { value: "LT1", label: "RLT1", points: 40, color: "#8f7cff", retiredOption: true },
  { value: "HT1", label: "RHT1", points: 60, color: "#8f7cff", retiredOption: true },
];

// Active (non-retired) tier lookup — used for normalizing a saved rank and
// for showing the picker's current selection when the entry isn't retired.
const RANK_BY_VALUE = RANKS.filter((r) => !r.retiredOption).reduce((acc, r) => {
  acc[r.value] = r;
  return acc;
}, {});

// Same tier codes, but the "retired" flavour (for when entry.retired is true).
const RETIRED_RANK_BY_VALUE = RANKS.filter((r) => r.retiredOption).reduce((acc, r) => {
  acc[r.value] = r;
  return acc;
}, {});

// The database stores rank as a raw ELO number (e.g. 1750) since the
// migration to the ELO system, but some rows may still contain legacy tier
// strings (e.g. "HT3"). This converts either into a tier label like "HT3"
// so the admin panel always displays tiers instead of raw numbers.
function normalizeRankToTier(value) {
  if (value === "" || value === null || value === undefined) return "";
  const strVal = String(value).trim().toUpperCase();
  if (RANK_BY_VALUE[strVal]) return strVal;
  return "";
}

// Generic custom dropdown, styled to match AdminRankPicker (dark bubble,
// chevron, floating menu with checkmark on the selected option). Used for
// the ban-duration select so it matches the rest of the admin panel's
// custom controls instead of a native <select>.
function CustomDropdown({ value, options, groups, onChange, disabled = false, align = "left" }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  const flatOptions = groups ? groups.flatMap((g) => g.options) : options || [];
  const current = flatOptions.find((o) => o.value === value) || flatOptions[0] || { label: "" };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const renderOption = (o) => (
    <button
      type="button"
      key={String(o.value)}
      className={`customDropdownOption ${o.value === value ? "selected" : ""}`}
      onClick={() => {
        onChange(o.value);
        setOpen(false);
      }}
    >
      <span>{o.label}</span>
      {o.value === value && <span className="customDropdownCheck">✓</span>}
    </button>
  );

  return (
    <div className="customDropdown" ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="customDropdownButton"
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-expanded={open && !disabled}
        disabled={disabled}
      >
        <span className="customDropdownButtonText">{current.label}</span>
        <span className="customDropdownChevron">{open && !disabled ? "▴" : "▾"}</span>
      </button>

      {open && !disabled && (
        <div className={`customDropdownMenu ${align === "right" ? "alignRight" : ""}`}>
          {groups
            ? groups.map((g) => (
                <React.Fragment key={g.label}>
                  <div className="customDropdownGroupLabel">{g.label}</div>
                  {g.options.map(renderOption)}
                </React.Fragment>
              ))
            : (options || []).map(renderOption)}
        </div>
      )}

      <style jsx global>{`
        .customDropdown {
          width: 100%;
        }

        .customDropdownButton {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border-radius: 9px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 700;
          transition: border-color 0.15s ease, background 0.15s ease;
        }

        .customDropdownButton:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .customDropdownButton[disabled] {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .customDropdownChevron {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.45);
          flex: 0 0 auto;
        }

        .customDropdownMenu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 60;
          width: 100%;
          min-width: 220px;
          box-sizing: border-box;
          background: #14161e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
          padding: 6px;
          max-height: 320px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: fadeIn 0.1s ease-out;
        }

        .customDropdownMenu.alignRight {
          left: auto;
          right: 0;
        }

        .customDropdownOption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 12px;
          border-radius: 9px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          transition: background 0.12s ease;
        }

        .customDropdownOption:hover {
          background: rgba(255, 255, 255, 0.07);
        }

        .customDropdownOption.selected {
          color: #fff;
          background: rgba(143, 124, 255, 0.18);
        }

        .customDropdownCheck {
          color: #8f7cff;
          font-weight: 900;
        }

        .customDropdownGroupLabel {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: rgba(255, 255, 255, 0.32);
          padding: 8px 10px 4px;
        }
      `}</style>
    </div>
  );
}

// Live-search dropdown for picking an opponent by username — filters the
// already-loaded player list as you type instead of a free-text field.
function PlayerSearchInput({ value, onChange, usernames, placeholder = "Ellenfél keresése...", disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const query = String(value || "").trim().toLowerCase();
  const matches = query
    ? usernames.filter((u) => u.toLowerCase().includes(query) && u.toLowerCase() !== query).slice(0, 8)
    : usernames.slice(0, 8);

  return (
    <div className="playerSearchInput" ref={ref} style={{ position: "relative" }}>
      <input
        className="htqInput"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && !disabled && matches.length > 0 && (
        <div className="customDropdownMenu playerSearchMenu">
          {matches.map((u) => (
            <button
              type="button"
              key={u}
              className="customDropdownOption"
              onClick={() => {
                onChange(u);
                setOpen(false);
              }}
            >
              <span>{u}</span>
            </button>
          ))}
        </div>
      )}

      <style jsx global>{`
        .playerSearchInput {
          display: block;
          width: 100%;
        }
        .playerSearchMenu {
          width: 100%;
          min-width: 0;
        }
      `}</style>
    </div>
  );
}

function AdminRankPicker({ value, retired = false, onChange, disabled = false, onSave }) {
  const [open, setOpen] = useState(false);
  const pickerRef = React.useRef(null);

  const tierKey = normalizeRankToTier(value);
  const current =
    (retired ? RETIRED_RANK_BY_VALUE[tierKey] : RANK_BY_VALUE[tierKey]) || RANK_BY_VALUE[""];
  const activeRanks = RANKS.filter((r) => !r.retiredOption);
  const retiredRanks = RANKS.filter((r) => r.retiredOption);

  useEffect(() => {
    if (!open || disabled) {
      setOpen(false);
      return;
    }
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, disabled]);

  const handleSelect = (rankValue, isRetiredOption) => {
    if (!disabled) {
      onChange(rankValue, isRetiredOption);
    }
    setOpen(false);
  };

  const renderOption = (r) => {
    const isSelected = value === r.value && retired === !!r.retiredOption;
    return (
      <button
        type="button"
        key={(r.retiredOption ? "retired-" : "active-") + (r.value || "unranked")}
        className={`adminRankOption ${isSelected ? "selected" : ""}`}
        style={{ "--admin-rank-color": r.color }}
        onClick={() => handleSelect(r.value, !!r.retiredOption)}
      >
        <span className="adminRankOptionDot" />
        <span className="adminRankOptionMain">
          <span className="adminRankOptionLabel">{r.label}</span>
          <span className="adminRankOptionMeta">{r.points} pont</span>
        </span>
        {isSelected && <span className="adminRankOptionCheck">✓</span>}
        {r.retiredOption && <span className="adminRankOptionRetired">Visszavonult</span>}
      </button>
    );
  };

  return (
    <div
      className="adminModeControls"
      ref={pickerRef}
      data-admin-rank-picker="true"
      style={{ position: "relative", zIndex: open ? 200 : 1 }}
    >
      <div className="adminRankPicker">
        <button
          type="button"
          className="adminRankButton"
          style={{ "--admin-rank-color": current.color }}
          onClick={() => !disabled && setOpen((v) => !v)}
          aria-expanded={open && !disabled}
          disabled={disabled}
        >
          <span className="adminRankSwatch" />
          <span className="adminRankButtonText">
            <strong>{current.label}</strong>
            <span>{current.points} pont</span>
          </span>
          <span className="adminRankChevron">{open && !disabled ? "▴" : "▾"}</span>
        </button>

        {open && !disabled && (
          <div className="adminRankMenu">
            <div className="adminRankGroupLabel">Tierek</div>
            {activeRanks.map(renderOption)}
            {retiredRanks.length > 0 && (
              <>
                <div className="adminRankGroupLabel">Visszavonult tierek</div>
                {retiredRanks.map(renderOption)}
              </>
            )}
          </div>
        )}
      </div>

      {onSave && (
        <button
          type="button"
          className="adminSaveButton"
          onClick={onSave}
          title="Mentés"
          aria-label="Mentés"
        >
          <span className="adminSaveButtonIcon">✓</span>
          <span className="adminSaveButtonText">Mentés</span>
        </button>
      )}

      <style jsx global>{`
        /* ─── Admin Rank Picker (custom v2) ─── */
        .adminModeControls {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          flex: 0 0 auto;
        }

        .adminRankPicker {
          position: relative;
        }

        .adminRankButton {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px 8px 8px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(0, 0, 0, 0.22);
          color: #fff;
          cursor: pointer;
          font-family: Montserrat, inherit;
          min-width: 128px;
          transition: background 0.15s, border-color 0.15s;
        }

        .adminRankButton:hover {
          background: rgba(0, 0, 0, 0.32);
          border-color: rgba(255, 255, 255, 0.16);
        }

        .adminRankButton[disabled],
        .adminRankButton.disabled {
          opacity: 0.42;
          cursor: not-allowed;
          pointer-events: none;
        }

        .adminRankSwatch {
          width: 8px;
          height: 30px;
          border-radius: 5px;
          background: var(--admin-rank-color, #888d95);
          flex: 0 0 auto;
        }

        .adminRankButtonText {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.25;
          min-width: 0;
        }

        .adminRankButtonText strong {
          font-size: 13.5px;
          font-weight: 900;
          letter-spacing: 0.03em;
          color: #fff;
          text-transform: uppercase;
        }

        .adminRankButtonText span {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--admin-rank-color, rgba(255, 255, 255, 0.5));
        }

        .adminRankChevron {
          margin-left: auto;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          flex: 0 0 auto;
        }

        .adminSaveButton {
          height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          border: 1px solid rgba(120, 200, 150, 0.35);
          background: rgba(80, 200, 140, 0.14);
          color: #7be3ab;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          font-family: Montserrat, inherit;
          flex: 0 0 auto;
          transition: background 0.15s, transform 0.1s;
        }

        .adminSaveButton:hover {
          background: rgba(80, 200, 140, 0.24);
          transform: translateY(-1px);
        }

        .adminSaveButtonIcon {
          font-size: 16px;
          font-weight: 900;
        }

        .adminSaveButtonText {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        .adminRankMenu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 50;
          width: 250px;
          box-sizing: border-box;
          background: #14161e;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
          animation: fadeIn 0.1s ease-out;
          padding: 8px;
          max-height: 360px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .adminRankMenu * {
          box-sizing: border-box;
        }

        .adminRankGroupLabel {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: rgba(255, 255, 255, 0.32);
          padding: 8px 10px 4px;
        }

        .adminRankOption {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 10px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          font-family: Montserrat, inherit;
          text-align: left;
          transition: background 0.12s;
        }

        .adminRankOption:hover {
          background: rgba(255, 255, 255, 0.055);
        }

        .adminRankOption.selected {
          background: rgba(255, 255, 255, 0.09);
        }

        .adminRankOptionDot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--admin-rank-color, #888d95);
          flex: 0 0 auto;
        }

        .adminRankOptionMain {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
          min-width: 0;
        }

        .adminRankOptionLabel {
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: #fff;
        }

        .adminRankOptionMeta {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: var(--admin-rank-color, rgba(255, 255, 255, 0.45));
        }

        .adminRankOptionCheck {
          font-size: 12px;
          color: #7be3ab;
          flex: 0 0 auto;
        }

        .adminRankOptionRetired {
          margin-left: auto;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 3px 7px;
          border-radius: 999px;
          background: rgba(143, 124, 255, 0.16);
          color: #b7aadf;
          flex: 0 0 auto;
        }
      `}</style>
    </div>
  );
}

const MODE_OPTIONS = [
  "Vanilla",
  "UHC",
  "Pot",
  "NethPot",
  "SMP",
  "Sword",
  "Axe",
  "Mace",
  "Cart",
  "Creeper",
  "DiaSMP",
  "OGVanilla",
  "ShieldlessUHC",
  "SpearMace",
  "SpearElytra",
  "Trident",
];

const TIER_TO_POINTS = {
  LT5: 1, HT5: 2, LT4: 3, HT4: 4,
  LT3: 6, HT3: 10, LT2: 16, HT2: 22,
  LT1: 40, HT1: 60,
};

function getPointsForRating(rating) {
  if (typeof rating !== "string") return 0;
  return TIER_TO_POINTS[rating.trim().toUpperCase()] || 0;
}

const MODE_ICONS = {
  "Vanilla":    "/images/vanilla.png",
  "UHC":        "/images/uhc.png",
  "Pot":        "/images/pot.png",
  "NethPot":    "/images/nethpot.png",
  "SMP":        "/images/smp.png",
  "Sword":      "/images/sword.png",
  "Axe":        "/images/axe.png",
  "Mace":       "/images/mace.png",
"Cart":      "/images/cart.png",
  "Creeper":   "/images/creeper.png",
  "DiaSMP":    "/images/diasmp.png",
  "OGVanilla": "/images/ogvanilla.png",
  "ShieldlessUHC": "/images/shieldlessuhc.png",
  "SpearMace": "/images/spear.png",
  "SpearElytra":  "/images/spear.png",
  "Trident":   "/images/trident.png",
};

// ─── Embedded high-test quick panel ───
// Slides down under a gamemode row after the admin picks a HT3+ tier and
// hits save — logs the fights, then resolves + persists the actual tier
// (pass → the tested tier, fail → one tier worse).
function HighTestQuickPanel({ panel, discordId, saving, usernames, onSetPassed, onSetTestedTier, onAddFight, onUpdateFight, onRemoveFight, onCancel, onSave }) {
  const { entry, testedTier, category, passed, fights } = panel;
  const resolvedTier = resolveTierFromTest(testedTier, passed);
  const failTier = resolveTierFromTest("HT3", false);
  const ft = getFT(category, entry.gamemode);

  // Fights are logged per tier, covering every tier from the base fall-back
  // (one below HT3) up through the tier actually being tested — e.g.
  // testing HT2 shows LT3/HT3/LT2/HT2 sections, testing HT3 shows just
  // LT3/HT3.
  const testedIdx = HIGH_TIERS.indexOf(testedTier);
  const fightGroups = [
    failTier ? { tier: failTier, label: `${failTier} FIGHTOK` } : null,
    ...HIGH_TIERS.slice(0, testedIdx + 1).map((t) => ({ tier: t, label: `${t} FIGHTOK` })),
  ].filter(Boolean);

  const PASS_OPTIONS = [
    { value: true, label: "Sikeres" },
    { value: false, label: "Sikertelen" },
  ];

  const TESTED_TIER_GROUPS = [
    { label: "3. szint", options: [{ value: "HT3", label: "HT3" }] },
    { label: "2. szint", options: [{ value: "LT2", label: "LT2" }, { value: "HT2", label: "HT2" }] },
    { label: "1. szint", options: [{ value: "LT1", label: "LT1" }, { value: "HT1", label: "HT1" }] },
  ];

  return (
    <div className="htqPanel">
      <div className="htqHeader">
        <span className="htqTitle">Magas Eredmény Kezelő — {entry.gamemode}</span>
        {!discordId && (
          <span className="htqWarn">Nincs linkelt Discord fiók ehhez a játékoshoz — a fight-naplózáshoz szükséges.</span>
        )}
      </div>

      <div className="htqFieldsRow">
        <label className="htqFieldLabel">
          Eredmény
          <CustomDropdown value={passed} options={PASS_OPTIONS} onChange={onSetPassed} />
        </label>
        <label className="htqFieldLabel">
          Tesztelt tier
          <CustomDropdown value={testedTier} groups={TESTED_TIER_GROUPS} onChange={onSetTestedTier} />
        </label>
      </div>

      <span className="htqResult">
        {resolvedTier ? (
          <>Kapott tier: <strong>{resolvedTier}</strong></>
        ) : (
          <span style={{ color: "#ff9b9b" }}>Nincs ennél gyengébb tier — a tier nem fog változni.</span>
        )}
      </span>

      {fightGroups.map((group) => {
        const groupFights = fights.filter((f) => f.tier === group.tier);
        return (
          <div className="htqFightGroup" key={group.tier}>
            <div className="htqGroupHeader">
              {group.label}{ft ? ` · FT${ft}` : ""}
            </div>
            <div className="htqFights">
              {groupFights.map((f) => {
                const scoreOpts = scoreOptionsFor(category, entry.gamemode, f.won).map((s) => ({ value: s, label: s }));
                return (
                  <div key={f.id} className="htqFightRow">
                    <button
                      type="button"
                      className={`htqWonBtn ${f.won ? "won" : "lost"}`}
                      onClick={() => onUpdateFight(f.id, { won: !f.won })}
                    >
                      {f.won ? "Győzelem" : "Vereség"}
                    </button>
                    <div className="htqScoreDropdown">
                      <CustomDropdown
                        value={f.score}
                        options={scoreOpts}
                        onChange={(v) => onUpdateFight(f.id, { score: v })}
                      />
                    </div>
                    <div className="htqOpponentSearch">
                      <PlayerSearchInput
                        value={f.opponent}
                        usernames={usernames}
                        onChange={(v) => onUpdateFight(f.id, { opponent: v })}
                      />
                    </div>
                    <input
                      className="htqInput htqComment"
                      placeholder="Megjegyzés (opcionális)"
                      value={f.comment}
                      onChange={(e) => onUpdateFight(f.id, { comment: e.target.value })}
                    />
                    <button type="button" className="htqRemoveBtn" onClick={() => onRemoveFight(f.id)} aria-label="Eltávolítás">×</button>
                  </div>
                );
              })}
              <button type="button" className="htqAddBtn" onClick={() => onAddFight(group.tier)}>+ Fight hozzáadása</button>
            </div>
          </div>
        );
      })}

      <div className="htqFooter">
        <button type="button" className="htqCancelBtn" onClick={onCancel} disabled={saving}>Mégse</button>
        <button type="button" className="htqSaveBtn" onClick={onSave} disabled={saving}>
          {saving ? "Mentés..." : "Mentés és tier frissítése"}
        </button>
      </div>

      <style jsx>{`
        .htqPanel {
          margin-top: 12px;
          padding: 16px;
          border-radius: 14px;
          background: rgba(143, 124, 255, 0.06);
          border: 1px solid rgba(143, 124, 255, 0.28);
        }
        .htqHeader {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .htqTitle {
          font-size: 13px;
          font-weight: 800;
          color: #fff;
        }
        .htqWarn {
          font-size: 11.5px;
          font-weight: 700;
          color: #ff9b9b;
        }
        .htqFieldsRow {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 12px;
        }
        .htqFieldLabel {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1 1 180px;
          min-width: 160px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.45);
        }
        .htqResult {
          display: block;
          font-size: 12.5px;
          color: rgba(255,255,255,0.75);
          font-weight: 700;
          margin-bottom: 14px;
        }
        .htqFightGroup {
          margin-bottom: 16px;
        }
        .htqGroupHeader {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
        }
        .htqFights {
          display: grid;
          gap: 8px;
        }
        .htqFightRow {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .htqWonBtn {
          flex: 0 0 auto;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.16);
          font-size: 11.5px;
          font-weight: 800;
          cursor: pointer;
        }
        .htqWonBtn.won {
          background: rgba(52, 211, 153, 0.16);
          color: #34d399;
          border-color: rgba(52, 211, 153, 0.4);
        }
        .htqWonBtn.lost {
          background: rgba(255, 107, 107, 0.16);
          color: #ff9b9b;
          border-color: rgba(255, 107, 107, 0.4);
        }
        .htqScoreDropdown {
          flex: 0 0 130px;
        }
        .htqOpponentSearch {
          flex: 1 1 160px;
          min-width: 140px;
        }
        .htqInput {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px;
          padding: 6px 10px;
          color: #fff;
          font-size: 12.5px;
          flex: 1 1 120px;
          min-width: 100px;
          width: 100%;
          box-sizing: border-box;
          outline: none;
          font-family: inherit;
        }
        .htqInput:focus {
          outline: none;
          border-color: rgba(143, 124, 255, 0.55);
          background: rgba(255,255,255,0.07);
        }
        .htqComment {
          flex: 1 1 160px;
        }
        .htqRemoveBtn {
          flex: 0 0 auto;
          width: 26px;
          height: 26px;
          border-radius: 999px;
          border: none;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
          font-size: 15px;
          cursor: pointer;
        }
        .htqAddBtn {
          justify-self: start;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px dashed rgba(255,255,255,0.24);
          background: transparent;
          color: rgba(255,255,255,0.65);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .htqFooter {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .htqCancelBtn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.16);
          background: transparent;
          color: rgba(255,255,255,0.7);
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
        }
        .htqSaveBtn {
          padding: 8px 18px;
          border-radius: 8px;
          border: none;
          background: #8f7cff;
          color: #fff;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
        }
        .htqSaveBtn:disabled, .htqCancelBtn:disabled {
          opacity: 0.6;
          cursor: default;
        }
        @media (max-width: 640px) {
          .htqFightRow {
            flex-direction: column;
            align-items: stretch;
          }
          .htqInput,
          .htqScoreDropdown,
          .htqOpponentSearch {
            width: 100%;
            flex-basis: auto;
          }
          .htqFieldsRow {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedPlayers, setSearchedPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showUntested, setShowUntested] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedPlayerUUID, setSelectedPlayerUUID] = useState("");
  const [newNameInput, setNewNameInput] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [confirmState, setConfirmState] = useState(null);
  const [bannedUsernames, setBannedUsernames] = useState(new Set());
  const [unbanning, setUnbanning] = useState(false);

  // ─── Embedded "Kitiltás" (ban) modal ───
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banDuration, setBanDuration] = useState("1w");
  const [banReason, setBanReason] = useState("");
  const [banImageFile, setBanImageFile] = useState(null);
  const [banImagePreviewUrl, setBanImagePreviewUrl] = useState("");
  const [banDiscordId, setBanDiscordId] = useState("");
  const [banSubmitting, setBanSubmitting] = useState(false);

  // Egyéni időtartam (Kitiltásnál) — évek/hónapok/napok/órák/percek
  const [customYears, setCustomYears] = useState(0);
  const [customMonths, setCustomMonths] = useState(0);
  const [customDays, setCustomDays] = useState(0);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutesVal, setCustomMinutesVal] = useState(0);

  const BAN_DURATIONS = [
    { value: "1d", label: "1 nap" },
    { value: "3d", label: "3 nap" },
    { value: "1w", label: "1 hét" },
    { value: "2w", label: "2 hét" },
    { value: "1m", label: "1 hónap" },
    { value: "3m", label: "3 hónap" },
    { value: "6m", label: "6 hónap" },
    { value: "1y", label: "1 év" },
    { value: "perm", label: "Végleges" },
    { value: "custom", label: "Egyéb (egyéni időtartam)" },
  ];

  const customDurationMinutes =
    (Number(customYears) || 0) * 365 * 24 * 60 +
    (Number(customMonths) || 0) * 30 * 24 * 60 +
    (Number(customDays) || 0) * 24 * 60 +
    (Number(customHours) || 0) * 60 +
    (Number(customMinutesVal) || 0);

  const customDurationLabel = () => {
    const parts = [];
    if (Number(customYears) > 0) parts.push(`${customYears} év`);
    if (Number(customMonths) > 0) parts.push(`${customMonths} hónap`);
    if (Number(customDays) > 0) parts.push(`${customDays} nap`);
    if (Number(customHours) > 0) parts.push(`${customHours} óra`);
    if (Number(customMinutesVal) > 0) parts.push(`${customMinutesVal} perc`);
    return parts.length ? parts.join(" ") : "0 perc";
  };

  // --- Staff fiókok (csak Owner-nek) ---
  const [staffList, setStaffList] = useState([]);
  const [staffPasswordDrafts, setStaffPasswordDrafts] = useState({});
  const [staffBusyId, setStaffBusyId] = useState(null);

  // Unique usernames across all loaded tests — used for the opponent
  // search-dropdown in the Magas Eredmény Kezelő panel.
  const allUsernames = useMemo(() => {
    const set = new Set();
    for (const t of tests) {
      const name = String(t?.username || "").trim();
      if (name) set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tests]);

  // ─── Embedded "Magas Eredmény Kezelő" quick-panel ───
  // Opens inline under a gamemode row when the admin saves a HT3+ (and not
  // retired) tier, instead of persisting the tier immediately — the panel
  // logs the fights to Discord AND resolves/persists the real tier (which
  // may end up one tier lower than picked, if marked as a failed test).
  const [highTestPanel, setHighTestPanel] = useState(null); // { index, entry, testedTier, category, passed, fights }
  const [highTestSaving, setHighTestSaving] = useState(false);
  const [highTestDiscordId, setHighTestDiscordId] = useState("");

  const openHighTestPanel = (index, entry) => {
    const category = categoryForGamemode(entry.gamemode);
    setHighTestPanel({
      index,
      entry,
      testedTier: entry.rank,
      category,
      passed: true,
      fights: [makeFightRow(category, entry.gamemode, entry.rank)],
    });
    setHighTestDiscordId("");
    // Resolve the player's Discord ID from linked accounts, needed for the
    // Discord ping in the fight-log message.
    fetch(`/api/admin/linked-accounts?q=${encodeURIComponent(selectedPlayer?.username || "")}`)
      .then((r) => r.json())
      .then((d) => {
        const match = (d?.accounts || d?.results || []).find(
          (a) => String(a.minecraftName || a.username || "").toLowerCase() === String(selectedPlayer?.username || "").toLowerCase()
        );
        if (match?.discordId) setHighTestDiscordId(match.discordId);
      })
      .catch(() => {});
  };

  const closeHighTestPanel = () => setHighTestPanel(null);

  const addHighTestFight = (tier) => {
    setHighTestPanel((prev) => {
      if (!prev) return prev;
      const rowTier = tier || prev.testedTier;
      return { ...prev, fights: [...prev.fights, makeFightRow(prev.category, prev.entry.gamemode, rowTier)] };
    });
  };

  const updateHighTestFight = (fightId, patch) => {
    setHighTestPanel((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        fights: prev.fights.map((f) => {
          if (f.id !== fightId) return f;
          const next = { ...f, ...patch };
          if (patch.won !== undefined) {
            const opts = scoreOptionsFor(prev.category, prev.entry.gamemode, patch.won);
            next.score = opts[0] || "";
          }
          return next;
        }),
      };
    });
  };

  const removeHighTestFight = (fightId) => {
    setHighTestPanel((prev) => {
      if (!prev) return prev;
      return { ...prev, fights: prev.fights.filter((f) => f.id !== fightId) };
    });
  };

  const saveHighTestPanel = async () => {
    if (!highTestPanel || !selectedPlayer) return;
    const { entry, testedTier, category, passed, fights } = highTestPanel;

    if (!highTestDiscordId) {
      setToast({ type: "error", text: "Nem található linkelt Discord fiók ehhez a játékoshoz — a fight-naplózás Discordra ehhez szükséges." });
      return;
    }
    if (fights.some((f) => !f.opponent.trim())) {
      setToast({ type: "error", text: "Minden fighthoz add meg az ellenfelet" });
      return;
    }
    if (!fights.some((f) => f.tier === testedTier)) {
      setToast({ type: "error", text: `${testedTier} vagy afeletti tierhez legalább egy fight sort meg kell adni.` });
      return;
    }

    const resolvedTier = resolveTierFromTest(testedTier, passed);
    setHighTestSaving(true);

    try {
      const htRes = await fetch("/api/admin/high-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          testedTier,
          gamemode: entry.gamemode,
          overallWon: passed,
          player: { minecraftName: selectedPlayer.username, discordId: highTestDiscordId },
          fights: fights.map((f) => ({
            tier: f.tier || testedTier,
            won: f.won,
            score: f.score,
            opponent: f.opponent.trim(),
            comment: f.comment.trim(),
          })),
        }),
      });
      const htData = await htRes.json();
      if (!htRes.ok) {
        setToast({ type: "error", text: htData.error || "Hiba a fightok mentése során" });
        setHighTestSaving(false);
        return;
      }

      let tierMsg = "";
      if (!resolvedTier) {
        tierMsg = ` Figyelem: sikertelen ${testedTier} teszt esetén nincs ennél gyengébb tier, a tier NEM változott.`;
      } else {
        const tierRes = await fetch("/api/tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: selectedPlayer.username,
            gamemode: entry.gamemode,
            rank: resolvedTier,
            points: getPointsForRating(resolvedTier),
            retired: false,
          }),
        });
        if (!tierRes.ok) {
          const tierData = await tierRes.json();
          tierMsg = ` Figyelem: a fightok mentve, de a tier frissítése sikertelen (${tierData.error || "hiba"}).`;
        } else {
          tierMsg = ` Tier frissítve: ${resolvedTier}.`;
        }
      }

      const freshTests = await loadTests();
      const refreshed = getPlayerData(selectedPlayer.username, showUntested, freshTests);
      setSelectedPlayer(refreshed);
      setToast({ type: "ok", text: `Magas eredmény mentve!${tierMsg}` });
      setHighTestPanel(null);
      setHighTestSaving(false);
    } catch {
      setToast({ type: "error", text: "Hálózati hiba" });
      setHighTestSaving(false);
    }
  };

  // Wraps handleSaveEntry: for HT3+ non-retired ranks, opens the embedded
  // high-test panel instead of saving the tier directly.
  const handleSaveEntryGuarded = (entry, index) => {
    if (entry.rank && !entry.retired && HIGH_TIERS.includes(entry.rank)) {
      openHighTestPanel(index, entry);
      return;
    }
    handleSaveEntry(entry);
  };

  const loadBans = async () => {
    try {
      const res = await fetch("/api/admin/bans");
      if (!res.ok) return;
      const data = await res.json();
      const set = new Set((data.bans || []).map((b) => String(b.username || "").trim().toLowerCase()));
      setBannedUsernames(set);
    } catch {
      // silently ignore — ban status is a nice-to-have, not blocking
    }
  };

  useEffect(() => {
    loadBans();
  }, []);

  const isSelectedPlayerBanned = !!selectedPlayer && bannedUsernames.has(String(selectedPlayer.username || "").trim().toLowerCase());

  const handleUnban = async () => {
    if (!selectedPlayer) return;
    const ok = await showConfirm(`Biztos hogy feloldod "${selectedPlayer.username}" kitiltását?`);
    if (!ok) return;
    setUnbanning(true);
    try {
      const res = await fetch("/api/admin/bans/unban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: selectedPlayer.username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Hiba a feloldás során" });
        setUnbanning(false);
        return;
      }
      await loadBans();
      setToast({ type: "ok", text: "Kitiltás feloldva!" });
      setUnbanning(false);
    } catch {
      setToast({ type: "error", text: "Hálózati hiba" });
      setUnbanning(false);
    }
  };

  const openBanModal = () => {
    if (!selectedPlayer) return;
    setBanDuration("1w");
    setBanReason("");
    setBanImageFile(null);
    setBanImagePreviewUrl("");
    setBanDiscordId("");
    setCustomYears(0);
    setCustomMonths(0);
    setCustomDays(0);
    setCustomHours(0);
    setCustomMinutesVal(0);
    setBanModalOpen(true);
    // Resolve the player's Discord ID from linked accounts.
    fetch(`/api/admin/linked-accounts?q=${encodeURIComponent(selectedPlayer.username || "")}`)
      .then((r) => r.json())
      .then((d) => {
        const match = (d?.accounts || d?.results || []).find(
          (a) => String(a.minecraftName || a.username || "").toLowerCase() === String(selectedPlayer.username || "").toLowerCase()
        );
        if (match?.discordId) setBanDiscordId(match.discordId);
      })
      .catch(() => {});
  };

  const closeBanModal = () => {
    if (banSubmitting) return;
    setBanModalOpen(false);
  };

  const handleBanImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setBanImageFile(file);
    setBanImagePreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  const banDurationLabel = (value) =>
    value === "custom" ? customDurationLabel() : BAN_DURATIONS.find((d) => d.value === value)?.label || value;

  const submitBan = async () => {
    if (!selectedPlayer) return;
    if (!banDiscordId) {
      setToast({ type: "error", text: "Nem található linkelt Discord fiók ehhez a játékoshoz — a kitiltáshoz ez szükséges." });
      return;
    }
    if (!banReason.trim()) {
      setToast({ type: "error", text: "Az indoklás megadása kötelező" });
      return;
    }
    if (banDuration === "custom" && customDurationMinutes <= 0) {
      setToast({ type: "error", text: "Add meg az egyéni időtartamot (legalább 1 percet)" });
      return;
    }

    setBanSubmitting(true);
    try {
      let imageUrl = "";
      if (banImageFile) {
        const form = new FormData();
        form.append("file", banImageFile);
        const upRes = await fetch("/api/admin/upload", { method: "POST", body: form });
        const upData = await upRes.json();
        if (!upRes.ok) {
          setToast({ type: "error", text: upData.error || "Hiba a kép feltöltése során" });
          setBanSubmitting(false);
          return;
        }
        imageUrl = upData.url || "";
      }

      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: { minecraftName: selectedPlayer.username, discordId: banDiscordId },
          uuid: selectedPlayerUUID || "",
          reason: banReason.trim(),
          duration: banDuration,
          ...(banDuration === "custom"
            ? { customMinutes: customDurationMinutes, customLabel: customDurationLabel() }
            : {}),
          imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Hiba a kitiltás során" });
        setBanSubmitting(false);
        return;
      }

      await loadBans();
      setToast({ type: "ok", text: "Játékos kitiltva!" });
      setBanSubmitting(false);
      setBanModalOpen(false);
    } catch {
      setToast({ type: "error", text: "Hálózati hiba" });
      setBanSubmitting(false);
    }
  };

  const showConfirm = (message) => new Promise((resolve) => {
    setConfirmState({ message, resolve });
  });

  const handleConfirm = (result) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };


  useEffect(() => {
    const checkAuth = async () => {
      // These two requests are independent of each other, so run them in
      // parallel instead of waiting for /api/admin/check to fully finish
      // before even starting the /api/tests fetch — this is what made the
      // dashboard feel slow to load.
      const [checkRes, testsData] = await Promise.all([
        fetch("/api/admin/check"),
        fetch("/api/tests", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);
      if (!checkRes.ok) {
        router.push("/admin");
        return;
      }
      const data = await checkRes.json();
      if (data.role) setAdminRole(String(data.role).toLowerCase());
      if (data.admin_name) setAdminName(String(data.admin_name));
      setTests(Array.isArray(testsData?.tests) ? testsData.tests : []);
      setLoading(false);
      if (String(data.role || "").toLowerCase() === "owner") {
        loadStaff();
      }
    };
    checkAuth();
  }, [router]);

  const loadStaff = async () => {
    try {
      const res = await fetch("/api/admin/staff?action=list");
      if (!res.ok) return;
      const data = await res.json();
      setStaffList(Array.isArray(data?.staff) ? data.staff : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (id, name) => {
    const ok = await showConfirm(`Biztos hogy törlöd a "${name}" staff fiókot?`);
    if (!ok) return;
    setStaffBusyId(id);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Staff törlése sikertelen" });
        return;
      }
      await loadStaff();
      setToast({ type: "ok", text: "Staff törölve" });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Hálózati hiba" });
    } finally {
      setStaffBusyId(null);
    }
  };

  const handleDeleteStaffPasskey = async (id, name) => {
    const ok = await showConfirm(`Biztos hogy törlöd "${name}" passkey-jét? Legközelebbi belépéskor újat kell beállítania.`);
    if (!ok) return;
    setStaffBusyId(id);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_passkey", id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Passkey törlése sikertelen" });
        return;
      }
      await loadStaff();
      setToast({ type: "ok", text: "Passkey törölve" });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Hálózati hiba" });
    } finally {
      setStaffBusyId(null);
    }
  };

  const handleChangeStaffPassword = async (id, name) => {
    const newPassword = String(staffPasswordDrafts[id] || "").trim();
    if (!newPassword) {
      setToast({ type: "error", text: "Adj meg egy új jelszót" });
      return;
    }
    setStaffBusyId(id);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id, admin_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Jelszó módosítása sikertelen" });
        return;
      }
      setStaffPasswordDrafts((prev) => ({ ...prev, [id]: "" }));
      setToast({ type: "ok", text: `Jelszó frissítve (${name})` });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Hálózati hiba" });
    } finally {
      setStaffBusyId(null);
    }
  };


  // Auto-dismiss toast after 2 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const loadTests = async () => {
    try {
      const res = await fetch("/api/tests", { cache: "no-store" });
      const data = await res.json();
      const nextTests = Array.isArray(data?.tests) ? data.tests : [];
      setTests(nextTests);
      return nextTests;
    } catch (err) {
      console.error("Failed to load tests:", err);
      return tests;
    }
  };

  const safeInt = (n, fallback = 0) => {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
  };

  const findBestRank = (ranks) => {
    const rankOrder = ["HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5",""];
    const tierRanks = ranks.map((r) => normalizeRankToTier(r));
    for (const r of rankOrder) {
      if (tierRanks.includes(r)) return r;
    }
    return tierRanks[0] || "";
  };

  const getStats = () => {
    const uniquePlayers = new Set(tests.map((t) => String(t.username).trim().toLowerCase())).size;
    const totalTiers = tests.length;
    return { uniquePlayers, totalTiers };
  };

    const getPlayerData = (username, includeUntested = false, testsOverride = null) => {
     const cleanName = String(username || "").trim();
     const sourceTests = testsOverride || tests;
     const playerTests = sourceTests.filter((t) => String(t?.username || "").trim().toLowerCase() === cleanName.toLowerCase());
     if (playerTests.length === 0 && !includeUntested) return null;

      const mapped = playerTests.map((t) => {
        return {
          gamemode: t.gamemode,
          uuid: t.uuid || null,
          rank: t.rank || "",
          retired: t.retired === true,
          points: t.points || 0,
          id: t.id,
          created_at: t.created_at || null,
          isTester: t.is_tester === true,
        };
      });
      let entries = [...mapped];

      // Always include every gamemode so none are hidden
      const testedModes = new Set(entries.map((e) => e.gamemode.toLowerCase()));
      for (const mode of MODE_OPTIONS) {
        if (!testedModes.has(mode.toLowerCase())) {
          entries.push({
            gamemode: mode,
            rank: "",
            retired: false,
            points: 0,
            id: null,
            created_at: null,
            isUntested: true,
            isTester: false,
          });
        }
      }

      const totalPoints = entries.reduce((sum, e) => sum + safeInt(getPointsForRating(e.rank), 0), 0);
     const bestRank = findBestRank(entries.map((e) => e.rank));

      // Keep gamemode cards in a fixed, predictable order (matching
      // MODE_OPTIONS) instead of the points-sorted order the API returns.
      // Otherwise saving a lower tier changes that entry's points, which
      // reorders the list and makes a *different* mode appear to occupy
      // the same on-screen slot right after saving.
      const modeOrderIndex = (mode) => {
        const i = MODE_OPTIONS.findIndex((m) => m.toLowerCase() === String(mode || "").toLowerCase());
        return i === -1 ? MODE_OPTIONS.length : i;
      };
      entries = [...entries].sort((a, b) => modeOrderIndex(a.gamemode) - modeOrderIndex(b.gamemode));

      const firstUuid = playerTests.find((t) => t.uuid)?.uuid || null;

     return {
       username,
       uuid: firstUuid,
       entries,
       totalPoints,
       bestRank,
       totalModes: entries.length,
       modes: entries.map((e) => e.gamemode),
     };
  };

   const handleSearch = (query) => {
     setSearchQuery(query);
     if (query.trim().length === 0) {
       setSearchedPlayers([]);
       return;
     }

     const uniquePlayers = [...new Set(tests.map((t) => String(t?.username || "").trim()))];
     const filtered = uniquePlayers.filter((p) => p.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 10);

     setSearchedPlayers(filtered);
   };

  const selectPlayer = async (username) => {
    const playerData = getPlayerData(username, showUntested);
    if (playerData) {
      setSelectedPlayer(playerData);
      setNewNameInput("");
    }
    setSearchQuery("");
    setSearchedPlayers([]);
  };

const handleSaveEntry = async (entry) => {
    try {
      // "Rangsorolatlan" (unranked) has no tier value — /api/tests always
      // requires a rank, so saving an empty one here used to fail with
      // "Missing username/gamemode/rank". An empty rank really means
      // "remove this entry", so route it to /api/tests/remove instead.
      if (!entry.rank) {
        const res = await fetch("/api/tests/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: selectedPlayer.username,
            gamemode: entry.gamemode,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setToast({ type: "error", text: data.error || "Hiba a mentés során" });
          return;
        }

        const freshTests = await loadTests();
        const refreshed = getPlayerData(selectedPlayer.username, showUntested, freshTests);
        setSelectedPlayer(refreshed);
        setToast({ type: "ok", text: "Mentve!" });
        return;
      }

      const points = getPointsForRating(entry.rank);
      const payload = {
        username: selectedPlayer.username,
        gamemode: entry.gamemode,
        rank: entry.rank,
        points,
        retired: entry.retired === true,
      };
      const entryId = Number(entry.id);
      if (Number.isFinite(entryId) && entryId > 0) {
        payload.id = entryId;
      }
      
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

       if (!res.ok) {
        const data = await res.json();
        setToast({ type: "error", text: data.error || "Hiba a mentés során" });
        return;
      }

      const freshTests = await loadTests();
      const refreshed = getPlayerData(selectedPlayer.username, showUntested, freshTests);
      setSelectedPlayer(refreshed);
      setToast({ type: "ok", text: "Mentve!" });
    } catch (err) {
      setToast({ type: "error", text: "Hálózati hiba" });
    }
  };

  const handleToggleTester = async (entry, index) => {
    if (!selectedPlayer || entry.isUntested) return;
    const nextValue = !entry.isTester;

    // Optimistic UI update.
    setSelectedPlayer((prev) => {
      if (!prev) return prev;
      const entries = [...prev.entries];
      entries[index] = { ...entries[index], isTester: nextValue };
      return { ...prev, entries };
    });

    try {
      const res = await fetch("/api/admin/set-tester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selectedPlayer.username,
          gamemode: entry.gamemode,
          is_tester: nextValue,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Revert on failure.
        setSelectedPlayer((prev) => {
          if (!prev) return prev;
          const entries = [...prev.entries];
          entries[index] = { ...entries[index], isTester: !nextValue };
          return { ...prev, entries };
        });
        setToast({ type: "error", text: data.error || "Hiba a Tester jelölő mentésekor" });
        return;
      }

      setToast({ type: "ok", text: nextValue ? "Tester rang megadva" : "Tester rang elvéve" });
    } catch (err) {
      setSelectedPlayer((prev) => {
        if (!prev) return prev;
        const entries = [...prev.entries];
        entries[index] = { ...entries[index], isTester: !nextValue };
        return { ...prev, entries };
      });
      setToast({ type: "error", text: "Hálózati hiba" });
    }
  };

  const updateEntryField = (index, field, value) => {
    setSelectedPlayer((prev) => {
      if (!prev) return prev;
      const entries = [...prev.entries];
      const current = entries[index];
      if (field === "rank") {
        entries[index] = {
          ...current,
          rank: value,
          points: getPointsForRating(value),
        };
      } else {
        entries[index] = { ...current, [field]: value };
      }
      return { ...prev, entries };
    });
  };

  // Selecting a rank in the picker also carries whether it was picked from
  // the "Visszavonult tierek" group, so rank + retired are always updated
  // together (a retired pick keeps a real tier code, e.g. "LT2", and flags
  // the entry as retired in one step).
  const updateEntryRank = (index, rankValue, isRetired) => {
    setSelectedPlayer((prev) => {
      if (!prev) return prev;
      const entries = [...prev.entries];
      const current = entries[index];
      entries[index] = {
        ...current,
        rank: rankValue,
        retired: !!isRetired,
        points: getPointsForRating(rankValue),
      };
      return { ...prev, entries };
    });
  };

  const handleDeleteEntry = async (gamemode) => {
    const ok = await showConfirm(`Biztos hogy törlöd a "${gamemode}" tesztet?`);
    if (!ok) return;

    try {
      const res = await fetch("/api/tests/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selectedPlayer.username,
          gamemode: gamemode,
        }),
      });

      if (!res.ok) {
        setToast({ type: "error", text: "Hiba a törlés során" });
        return;
      }

const freshTests = await loadTests();
      const refreshed = getPlayerData(selectedPlayer.username, showUntested, freshTests);
      setSelectedPlayer(refreshed);
      setToast({ type: "ok", text: "Törölve!" });
    } catch (err) {
      setToast({ type: "error", text: "Hálózati hiba" });
    }
   };

  // ── UUID & name refresh from Mojang ──
  useEffect(() => {
    if (!selectedPlayer) return;
    const ac = new AbortController();
    fetch(`/api/mojang?username=${encodeURIComponent(selectedPlayer.username)}`, { signal: ac.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) setSelectedPlayerUUID(formatUUID(d.id)); })
      .catch(() => {});
    return () => ac.abort();
  }, [selectedPlayer]);

  function formatUUID(raw) {
    const clean = raw.replace(/-/g, "");
    return `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`;
  }

 const handleRefreshName = async () => {
    if (!selectedPlayer) return;
    try {
      const currentName = selectedPlayer.username;

      const isUuidInput = (value) => {
        const raw = String(value || "").replace(/-/g, "").trim();
        return /^[0-9a-fA-F]{32}$/.test(raw);
      };

      let targetNewName = null;
      let currentMojangName = null;

      if (selectedPlayer.uuid) {
        const res = await fetch(`/api/mojang?uuid=${selectedPlayer.uuid.replace(/-/g, "")}`);
        if (res.ok) {
          const data = await res.json();
          currentMojangName = data.name;
        }
      }

      if (currentMojangName) {
        targetNewName = currentMojangName;
      } else if (newNameInput.trim()) {
        if (isUuidInput(newNameInput)) {
          const uuidRes = await fetch(`/api/mojang?uuid=${newNameInput.replace(/-/g, "")}`);
          if (uuidRes.ok) {
            const uuidData = await uuidRes.json();
            targetNewName = uuidData.name;
          }
        } else {
          targetNewName = newNameInput.trim();
        }
      }

      if (!targetNewName) {
        setToast({ type: "error", text: "Adj meg egy érvényes játékosnevet vagy UUID-t!" });
        return;
      }

      if (targetNewName === currentName) {
        setToast({ type: "error", text: "Az új név megegyezik a jelenlegivel." });
        return;
      }

      // Call rename API to transfer tiers from old name to new name
      const renameRes = await fetch("/api/tests/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldName: currentName,
          newName: targetNewName,
        }),
      });
      const renameData = await renameRes.json();
      if (!renameRes.ok) {
        setToast({ type: "error", text: renameData.error || "Hiba a név megváltoztatásakor" });
        return;
      }

      setToast({ type: "ok", text: `Név megváltoztatva: ${currentName} → ${targetNewName}` });
      await loadTests();
      setNewNameInput("");
    } catch { setToast({ type: "error", text: "Hálózati hiba" }); }
  };


  const handleRemovePlayer = async () => {
    const ok1 = await showConfirm(`Biztos hogy eltávolítod "${selectedPlayer.username}" játékosadatát a weboldalról?`);
    if (!ok1) return;
    const ok2 = await showConfirm("Ez a művelet nem vonható vissza. Folytatod?");
    if (!ok2) return;
    try {
      await fetch("/api/admin/remove-player", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: selectedPlayer.username }) });
      await loadTests();
      setSelectedPlayer(null);
      setToast({ type: "ok", text: "Játékos eltávolítva a weboldalról." });
    } catch { setToast({ type: "error", text: "Hálózati hiba" }); }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="adminDashboard admin-panel">
        <div className="loadingState">Betöltés...</div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="adminDashboard admin-panel">

      {/* Toast notification */}
      {toast && (
        <div
          className={`toast ${toast.type === "error" ? "toastError" : "toastOk"}`}
        >
          {toast.text}
        </div>
      )}

      {confirmState && (
        <div className="modalOverlay" onClick={() => handleConfirm(false)}>
          <div className="modalContent modalSmall" onClick={(e) => e.stopPropagation()}>
            <h3 className="modalTitle">Megerősítés</h3>
            <p className="modalSubtitle">{confirmState.message}</p>
            <div className="modalActions">
              <button className="modalBtn modalBtnCancel" onClick={() => handleConfirm(false)}>
                Mégse
              </button>
              <button className="modalBtn modalBtnConfirm" onClick={() => handleConfirm(true)}>
                Igen
              </button>
            </div>
          </div>
        </div>
      )}

      {banModalOpen && selectedPlayer && (
        <div className="modalOverlay" onClick={closeBanModal}>
          <div className="modalContent banModalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="modalTitle">Játékos kitiltása — {selectedPlayer.username}</h3>

            {!banDiscordId && (
              <span className="htqWarn">
                Nincs linkelt Discord fiók ehhez a játékoshoz — a kitiltáshoz ez szükséges.
              </span>
            )}

            <label className="htLabel">
              Időtartam
              <CustomDropdown
                value={banDuration}
                options={BAN_DURATIONS}
                onChange={(v) => setBanDuration(v)}
                disabled={banSubmitting}
              />
            </label>

            {banDuration === "custom" && (
              <div className="htLabel">
                Egyéni időtartam
                <div className="banCustomDurationGrid">
                  <label className="banCustomField">
                    <span>Év</span>
                    <input
                      type="number"
                      min="0"
                      className="htInput"
                      value={customYears}
                      onChange={(e) => setCustomYears(Math.max(0, Number(e.target.value) || 0))}
                      disabled={banSubmitting}
                    />
                  </label>
                  <label className="banCustomField">
                    <span>Hónap</span>
                    <input
                      type="number"
                      min="0"
                      className="htInput"
                      value={customMonths}
                      onChange={(e) => setCustomMonths(Math.max(0, Number(e.target.value) || 0))}
                      disabled={banSubmitting}
                    />
                  </label>
                  <label className="banCustomField">
                    <span>Nap</span>
                    <input
                      type="number"
                      min="0"
                      className="htInput"
                      value={customDays}
                      onChange={(e) => setCustomDays(Math.max(0, Number(e.target.value) || 0))}
                      disabled={banSubmitting}
                    />
                  </label>
                  <label className="banCustomField">
                    <span>Óra</span>
                    <input
                      type="number"
                      min="0"
                      className="htInput"
                      value={customHours}
                      onChange={(e) => setCustomHours(Math.max(0, Number(e.target.value) || 0))}
                      disabled={banSubmitting}
                    />
                  </label>
                  <label className="banCustomField">
                    <span>Perc</span>
                    <input
                      type="number"
                      min="0"
                      className="htInput"
                      value={customMinutesVal}
                      onChange={(e) => setCustomMinutesVal(Math.max(0, Number(e.target.value) || 0))}
                      disabled={banSubmitting}
                    />
                  </label>
                </div>
                {customDurationMinutes <= 0 && (
                  <span className="htqWarn">Add meg legalább az egyik mezőt (pl. napok száma)</span>
                )}
              </div>
            )}

            <label className="htLabel">
              Indoklás
              <textarea
                className="htInput htTextarea"
                placeholder="Miért lesz kitiltva a játékos?"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                disabled={banSubmitting}
                rows={4}
              />
            </label>

            <label className="htLabel">
              Bizonyíték kép (opcionális, PNG/JPG/WEBP/GIF, max 8MB)
              <div className="banUploadDrop">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleBanImageChange}
                  disabled={banSubmitting}
                />
                {banImagePreviewUrl ? (
                  <img src={banImagePreviewUrl} alt="Bizonyíték előnézet" className="banUploadPreview" />
                ) : (
                  <span className="banUploadHint">Válassz egy képet…</span>
                )}
              </div>
            </label>

            <div className="htLabel">
              Discord üzenet előnézet
              <div className="htDiscordBubble">
                <div className="htDiscordLine">
                  <strong>{banDiscordId ? `<@${banDiscordId}>` : "<@ismeretlen>"}</strong> -{" "}
                  <code>{selectedPlayer.username}</code>
                  {selectedPlayerUUID ? <code> ({selectedPlayerUUID})</code> : null}
                </div>
                {(banReason || "Indoklás…").split("\n").map((line, i) => (
                  <div className="htDiscordQuote" key={i}>
                    {line || " "}
                  </div>
                ))}
                <div className="htDiscordLine">
                  <strong>Lejárat:</strong> {banDuration === "perm" ? "Sosem (végleges)" : `${banDurationLabel(banDuration)} múlva`}
                </div>
                {banImagePreviewUrl && (
                  <div className="htDiscordLine">
                    <strong>Bizonyíték:</strong> csatolt kép
                  </div>
                )}
              </div>
            </div>

            <div className="modalActions">
              <button className="modalBtn modalBtnCancel" onClick={closeBanModal} disabled={banSubmitting}>
                Mégse
              </button>
              <button className="modalBtn modalBtnConfirm" onClick={submitBan} disabled={banSubmitting}>
                {banSubmitting ? "Kitiltás..." : "Kitiltás véglegesítése"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminNavbar adminName={adminName} adminRole={adminRole} onLogout={handleLogout} />

      <header className="adminHeader">
          <div className="headerLeft">
            <p className="headerSubtitle">Áttekintés</p>
          </div>
         <div className="headerStats">
           <div className="headerStat">
             <span className="headerStatValue">{stats.uniquePlayers}</span>
             <span className="headerStatLabel">Játékos</span>
           </div>
            <div className="headerStat">
              <span className="headerStatValue">{stats.totalTiers}</span>
              <span className="headerStatLabel">Tier</span>
            </div>
          </div>
        </header>

      <main className="adminContent">
        <div className="searchSection">
          <div className="searchContainer">
            <svg className="searchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="searchInput"
              placeholder="Játékos keresése..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          {searchedPlayers.length > 0 && (
            <div className="searchResults">
              {searchedPlayers.map((player) => (
                <button key={player} className="searchResultItem" onClick={() => selectPlayer(player)}>
                  {player}
                </button>
              ))}
            </div>
          )}
        </div>



        {adminRole === "owner" && (
          <div className="staffSplitSection">
            <div className="staffCardHalf">
              <div className="staffCardHeader">
                <h2>Staff fiókok</h2>
                <span className="staffCount">{staffList.length} fiók</span>
              </div>

              {staffList.length === 0 ? (
                <div className="staffEmpty">Nincs még létrehozott staff fiók.</div>
              ) : (
                <div className="staffCardList">
                  {staffList.map((staff) => {
                    const normalizedRole = String(staff.role || "").toLowerCase();
                    const busy = staffBusyId === staff.id;
                    return (
                      <div key={staff.id} className="staffCardItem">
                        <div className="staffCardItemTop">
                          <img
                            className="staffCardAvatar"
                            src={`https://mc-heads.net/avatar/${encodeURIComponent(staff.admin_name || "MHF_Question")}/40`}
                            alt=""
                            width={34}
                            height={34}
                          />
                          <div className="staffCardInfo">
                            <span className="staffCardName">{staff.admin_name}</span>
                            <div className="staffCardBadges">
                              <span className={`staffCardRole role-${normalizedRole}`}>
                                {normalizedRole === "owner" ? "★ " : ""}
                                {normalizedRole.toUpperCase()}
                              </span>
                              <span className={`staffCardStatus ${staff.has_passkey ? "ok" : "warn"}`}>
                                {staff.has_passkey ? "Van passkey" : "Nincs passkey"}
                              </span>
                            </div>
                          </div>
                          <div className="staffCardActions">
                            {staff.has_passkey && (
                              <button
                                type="button"
                                className="staffLabelBtn"
                                disabled={busy}
                                onClick={() => handleDeleteStaffPasskey(staff.id, staff.admin_name)}
                              >
                                Passkey törlése
                              </button>
                            )}
                            <button
                              type="button"
                              className="staffLabelBtn delete"
                              disabled={busy}
                              onClick={() => handleDeleteStaff(staff.id, staff.admin_name)}
                            >
                              Staff törlése
                            </button>
                          </div>
                        </div>

                        <div className="staffCardPasswordRow">
                          <input
                            type="text"
                            className="staffPasswordInput"
                            placeholder="Új jelszó..."
                            value={staffPasswordDrafts[staff.id] || ""}
                            onChange={(e) =>
                              setStaffPasswordDrafts((prev) => ({ ...prev, [staff.id]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className="staffPasswordBtn"
                            disabled={busy || !String(staffPasswordDrafts[staff.id] || "").trim()}
                            onClick={() => handleChangeStaffPassword(staff.id, staff.admin_name)}
                          >
                            Csere
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="staffCardHalf playerDetailsHalf">
              {selectedPlayer ? (
          <div className="playerDetailsSection">
            <button className="closeDetailsBtn" onClick={() => setSelectedPlayer(null)}>
              ✕ Bezárás
            </button>

            <div className="playerDetailsCard">
              {/* ─── HEAD + NAME + UUID ─── */}
              <div className="pdRow pdRowHead">
                <img
                  src={
                    selectedPlayer.uuid
                      ? `https://mc-heads.net/avatar/${selectedPlayer.uuid.replace(/-/g, "")}/96`
                      : `https://mc-heads.net/avatar/${encodeURIComponent(selectedPlayer.username)}/96`
                  }
                  alt={selectedPlayer.username}
                  className="playerDetailsSkin"
                />
                <div className="pdNameBlock">
                  <h2 className="playerDetailsName">{selectedPlayer.username}</h2>
                  <span className="pdUuid">{selectedPlayerUUID || "Minecraft UUID betöltése…"}</span>
                  <div className="pdNameRefresh">
                    <input
                      type="text"
                      className="pdNameInput"
                      placeholder="Minecraft név frissítése…"
                      value={newNameInput}
                      onChange={(e) => setNewNameInput(e.target.value)}
                    />
                    <button className="pdRefreshBtn" onClick={handleRefreshName}>
                      Név frissítése
                    </button>
                  </div>
                  <div className="pdActionBtns">
                    {!isSelectedPlayerBanned && (
                      <button className="pdBanBtn" onClick={openBanModal}>
                        Kitiltás
                      </button>
                    )}
                    {adminRole !== "regulator" && (
                      <button className="pdRemoveBtn" onClick={handleRemovePlayer}>
                        Eltávolítás
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── STAT BUBBLES ─── */}
              <div className="pdRow pdBubbles">
                <div className="pdBubble">
                  <span className="pdBubbleLabel">Összpont</span>
                  <span className="pdBubbleValue">{selectedPlayer.totalPoints}</span>
                </div>
                <div className="pdBubble">
                  <span className="pdBubbleLabel">Tesztelt módok</span>
                  <span className="pdBubbleValue">{selectedPlayer.totalModes}</span>
                </div>
<div className="pdBubble">
                       <span className="pdBubbleLabel">Legjobb Tier</span>
                       <span className="pdBubbleValue tierBadgeInline">{selectedPlayer.bestRank}</span>
                     </div>
                <div className="pdBubble">
                  <span className="pdBubbleLabel">Globális Állapot</span>
                  <span className={`pdBubbleValue ${isSelectedPlayerBanned ? "pdStatusBanned" : "pdStatusActive"}`}>
                    {isSelectedPlayerBanned ? "Kitiltva" : "Aktív"}
                  </span>
                  {isSelectedPlayerBanned && (
                    <button
                      type="button"
                      className="pdUnbanBtn"
                      onClick={handleUnban}
                      disabled={unbanning}
                    >
                      {unbanning ? "Feloldás..." : "Kitiltás feloldása"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ─── GAMEMODE TIER MANAGEMENT ─── */}
            <div className="playerTiersSection">
<div className="tiersSectionHeader">
                <h3 className="tiersSectionTitle">Játékmódok</h3>
                <span className="tiersSubtitle">Tier kezelés admin joggal.</span>
</div>
              {/*.adminTiersList */}
              <div className="playerTiersList">
                {selectedPlayer.entries.map((entry, index) => {
                  const isRetired = entry.retired === true;
                  const isUntested = entry.isUntested;
                  const displayRank = entry.rank || "";
                  const displayPoints = getPointsForRating(displayRank);

                  return (
                    <div key={`${entry.gamemode}-${entry.id}`} className={`tierEntryCard ${isRetired ? "retired" : ""} ${isUntested ? "untested" : ""}`}>
                      <div className="tierModeCircle">
                        {MODE_ICONS[entry.gamemode] && (
                          <img src={MODE_ICONS[entry.gamemode]} alt={entry.gamemode} className="tierModeCircleImg" />
                        )}
                        <span className="tierModeCircleLabel">{entry.gamemode}</span>
                      </div>

                      <div className="tierEntryControls">
                        {adminRole === "owner" && (
                          <label
                            className={`testerCheckbox ${isUntested ? "disabled" : ""}`}
                            title={isUntested ? "Nincs mentett teszt ehhez a módhoz" : "Tester rang ebben a módban"}
                          >
                            <input
                              type="checkbox"
                              checked={!!entry.isTester}
                              disabled={isUntested}
                              onChange={() => handleToggleTester(entry, index)}
                            />
                            <span className="testerCheckboxLabel">Tester</span>
                          </label>
                        )}
                        <AdminRankPicker
                          value={displayRank}
                          retired={isRetired}
                          onChange={(rank, retired) => {
                            updateEntryRank(index, rank, retired);
                            if (rank && !retired && HIGH_TIERS.includes(rank)) {
                              openHighTestPanel(index, { ...entry, rank, retired });
                            } else if (highTestPanel && highTestPanel.index === index) {
                              closeHighTestPanel();
                            }
                          }}
                          onSave={() => handleSaveEntryGuarded(entry, index)}
                        />
                      </div>

                      {highTestPanel && highTestPanel.index === index && (
                        <HighTestQuickPanel
                          panel={highTestPanel}
                          discordId={highTestDiscordId}
                          saving={highTestSaving}
                          usernames={allUsernames}
                          onSetPassed={(passed) => setHighTestPanel((prev) => (prev ? { ...prev, passed } : prev))}
                          onSetTestedTier={(testedTier) => setHighTestPanel((prev) => (prev ? { ...prev, testedTier } : prev))}
                          onAddFight={addHighTestFight}
                          onUpdateFight={updateHighTestFight}
                          onRemoveFight={removeHighTestFight}
                          onCancel={closeHighTestPanel}
                          onSave={saveHighTestPanel}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
              ) : (
                <div className="playerDetailsPlaceholder">
                  <span>Keress rá egy játékosra a szerkesztéshez.</span>
                </div>
              )}
            </div>
          </div>
        )}

      </main>


      <style jsx>{`
        .adminDashboard {
          min-height: 100vh;
          background: var(--bg, #0b0e14);
          color: var(--text, #fffffff0);
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }

        .adminNavbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 16px 24px;
          background: rgba(11, 14, 20, 0.94);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
          max-width: 1480px;
          margin: 0 auto;
        }

        .navbarLeft {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 0 0 auto;
        }

        .navbarTitle {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
          letter-spacing: 0.02em;
        }

        .navbarLinks {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          flex: 1;
          min-width: 240px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .navbarLink {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          color: rgba(255, 255, 255, 0.72);
          text-decoration: none;
          font-weight: 800;
          font-size: 13px;
          border-radius: 999px;
          transition: color 0.18s ease, background 0.18s ease, transform 0.18s ease;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .navbarLink:hover,
        .navbarLink.active {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        .adminUserBadge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
        }

        .adminUserBadge span {
          opacity: 0.75;
        }

        .adminUserBadge strong {
          color: #4ade80;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .adminHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 20px;
          background: rgba(11, 14, 20, 0.5);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 1480px;
          margin: 0 auto;
          gap: 30px;
        }

        .headerLeft {
          flex: 1;
        }

        .headerSubtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .headerStats {
          display: flex;
          gap: 14px;
        }

        .headerStat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 10px 22px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(143, 124, 255, 0.14), rgba(143, 124, 255, 0.03));
          border: 1px solid rgba(143, 124, 255, 0.25);
          box-shadow: 0 6px 20px rgba(143, 124, 255, 0.12);
        }

        .headerStatValue {
          font-size: 26px;
          font-weight: 900;
          background: linear-gradient(90deg, #fff, #cfc6ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .headerStatLabel {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 800;
        }

        .logoutBtn {
          padding: 10px 20px;
          background: #d64747;
          border: 1px solid rgba(214, 71, 71, 0.7);
          border-radius: 6px;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logoutBtn:hover {
          background: #c23f3f;
        }

        .adminContent {
          max-width: 1480px;
          margin: 0 auto;
          padding: 30px 20px;
          display: grid;
          gap: 30px;
        }

        .searchSection {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          display: grid;
          gap: 16px;
        }

        .searchContainer {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 16px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .searchContainer:focus-within {
          border-color: rgba(143, 124, 255, 0.6);
          box-shadow: 0 0 0 3px rgba(143, 124, 255, 0.15);
        }

        .searchIcon {
          width: 20px;
          height: 20px;
          color: rgba(255, 255, 255, 0.65);
          flex-shrink: 0;
        }

        .searchInput {
          width: 100%;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 15px;
          outline: none;
        }

        .searchInput::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .searchResults {
          display: grid;
          gap: 6px;
          max-height: 260px;
          overflow-y: auto;
          padding: 4px 0;
        }

        .searchResultItem {
          text-align: left;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
          font-family: inherit;
          font-size: 14px;
        }

        .searchResultItem:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(2px);
        }

        .searchResultItem:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .staffSplitSection {
          display: grid;
          grid-template-columns: 3fr 1fr;
          gap: 18px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .staffSplitSection {
            grid-template-columns: 1fr;
          }
        }

        .staffCardHalf {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px 22px;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 10px 30px rgba(0, 0, 0, 0.25);
          order: 2;
        }

        .playerDetailsHalf {
          padding: 0;
          background: none;
          border: none;
          box-shadow: none;
          order: 1;
        }

        .playerDetailsHalf .playerDetailsSection {
          margin: 0;
        }

        .playerDetailsPlaceholder {
          height: 100%;
          min-height: 220px;
          border-radius: 20px;
          border: 1px dashed rgba(255, 255, 255, 0.24);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
          display: grid;
          place-items: center;
          text-align: center;
          padding: 24px;
        }

        .playerDetailsPlaceholder span {
          color: rgba(255, 255, 255, 0.55);
          font-size: 14px;
          font-weight: 600;
        }

        .staffCardHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          margin-bottom: 14px;
        }

        .staffCardHeader h2 {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.85);
        }

        .staffCount {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(143, 124, 255, 0.14);
          border: 1px solid rgba(143, 124, 255, 0.35);
          color: #d7d0ff;
          font-size: 11.5px;
          font-weight: 800;
        }

        .staffEmpty {
          padding: 20px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.14);
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13.5px;
        }

        .staffCardList {
          display: grid;
          gap: 10px;
        }

        .staffCardItem {
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.025);
          padding: 12px 14px;
          display: grid;
          gap: 10px;
        }

        .staffCardItemTop {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 10px;
        }

        .staffCardAvatar {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          object-fit: cover;
          image-rendering: pixelated;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
          flex: 0 0 auto;
        }

        .staffCardInfo {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 90px;
          flex: 1;
        }

        .staffCardName {
          font-weight: 800;
          font-size: 13.5px;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .staffCardBadges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .staffCardRole {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.04em;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(143, 124, 255, 0.16);
          border: 1px solid rgba(143, 124, 255, 0.35);
          color: #d7d0ff;
        }

        .staffCardRole.role-owner {
          background: rgba(213, 179, 85, 0.18);
          border-color: rgba(213, 179, 85, 0.45);
          color: #e8cf8a;
        }

        .staffCardStatus {
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.65);
        }

        .staffCardStatus.ok {
          background: rgba(52, 211, 153, 0.12);
          border-color: rgba(52, 211, 153, 0.4);
          color: #8ff0c9;
        }

        .staffCardStatus.warn {
          background: rgba(214, 158, 71, 0.14);
          border-color: rgba(214, 158, 71, 0.4);
          color: #f0cf8f;
        }

        .staffCardActions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          flex: 0 0 auto;
          margin-left: auto;
        }

        .staffLabelBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 30px;
          padding: 0 12px;
          border-radius: 9px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.75);
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 600;
          white-space: nowrap;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .staffLabelBtn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .staffLabelBtn:hover:not(:disabled) {
          border-color: rgba(143, 124, 255, 0.5);
          background: rgba(143, 124, 255, 0.14);
        }

        .staffLabelBtn.delete:hover:not(:disabled) {
          border-color: rgba(214, 71, 71, 0.5);
          background: rgba(214, 71, 71, 0.16);
          color: #ffb4b4;
        }

        .staffCardPasswordRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .staffPasswordInput {
          flex: 1 1 100px;
          min-width: 0;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          padding: 8px 12px;
          font-size: 13px;
          font-family: inherit;
        }

        .staffPasswordInput:focus {
          outline: none;
          border-color: #8f7cff;
        }

        .staffPasswordBtn {
          flex: 0 0 auto;
          padding: 8px 14px;
          border-radius: 10px;
          border: none;
          font-weight: 800;
          font-size: 12.5px;
          cursor: pointer;
          background: linear-gradient(135deg, #8f7cff, #6f5cd6);
          color: #fff;
          transition: transform 0.1s ease, box-shadow 0.15s ease;
        }

        .staffPasswordBtn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .staffPasswordBtn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(143, 124, 255, 0.35);
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modalContent {
          background: #0f1117;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 28px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
        }

        .modalTitle {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
        }

        .modalSubtitle {
          margin: 0 0 18px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .modalInput {
          width: 100%;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          outline: none;
          box-sizing: border-box;
        }

        .modalInput:focus {
          border-color: #4ade80;
        }

        .modalActions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
          justify-content: flex-end;
        }

        .modalBtn {
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          border: none;
          transition: background 0.2s;
        }

        .modalBtnCancel {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .modalBtnCancel:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .modalBtnConfirm {
          background: #4ade80;
          color: #000;
        }

        .modalBtnConfirm:hover {
          background: #22c55e;
        }

        .playerDetailsSection {
          background: rgba(11, 14, 20, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 24px;
          display: grid;
          gap: 20px;
        }

        .closeDetailsBtn {
          align-self: flex-end;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          color: #fff;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }

        .closeDetailsBtn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .playerDetailsCard {
          display: grid;
          gap: 24px;
          transition: transform 0.18s ease, opacity 0.18s ease;
          transform: translateY(0);
          opacity: 1;
        }

        .playerDetailsHeader {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .playerDetailsSkin {
          width: 96px;
          height: 96px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }

        .playerDetailsInfo {
          flex: 1;
        }

        .playerDetailsName {
          font-size: 28px;
          margin: 0 0 12px 0;
          font-weight: 800;
        }

        .playerDetailsStats {
          display: grid;
          gap: 10px;
        }

        .playerDetailStat {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          background: rgba(255, 255, 255, 0.04);
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
        }

        .detailLabel {
          color: rgba(255, 255, 255, 0.65);
          font-weight: 800;
        }

        .detailValue {
          font-weight: 800;
          color: #fff;
          text-align: right;
        }

        .tierModes {
          word-break: break-word;
          text-align: right;
        }

        .playerTiersSection {
          display: grid;
          gap: 14px;
        }

        .tiersSectionTitle {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
        }

        .playerTiersList {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tierEntryCard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255, 255, 255, 0.08);
          min-width: 0;
          transition: border-color 0.15s ease;
        }

        .tierEntryCard:hover {
          border-color: rgba(255, 255, 255, 0.16);
        }

        .tierEntryCard.retired {
          opacity: 0.6;
          border-style: dashed;
        }

        .tierEntryModeInfo {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .tierEntryMode {
          font-size: 13px;
          font-weight: 800;
        }

        .tierEntryControls {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          min-width: 0;
          flex: 0 0 auto;
        }

        .testerCheckbox {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          user-select: none;
        }

        .testerCheckbox input {
          accent-color: #8f7cff;
          width: 14px;
          height: 14px;
          cursor: pointer;
        }

        .testerCheckboxLabel {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
        }

        .testerCheckbox.disabled {
          opacity: 0.4;
        }

        .testerCheckbox.disabled input,
        .testerCheckbox.disabled {
          cursor: not-allowed;
        }

        .tierPointsBadge {
           display: inline-flex;
           align-items: center;
           justify-content: center;
           min-width: 60px;
           padding: 4px 8px;
           font-size: 11px;
           font-weight: 800;
           border-radius: 6px;
           background: rgba(255, 255, 255, 0.06);
           border: 1px solid rgba(255, 255, 255, 0.12);
           color: rgba(255, 255, 255, 0.8);
           text-align: center;
         }

        .retireCheckbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          position: relative;
          height: 30px;
        }

        .retireCheckbox input {
          display: none;
        }

        .checkboxLabel {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          transition: all 0.2s;
          font-size: 14px;
          user-select: none;
        }

        .retireCheckbox input:checked ~ .checkboxLabel {
          background: rgba(196, 30, 58, 0.2);
          border-color: rgba(196, 30, 58, 0.5);
          color: #ff6b6b;
        }

        .saveEntryBtnCompact {
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid rgba(40, 167, 69, 0.4);
          background: rgba(40, 167, 69, 0.15);
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.15s;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .saveEntryBtnCompact:hover:not(:disabled) {
          background: rgba(40, 167, 69, 0.3);
          border-color: rgba(40, 167, 69, 0.6);
        }

        .saveEntryBtnCompact:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tierLabel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: rgba(255, 255, 255, 0.65);
          font-size: 13px;
          font-weight: 800;
        }

        .tierSelect,
        .tierInput {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }

        .tierSelect option {
          color: #000;
        }

        .tierEntryActions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .saveEntryBtn,
        .deleteEntryBtn {
          padding: 12px 18px;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          font-size: 14px;
        }

        .saveEntryBtn {
          background: rgba(40, 167, 69, 0.85);
        }

        .saveEntryBtn:hover {
          background: rgba(40, 167, 69, 1);
        }

        .deleteEntryBtn {
          background: rgba(196, 30, 58, 0.85);
        }

        .deleteEntryBtn:hover {
          background: rgba(196, 30, 58, 1);
        }

        .loadingState {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .adminNavbar,
        .adminHeader,
        .adminContent,
        .searchSection,
        .playerDetailsSection,
        .tierEntryCard {
          animation: none;
        }

        .navbarLink {
          position: relative;
        }

        .navbarLink::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: #c41e3a;
          transition: width 0.3s ease;
        }

        .navbarLink:hover::after {
          width: 100%;
        }

        .searchResultItem {
          animation: fadeIn 0.2s ease-out;
        }

        .searchInput:focus {
          animation: pulse 0.5s ease-out;
        }

        button:not(:disabled):active {
          transform: scale(0.98);
          transition: transform 0.1s;
        }

        .tierInputCompact:focus {
          box-shadow: 0 0 0 2px rgba(196, 30, 58, 0.2);
        }

        .retireCheckbox:hover .checkboxLabel {
          border-color: rgba(196, 30, 58, 0.4);
          background: rgba(196, 30, 58, 0.1);
        }

        .tiersSectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .toggleUntestedBtn {
          padding: 8px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggleUntestedBtn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .toggleUntestedBtn.active {
          background: rgba(79, 167, 255, 0.2);
          border-color: rgba(79, 167, 255, 0.5);
          color: #4fa7ff;
        }

        .tierEntryCard.untested {
          opacity: 0.6;
          background: rgba(255, 255, 255, 0.02);
          border-style: dashed;
        }

        .tierEntryCard.untested:hover {
          opacity: 0.8;
        }

        .tierEntryMode {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .untestedBadge {
           font-size: 10px;
          background: rgba(79, 167, 255, 0.3);
          color: #4fa7ff;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 800;
        }

        /* Toast notification */
        .toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 999;
          padding: 14px 22px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          animation: toastSlideIn 0.3s ease-out;
          box-shadow: 0 12px 40px #0000006e;
          pointer-events: none;
        }

        .toastOk {
          background: rgba(35, 165, 90, 0.92);
        }

        .toastError {
          background: rgba(214, 71, 71, 0.92);
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.92);
          }
           to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ─── Player card ─── */
        .playerDetailsCard {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pdRow {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .pdRowHead {
          gap: 20px;
        }

        .pdNameBlock {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .playerDetailsName {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
        }

        .pdUuid {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          font-family: monospace;
          letter-spacing: 0.04em;
        }

        .pdNameRefresh {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .pdNameInput {
          padding: 7px 12px;
          font-size: 13px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-family: inherit;
          outline: none;
          min-width: 200px;
          transition: border-color 0.15s;
        }

        .pdNameInput:focus {
          border-color: rgba(255,255,255,0.25);
        }

        .pdRefreshBtn {
          padding: 7px 16px;
          border-radius: 8px;
          border: none;
          background: #d64747;
          color: #fff;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }

        .pdRefreshBtn:hover {
          background: #c93f3f;
        }

        .pdActionBtns {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .pdRemoveBtn {
          padding: 8px 18px;
          border-radius: 8px;
          border: 1px solid rgba(214,71,71,0.7);
          background: rgba(214,71,71,0.15);
          color: #f3a3a3;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }

        .pdRemoveBtn:hover {
          background: rgba(214,71,71,0.28);
          border-color: rgba(214,71,71,0.95);
        }

        .pdBanBtn {
          padding: 8px 18px;
          border-radius: 8px;
          border: 1px solid rgba(214, 158, 71, 0.7);
          background: rgba(214, 158, 71, 0.15);
          color: #f0cf8f;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }

        .pdBanBtn:hover {
          background: rgba(214, 158, 71, 0.28);
          border-color: rgba(214, 158, 71, 0.95);
        }

        /* ─── Stat bubbles ─── */
        .pdBubbles {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .pdBubble {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 18px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          min-width: 100px;
        }

        .pdBubbleLabel {
          font-size: 10.5px;
          font-weight: 800;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .pdBubbleValue {
          font-size: 20px;
          font-weight: 800;
        }

        .pdStatusActive {
          color: #34d399;
        }

        .pdStatusBanned {
          color: #ff6b6b;
        }

        .pdUnbanBtn {
          margin-top: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 107, 107, 0.4);
          background: rgba(255, 107, 107, 0.12);
          color: #ff9b9b;
          font-size: 10.5px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .pdUnbanBtn:hover {
          background: rgba(255, 107, 107, 0.22);
        }

        .pdUnbanBtn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .tierBadgeInline {
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 16px;
        }

        /* ─── Gamemode circles ─── */
        .playerTiersList {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tierEntryCard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.08);
          transition: border-color 0.15s;
          width: 100%;
          box-sizing: border-box;
          position: relative;
        }

        .tierEntryCard:hover {
          border-color: rgba(255,255,255,0.16);
        }

        .tierEntryCard.retired {
          opacity: 0.55;
          border-style: dashed;
        }

        .tierModeCircle {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          margin-right: 10px;
        }

        .tierModeCircleImg {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          padding: 5px;
          object-fit: contain;
        }

        .tierModeCircleLabel {
          font-size: 10px;
          font-weight: 800;
          text-align: center;
          white-space: nowrap;
        }

        .tiersSectionHeader {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

.tiersSubtitle {
           font-size: 12px;
           color: rgba(255,255,255,0.45);
           margin: 0;
         }


         /* ─── Misc cleanups ─── */
        .playerDetailsSkin { border-radius: 50%; }
        .closeDetailsBtn { flex-shrink: 0; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ─── Kitiltás (ban) modal ─── */
        .banModalContent {
          width: 100%;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .htLabel {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.65);
        }

        .htSelect,
        .htInput {
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 600;
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 9px;
          padding: 10px 12px;
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease;
        }

        .htSelect:focus,
        .htInput:focus {
          border-color: rgba(143, 124, 255, 0.6);
          background: rgba(143, 124, 255, 0.08);
        }

        .htTextarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .banCustomDurationGrid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }

        .banCustomField {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
        }

        .banCustomField input {
          width: 100%;
          box-sizing: border-box;
          text-align: center;
        }

        .htqWarn {
          display: block;
          font-size: 12.5px;
          font-weight: 700;
          color: #f0cf8f;
          background: rgba(214, 158, 71, 0.14);
          border: 1px solid rgba(214, 158, 71, 0.4);
          border-radius: 9px;
          padding: 8px 12px;
        }

        .banUploadDrop {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 90px;
          border-radius: 10px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.04);
          overflow: hidden;
        }

        .banUploadDrop input[type="file"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .banUploadHint {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.4);
          pointer-events: none;
        }

        .banUploadPreview {
          max-width: 100%;
          max-height: 160px;
          border-radius: 8px;
          object-fit: contain;
          pointer-events: none;
        }

        .htDiscordBubble {
          background: #2b2d31;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12.5px;
          color: #dcddde;
          line-height: 1.5;
        }

        .htDiscordLine {
          margin-bottom: 4px;
        }

        .htDiscordQuote {
          border-left: 3px solid rgba(255, 255, 255, 0.2);
          padding-left: 8px;
          margin: 4px 0;
          color: #b9bbbe;
        }

        /* ═══════════════════════════════════════════════
           MOBILE — admin panel responsive overrides
           ═══════════════════════════════════════════════ */
        @media (max-width: 720px) {
          .adminDashboard {
            overflow-x: hidden;
            width: 100%;
          }

          .adminContent {
            padding: 14px 12px 40px;
            max-width: 100%;
          }

          .adminHeader {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
          }

          .headerStats {
            width: 100%;
            justify-content: space-between;
            gap: 10px;
          }

          .headerStat {
            flex: 1;
          }

          .searchSection {
            width: 100%;
          }

          .staffSplitSection {
            gap: 14px;
          }

          .staffCardHalf {
            padding: 14px 14px;
            border-radius: 14px;
          }

          .staffCardItemTop {
            flex-wrap: wrap;
          }

          .staffCardActions {
            width: 100%;
            justify-content: flex-start;
          }

          .staffLabelBtn {
            flex: 1 1 auto;
          }

          .pdRowHead {
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }

          .playerDetailsSkin {
            width: 72px;
            height: 72px;
          }

          .pdBubbles {
            flex-direction: column;
          }

          .pdBubble {
            width: 100%;
          }

          .pdActionBtns {
            width: 100%;
          }

          .pdRemoveBtn,
          .pdBanBtn {
            flex: 1;
          }

          .pdNameRefresh {
            flex-direction: column;
            align-items: stretch;
          }

          .tiersSectionHeader {
            flex-direction: column;
            align-items: flex-start;
          }

          .tierEntryCard {
            flex-wrap: wrap;
            justify-content: flex-start;
          }

          .tierModeCircle {
            flex: 1 1 100%;
          }

          .tierEntryControls {
            flex: 1 1 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .adminModeControls {
            width: 100%;
            flex-wrap: wrap;
          }

          .adminRankPicker {
            flex: 1 1 auto;
            min-width: 0;
          }

          .adminRankButton {
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }

          .adminSaveButton {
            flex: 0 0 auto;
          }

          .adminRankMenu {
            width: min(250px, calc(100vw - 48px));
            right: auto;
            left: 0;
          }

          .playerDetailStat {
            grid-template-columns: 1fr;
          }

          .tierEntryActions {
            grid-template-columns: 1fr;
          }

          .modalContent {
            width: calc(100% - 24px);
            max-width: calc(100% - 24px);
            margin: 0 12px;
            max-height: 85vh;
            overflow-y: auto;
          }

          .banModalContent {
            max-width: 100%;
          }

          .banCustomDurationGrid {
            grid-template-columns: repeat(3, 1fr);
          }

          .modalActions {
            flex-direction: column-reverse;
          }

          .modalBtn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

