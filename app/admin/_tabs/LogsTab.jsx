"use client";

import React, { useEffect, useState } from "react";
import "../admin-theme.css";
import { actionLabelFor, actionMetaFor } from "../_lib/auditActions";

const TIER_TO_POINTS = {
  LT5: 1, HT5: 2, LT4: 3, HT4: 4,
  LT3: 6, HT3: 10, LT2: 16, HT2: 22,
  LT1: 40, HT1: 60,
};

function getPointsForElo(rank) {
  if (typeof rank !== "string") return 0;
  return TIER_TO_POINTS[rank.trim().toUpperCase()] || 0;
}

const KNOWN_TIERS = ["LT5","HT5","LT4","HT4","LT3","HT3","LT2","HT2","LT1","HT1"];

// The database stores rank as a raw ELO number (e.g. 1750). This converts
// either that or a legacy tier string into a clean tier label ("HT3") so the
// logs never show bare numbers or fail to color-code by tier.
function eloToTierLabel(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value).trim().toUpperCase();
}

// Renders a short, human-readable summary line for an audit log's `details`
// object. Never dumps raw JSON — anything not explicitly understood is
// simply omitted rather than shown as a technical blob.
function detailsSummaryFor(log) {
  const d = log.details;
  if (!d) return null;

  if (log.action === "admin_login_password_step") {
    return d.hasPasskey ? "Van már beállított passkey" : "Még nincs beállítva passkey";
  }
  if (log.action === "high_score_save" || log.action === "admin_login_bot_notif") {
    const parts = [];
    if (d.category) parts.push(d.category === "legacy" ? "Legacy" : "Modern");
    if (d.rank) parts.push(`Tesztelt tier: ${eloToTierLabel(d.rank)}`);
    if (typeof d.modes === "number") parts.push(`${d.modes} mód`);
    return parts.length > 0 ? parts.join(" · ") : null;
  }
  if (typeof d === "string") return d;
  return null;
}

// Logs tab — rendered inside AdminShell only when the logged-in admin is
// an owner (role check + auth check already happened in the shell).
export default function LogsTab({ onViewStaff }) {
  const [loading, setLoading] = useState(true);
  const [logType, setLogType] = useState("all"); // "all", "audit", "tests"
  const [tests, setTests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filterUsername, setFilterUsername] = useState("");
  const [filterGamemode, setFilterGamemode] = useState("");
  const [filterAdmin, setFilterAdmin] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      await loadAllLogs();
      setLoading(false);
    })();
  }, []);

  const loadAllLogs = async () => {
    try {
      const [testsRes, auditRes] = await Promise.all([
        fetch("/api/tests"),
        fetch("/api/audit-log"),
      ]);

      const testsData = await testsRes.json();
      const auditData = await auditRes.json();

      const allTests = Array.isArray(testsData?.tests) ? testsData.tests : [];
      setTests(allTests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));

      const allAudit = Array.isArray(auditData?.logs) ? auditData.logs : [];
      setAuditLogs(allAudit.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error("Log loading error:", err);
    }
  };

  const filteredTests = tests.filter((t) => {
    const matchUsername = !filterUsername || t.username.toLowerCase().includes(filterUsername.toLowerCase());
    const matchGamemode = !filterGamemode || t.gamemode.toLowerCase().includes(filterGamemode.toLowerCase());
    return matchUsername && matchGamemode;
  });

  const filteredAudit = auditLogs.filter((log) => {
    const matchUsername = !filterUsername || log.target_username?.toLowerCase().includes(filterUsername.toLowerCase());
    const matchAdmin = !filterAdmin || log.admin_name?.toLowerCase().includes(filterAdmin.toLowerCase());
    return matchUsername && matchAdmin;
  });

  const showToast = (type, text) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleRestoreLog = async (log) => {
    if (!log) return;
    try {
      if (log.action === "tier_save" && log.target_username && log.gamemode && log.old_rank != null) {
        const payload = {
          username: log.target_username,
          gamemode: log.gamemode,
          rank: log.old_rank,
          points: log.old_points != null ? log.old_points : getPointsForElo(log.old_rank),
        };
        const res = await fetch("/api/tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast("error", data.error || "Visszaállítás sikertelen");
          return;
        }
        showToast("ok", "Tier visszaállítva");
      } else if (log.action === "player_rename" && log.details?.old_name && log.details?.new_name) {
        const res = await fetch("/api/tests/rename", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldName: log.details.new_name, newName: log.details.old_name }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast("error", data.error || "Név visszaállítás sikertelen");
          return;
        }
        showToast("ok", "Név visszaállítva");
      } else {
        showToast("error", "Ez a bejegyzés nem visszaállítható");
        return;
      }
      await loadAllLogs();
    } catch (error) {
      console.error("Restore failed", error);
      showToast("error", "Hiba történt a visszaállítás során");
    }
  };

  const logTypeOptions = [
    { value: "all", label: `Összes (${tests.length + auditLogs.length})` },
    { value: "tests", label: `Tesztek (${tests.length})` },
    { value: "audit", label: `Admin akciók (${auditLogs.length})` },
  ];

  if (loading) {
    return (
      <div className="lgLoadingBlock admin-panel">
        <div className="lgSpinner" />
        <style jsx>{`
          .lgLoadingBlock {
            min-height: 200px;
            display: grid;
            place-items: center;
          }
          .lgSpinner {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid rgba(255, 255, 255, 0.15);
            border-top-color: #8f7cff;
            animation: lgSpin 0.8s linear infinite;
          }
          @keyframes lgSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="lgPage admin-panel">
      <section className="lgContent">
        <header className="lgPageHeader">
          <div>
            <h1>Logok</h1>
            <p>Minden teszt eredmény és admin tevékenység egy helyen, kereshetően.</p>
          </div>
          <div className="lgHeaderStats">
            <div className="lgHeaderStat">
              <span className="lgHeaderStatValue">{filteredTests.length}</span>
              <span className="lgHeaderStatLabel">Teszt</span>
            </div>
            <div className="lgHeaderStat">
              <span className="lgHeaderStatValue">{filteredAudit.length}</span>
              <span className="lgHeaderStatLabel">Admin akció</span>
            </div>
          </div>
        </header>

        <section className="lgCard lgFilterCard">
          <div className="lgTabs">
            {logTypeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`lgTab ${logType === opt.value ? "active" : ""}`}
                onClick={() => setLogType(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="lgFilterGrid">
            <div className="lgField">
              <label className="lgLabel">Játékos</label>
              <input
                type="text"
                className="lgInput"
                placeholder="Játékos neve..."
                value={filterUsername}
                onChange={(e) => setFilterUsername(e.target.value)}
              />
            </div>
            {(logType === "all" || logType === "tests") && (
              <div className="lgField">
                <label className="lgLabel">Játékmód</label>
                <input
                  type="text"
                  className="lgInput"
                  placeholder="Játékmód..."
                  value={filterGamemode}
                  onChange={(e) => setFilterGamemode(e.target.value)}
                />
              </div>
            )}
            {(logType === "all" || logType === "audit") && (
              <div className="lgField">
                <label className="lgLabel">Regulator</label>
                <input
                  type="text"
                  className="lgInput"
                  placeholder="Regulator neve..."
                  value={filterAdmin}
                  onChange={(e) => setFilterAdmin(e.target.value)}
                />
              </div>
            )}
          </div>
        </section>

        {(logType === "all" || logType === "tests") && (
          <section className="lgCard">
            <h2 className="lgCardTitle">Teszt eredmények</h2>

            {filteredTests.length === 0 ? (
              <div className="lgEmpty">
                <span className="lgEmptyTitle">Nincs teszt adat</span>
                <span className="lgEmptySub">Nem található a szűrésnek megfelelő teszt.</span>
              </div>
            ) : (
              <div className="lgTestTable">
                <div className="lgTestRow lgTestHead">
                  <span>Dátum</span>
                  <span>Játékos</span>
                  <span>Játékmód</span>
                  <span>Tier</span>
                  <span>Pont</span>
                </div>
                {filteredTests.map((test, idx) => (
                  <div key={`${test.username}-${test.gamemode}-${idx}`} className="lgTestRow">
                    <span className="lgTestDate">
                      {new Date(test.created_at).toLocaleString("hu-HU", {
                        year: "numeric", month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <span className="lgTestPlayer">
                      <img
                        src={
                          test.uuid
                            ? `https://mc-heads.net/avatar/${test.uuid.replace(/-/g, "")}/28`
                            : `https://mc-heads.net/avatar/${encodeURIComponent(test.username)}/28`
                        }
                        alt=""
                        className="lgTestAvatar"
                      />
                      <span>{test.username}</span>
                    </span>
                    <span className="lgTestMode">{test.gamemode}</span>
                    <span>
                      <span className="lgRankBadge" data-rank={eloToTierLabel(test.rank)}>
                        {test.retired ? `R${eloToTierLabel(test.rank)}` : eloToTierLabel(test.rank)}
                      </span>
                    </span>
                    <span className="lgTestPoints">{test.points}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {(logType === "all" || logType === "audit") && (
          <section className="lgCard">
            <h2 className="lgCardTitle">Admin tevékenységek</h2>

            {filteredAudit.length === 0 ? (
              <div className="lgEmpty">
                <span className="lgEmptyTitle">Nincs audit adat</span>
                <span className="lgEmptySub">Nincs admin tevékenység naplózva.</span>
              </div>
            ) : (
              <div className="lgAuditList">
                {filteredAudit.map((log, idx) => {
                  const actionLabel = actionLabelFor(log.action);
                  const actionMeta = actionMetaFor(log.action);
                  const detailsSummary = detailsSummaryFor(log);
                  const canRestore =
                    log.action === "tier_save" && log.target_username && log.gamemode && log.old_rank != null;
                  const canRestoreRename =
                    log.action === "player_rename" && log.details?.old_name && log.details?.new_name;

                  return (
                    <div key={`${log.admin_name}-${log.created_at}-${idx}`} className="lgAuditCard">
                      <span className="lgAuditIcon" style={{ "--badge-color": actionMeta.color }}>
                        {actionMeta.icon}
                      </span>

                      <div className="lgAuditBody">
                        <div className="lgAuditTopRow">
                          <span className="lgAuditAction" style={{ "--badge-color": actionMeta.color }}>
                            {actionLabel}
                          </span>
                          <span
                            className="lgAuditAdmin"
                            role="button"
                            tabIndex={0}
                            onClick={() => onViewStaff?.(log.admin_name)}
                            title="Regulátor profil megnyitása"
                          >
                            {log.admin_name}
                          </span>
                          <span className="lgAuditDate">
                            {new Date(log.created_at).toLocaleString("hu-HU", {
                              year: "numeric", month: "2-digit", day: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {(log.target_username || log.gamemode) && (
                          <div className="lgAuditMetaRow">
                            {log.target_username && <span className="lgAuditChip">👤 {log.target_username}</span>}
                            {log.gamemode && <span className="lgAuditChip">🎮 {log.gamemode}</span>}
                          </div>
                        )}

                        {log.action === "player_rename" && log.details?.old_name && log.details?.new_name && (
                          <div className="lgAuditChange">
                            <span className="lgAuditPill">{log.details.old_name}</span>
                            <span className="lgAuditArrow">→</span>
                            <span className="lgAuditPill new">{log.details.new_name}</span>
                          </div>
                        )}

                        {log.old_rank !== null && log.old_rank !== undefined && log.action !== "player_rename" && (
                          <div className="lgAuditChange">
                            <span className="lgAuditPill">{eloToTierLabel(log.old_rank)}</span>
                            <span className="lgAuditArrow">→</span>
                            <span className="lgAuditPill new">{eloToTierLabel(log.new_rank)}</span>
                          </div>
                        )}

                        {log.details?.fight_notes && Object.keys(log.details.fight_notes).length > 0 && (
                          <div className="lgAuditFightNotes">
                            {Object.entries(log.details.fight_notes)
                              .filter(([, v]) => v?.trim?.())
                              .map(([k, v]) => (
                                <div key={k}>
                                  {k}: {v?.substring(0, 40)}
                                  {v?.length > 40 ? "…" : ""}
                                </div>
                              ))}
                          </div>
                        )}

                        {log.details && typeof log.details === "string" && (
                          <div className="lgAuditSummary">{log.details}</div>
                        )}
                        {detailsSummary && <div className="lgAuditSummary">{detailsSummary}</div>}
                      </div>

                      {(canRestore || canRestoreRename) && (
                        <button type="button" className="lgRestoreBtn" onClick={() => handleRestoreLog(log)}>
                          ↺ Visszaállítás
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </section>

      {toast && <div className={`lgToast ${toast.type === "error" ? "lgToastError" : "lgToastOk"}`}>{toast.text}</div>}

      <style jsx global>{`
        .lgSpinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-top-color: #8f7cff;
          animation: lgspin 0.8s linear infinite;
        }
        @keyframes lgspin {
          to { transform: rotate(360deg); }
        }
        .lgPage {
          color: inherit;
        }
        .lgContent {
          display: grid;
          gap: 22px;
        }
        .lgPageHeader {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .lgPageHeader h1 {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 800;
        }
        .lgPageHeader p {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }
        .lgHeaderStats {
          display: flex;
          gap: 10px;
        }
        .lgHeaderStat {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 18px;
          border-radius: 14px;
          background: rgba(143, 124, 255, 0.1);
          border: 1px solid rgba(143, 124, 255, 0.28);
          min-width: 74px;
        }
        .lgHeaderStatValue {
          font-size: 18px;
          font-weight: 900;
          color: #d7d0ff;
        }
        .lgHeaderStatLabel {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.5);
        }
        .lgCard {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px 26px;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 10px 30px rgba(0, 0, 0, 0.25);
        }
        .lgCardTitle {
          margin: 0 0 16px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.85);
        }
        .lgTabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }
        .lgTab {
          padding: 9px 16px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.65);
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .lgTab:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }
        .lgTab.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(143, 124, 255, 0.32), rgba(214, 71, 71, 0.16));
          border-color: #8f7cff;
          box-shadow: 0 0 0 1px rgba(143, 124, 255, 0.3), 0 6px 18px rgba(143, 124, 255, 0.25);
        }
        .lgFilterGrid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .lgField {
          display: grid;
          gap: 8px;
        }
        .lgLabel {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.55);
        }
        .lgInput {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          padding: 11px 14px;
          font-size: 14px;
          font-family: inherit;
        }
        .lgInput:focus {
          outline: none;
          border-color: #8f7cff;
        }
        .lgEmpty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 40px 20px;
          text-align: center;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.12);
        }
        .lgEmptyTitle {
          font-size: 14px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.75);
        }
        .lgEmptySub {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.45);
        }

        /* Test table */
        .lgTestTable {
          display: grid;
          gap: 6px;
          overflow-x: auto;
        }
        .lgTestRow {
          display: grid;
          grid-template-columns: 150px 1fr 130px 90px 70px;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 12px;
          font-size: 13px;
          min-width: 640px;
        }
        .lgTestHead {
          color: rgba(255, 255, 255, 0.45);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-top: 0;
          padding-bottom: 8px;
        }
        .lgTestRow:not(.lgTestHead) {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .lgTestRow:not(.lgTestHead):hover {
          background: rgba(255, 255, 255, 0.045);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .lgTestDate {
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
          font-variant-numeric: tabular-nums;
        }
        .lgTestPlayer {
          display: flex;
          align-items: center;
          gap: 9px;
          font-weight: 800;
          color: #fff;
          min-width: 0;
        }
        .lgTestPlayer span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .lgTestAvatar {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          image-rendering: pixelated;
          flex: 0 0 auto;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .lgTestMode {
          color: rgba(255, 255, 255, 0.75);
        }
        .lgRankBadge {
          display: inline-block;
          padding: 3px 9px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 900;
          background: rgba(143, 124, 255, 0.16);
          border: 1px solid rgba(143, 124, 255, 0.4);
          color: #d7d0ff;
        }
        .lgTestPoints {
          font-weight: 800;
          color: rgba(255, 255, 255, 0.8);
        }

        /* Audit list */
        .lgAuditList {
          display: grid;
          gap: 10px;
        }
        .lgAuditCard {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .lgAuditCard:hover {
          border-color: rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.04);
        }
        .lgAuditIcon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          font-size: 15px;
          flex: 0 0 auto;
          background: color-mix(in srgb, var(--badge-color, #94a3b8) 16%, transparent);
          border: 1px solid color-mix(in srgb, var(--badge-color, #94a3b8) 40%, transparent);
        }
        .lgAuditBody {
          flex: 1;
          min-width: 0;
          display: grid;
          gap: 8px;
        }
        .lgAuditTopRow {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .lgAuditAction {
          font-size: 12.5px;
          font-weight: 900;
          color: var(--badge-color, #94a3b8);
        }
        .lgAuditAdmin {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.55);
          cursor: pointer;
        }
        .lgAuditAdmin:hover {
          color: #d7d0ff;
          text-decoration: underline;
        }
        .lgAuditAdmin::before {
          content: "· ";
          color: rgba(255, 255, 255, 0.3);
        }
        .lgAuditDate {
          margin-left: auto;
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.4);
          font-variant-numeric: tabular-nums;
        }
        .lgAuditMetaRow {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .lgAuditChip {
          font-size: 11.5px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
        }
        .lgAuditChange {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .lgAuditPill {
          padding: 3px 9px;
          border-radius: 8px;
          background: rgba(214, 71, 71, 0.14);
          border: 1px solid rgba(214, 71, 71, 0.35);
          color: #ffb4b4;
          font-weight: 800;
        }
        .lgAuditPill.new {
          background: rgba(52, 211, 153, 0.14);
          border-color: rgba(52, 211, 153, 0.35);
          color: #b8f5dd;
        }
        .lgAuditArrow {
          color: rgba(255, 255, 255, 0.35);
        }
        .lgAuditFightNotes {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.5;
        }
        .lgAuditSummary {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
        }
        .lgRestoreBtn {
          flex: 0 0 auto;
          align-self: center;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid rgba(143, 124, 255, 0.4);
          background: rgba(143, 124, 255, 0.1);
          color: #d7d0ff;
          font-size: 11.5px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }
        .lgRestoreBtn:hover {
          background: rgba(143, 124, 255, 0.2);
        }

        .lgToast {
          position: fixed;
          bottom: 22px;
          right: 22px;
          padding: 14px 18px;
          border-radius: 14px;
          font-weight: 800;
          z-index: 999;
          max-width: 320px;
        }
        .lgToastOk {
          background: rgba(52, 211, 153, 0.95);
          color: #04241a;
        }
        .lgToastError {
          background: rgba(214, 71, 71, 0.95);
          color: #fff;
        }

        @media (max-width: 720px) {
          .lgFilterGrid {
            grid-template-columns: 1fr;
          }
          .lgTestRow {
            grid-template-columns: 130px 1fr 110px 80px 60px;
          }
        }
      `}</style>
    </div>
  );
}
