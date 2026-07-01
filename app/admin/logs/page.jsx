"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const RANK_POINT_RANGES = [
  { min: 0, max: 499, points: 0 },
  { min: 500, max: 749, points: 1 },
  { min: 750, max: 999, points: 2 },
  { min: 1000, max: 1249, points: 3 },
  { min: 1250, max: 1499, points: 4 },
  { min: 1500, max: 1749, points: 6 },
  { min: 1750, max: 1999, points: 10 },
  { min: 2000, max: 2249, points: 16 },
  { min: 2250, max: 2499, points: 22 },
  { min: 2500, max: 2749, points: 28 },
  { min: 2750, max: Infinity, points: 34 },
];

function getPointsForElo(elo) {
  const value = Number(elo);
  if (!Number.isFinite(value) || value < 0) return 0;
  const range = RANK_POINT_RANGES.find((item) => value >= item.min && value <= item.max);
  return range ? range.points : 0;
}

export default function AdminLogsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [logType, setLogType] = useState("all"); // "all", "audit", "tests"
  const [tests, setTests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filterUsername, setFilterUsername] = useState("");
  const [filterGamemode, setFilterGamemode] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      if (String(data.role || "").toLowerCase() !== "owner") {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      await loadAllLogs();
      setLoading(false);
    };
    checkAuth();
  }, [router]);

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

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  const filteredTests = tests.filter((t) => {
    const matchUsername = !filterUsername || t.username.toLowerCase().includes(filterUsername.toLowerCase());
    const matchGamemode = !filterGamemode || t.gamemode.toLowerCase().includes(filterGamemode.toLowerCase());
    return matchUsername && matchGamemode;
  });

  const filteredAudit = auditLogs.filter((log) => {
    if (log.action === "high_score_save") return false;
    const matchUsername = !filterUsername || log.target_username?.toLowerCase().includes(filterUsername.toLowerCase());
    return matchUsername;
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
          elo: log.old_rank,
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

  if (loading) {
    return (
      <div className="logsPage">
        <div className="loadingState">Betöltés...</div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="logsPage">
        <header className="adminNavbar">
          <div className="navbarLeft">
            <h1 className="navbarTitle">NeonTiers Admin Panel</h1>
          </div>
          <div className="unauthorizedNotice">
            <h2>Hozzáférés megtagadva</h2>
            <p>Csak Owner jogosultsággal érhető el ez az oldal.</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="logsPage">
      <header className="adminNavbar">
        <div className="navbarLeft">
          <h1 className="navbarTitle">NeonTiers Admin Panel</h1>
        </div>
        <nav className="navbarLinks">
          <a href="/" className="navbarLink">Publikus</a>
          <a href="/admin/dashboard" className="navbarLink">Játékos kezelő</a>
          <a href="/admin/surveys" className="navbarLink">Felmérések</a>
          <a href="/admin/logs" className="navbarLink active">Logok</a>
        </nav>
        <button className="logoutBtn" onClick={handleLogout}>
          Kijelentkezés
        </button>
      </header>

      <header className="logsHeader">
        <div className="headerLeft">
          <h2 className="headerTitle">Összes teszt napló</h2>
          <p className="headerSubtitle">Összes teszt eredmény dátummal, tierrel és játékmóddal</p>
        </div>
        <div className="headerStat">
          <span className="headerStatValue">{filteredTests.length}</span>
          <span className="headerStatLabel">Teszt</span>
        </div>
      </header>

      <main className="logsContent">
        <div className="logTypeTabs">
          <button
            className={`logTypeTab ${logType === "all" ? "active" : ""}`}
            onClick={() => setLogType("all")}
          >
            Összes ({tests.length + auditLogs.length})
          </button>
          <button
            className={`logTypeTab ${logType === "tests" ? "active" : ""}`}
            onClick={() => setLogType("tests")}
          >
            Tesztek ({tests.length})
          </button>
          <button
            className={`logTypeTab ${logType === "audit" ? "active" : ""}`}
            onClick={() => setLogType("audit")}
          >
            Admin akciók ({auditLogs.length})
          </button>
        </div>

        <div className="filtersSection">
          <div className="filterGroup">
            <label className="filterLabel">Játékos:</label>
            <input
              type="text"
              className="filterInput"
              placeholder="Játékos neve..."
              value={filterUsername}
              onChange={(e) => setFilterUsername(e.target.value)}
            />
          </div>
          {(logType === "all" || logType === "tests") && (
            <div className="filterGroup">
              <label className="filterLabel">Játékmód:</label>
              <input
                type="text"
                className="filterInput"
                placeholder="Játékmód..."
                value={filterGamemode}
                onChange={(e) => setFilterGamemode(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Test Results Table */}
        {(logType === "all" || logType === "tests") && (
          <div className="logsTable">
            <div className="tableHead">
              <div className="tableCell colDate">Dátum</div>
              <div className="tableCell colPlayer">Játékos</div>
              <div className="tableCell colMode">Játékmód</div>
              <div className="tableCell colRank">Tier</div>
              <div className="tableCell colPoints">Pont</div>
            </div>

            {filteredTests.length === 0 ? (
              <div className="emptyState">
                <div className="emptyTitle">Nincs teszt adat</div>
                <div className="emptySub">Nem található a szűrésnek megfelelő teszt.</div>
              </div>
            ) : (
              filteredTests.map((test, idx) => (
                <div key={`${test.username}-${test.gamemode}-${idx}`} className="tableRow">
                  <div className="tableCell colDate">
                    {new Date(test.created_at).toLocaleString("hu-HU", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                  <div className="tableCell colPlayer">
                    <div className="playerCell">
                    <img
                      src={
                       test.uuid
                         ? `https://mc-heads.net/avatar/${test.uuid.replace(/-/g, "")}/32`
                         : `https://mc-heads.net/avatar/${encodeURIComponent(test.username)}/32`
                     }
                      alt={test.username}
                      className="playerAvatar"
                    />
                    <span>{test.username}</span>
                  </div>
                </div>
                <div className="tableCell colMode">{test.gamemode}</div>
<div className="tableCell colRank">
                   <span className="rankBadge" data-rank={test.elo} data-retired={test.retired ? "true" : "false"}>
                      {test.retired ? `R${test.elo}` : test.elo}
                   </span>
                 </div>
                <div className="tableCell colPoints">{test.points}</div>
              </div>
            ))
          )}
        </div>
        )}

        {/* Audit Log Table */}
        {(logType === "all" || logType === "audit") && (
          <div className="logsTable auditTable">
            <div className="tableHead">
              <div className="tableCell colDate">Dátum</div>
              <div className="tableCell colAdmin">Admin</div>
              <div className="tableCell colAction">Akció</div>
              <div className="tableCell colPlayer">Cél játékos</div>
              <div className="tableCell colMode">Mód</div>
              <div className="tableCell colDetails">Részletek</div>
            </div>

            {filteredAudit.length === 0 ? (
              <div className="emptyState">
                <div className="emptyTitle">Nincs audit adat</div>
                <div className="emptySub">Nincs admin tevékenység naplózva.</div>
              </div>
            ) : (
              filteredAudit.map((log, idx) => {
                const actionLabel =
                  log.action === "tier_save" ? "Mentés" :
                  log.action === "tier_delete" ? "Törlés" :
                  log.action === "player_remove" ? "Játékos eltávolítás" :
                  log.action === "player_add" ? "Játékos hozzáadása" :
                  log.action === "admin_login" ? "Bejelentkezés" :
                  log.action === "high_score_save" ? "Magas eredmény" :
                  log.action === "player_rename" ? "Név változtatás" :
                  log.action;
                const canRestore = log.action === "tier_save" && log.target_username && log.gamemode && (log.old_rank !== null || log.old_rank !== undefined);
                const canRestoreRename = log.action === "player_rename" && log.details?.old_name && log.details?.new_name;

                return (
                  <div key={`${log.admin_name}-${log.created_at}-${idx}`} className="auditCard">
                    <div className="auditCardHeader">
                      <div>
                        <div className="auditCardDate">
                          {new Date(log.created_at).toLocaleString("hu-HU", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                        <div className="auditCardMeta">
                          <strong>{log.admin_name}</strong> · {actionLabel}
                        </div>
                      </div>
                      {(canRestore || canRestoreRename) && (
                        <button
                          className="restoreBtn"
                          onClick={() => handleRestoreLog(log)}
                        >
                          Visszaállítás
                        </button>
                      )}
                    </div>
                    <div className="auditCardBody">
                      <div>
                        <div className="auditField"><strong>Játékos:</strong> {log.target_username || "-"}</div>
                        <div className="auditField"><strong>Mód:</strong> {log.gamemode || "-"}</div>
                      </div>
                      <div className="auditDetails">
                        {log.action === "player_rename" && log.details?.old_name && log.details?.new_name && (
                          <div>{log.details.old_name} → {log.details.new_name}</div>
                        )}
                        {log.old_rank !== null && log.old_rank !== undefined && log.action !== "player_rename" && (
                          <div>{log.old_rank} → {log.new_rank}</div>
                        )}
                        {log.details?.fight_notes && Object.keys(log.details.fight_notes).length > 0 && (
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                            {Object.entries(log.details.fight_notes).filter(([_, v]) => v?.trim()).map(([k, v]) => (
                              <div key={k}>{k}: {v?.substring(0, 30)}{v?.length > 30 ? "..." : ""}</div>
                            ))}
                          </div>
                        )}
                        {log.details && typeof log.details === "string" && (
                          <div>{log.details}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.text}
        </div>
      )}

      <style jsx>{`
        .logsPage {
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

        .logoutBtn {
          padding: 10px 20px;
          background: rgba(196, 30, 58, 0.85);
          border: 1px solid rgba(196, 30, 58, 0.5);
          border-radius: 10px;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.18s ease, transform 0.18s ease;
        }

        .logoutBtn:hover {
          background: rgba(196, 30, 58, 1);
          transform: translateY(-1px);
        }

        .logsHeader {
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

        .headerTitle {
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 4px 0;
        }

        .headerSubtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .headerStat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .headerStatValue {
          font-size: 28px;
          font-weight: 800;
        }

        .headerStatLabel {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 800;
        }

        .logsContent {
          max-width: 1480px;
          margin: 0 auto;
          padding: 30px 20px;
        }

        .filtersSection {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .filterGroup {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filterLabel {
          font-size: 12px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filterInput {
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
          transition: all 0.15s;
        }

        .filterInput:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .filterInput::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .logsTable {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
        }

        .tableHead {
          display: grid;
          grid-template-columns: 200px 1fr 150px 100px 80px;
          gap: 16px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.04);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.7);
        }

        .tableRow {
          display: grid;
          grid-template-columns: 200px 1fr 150px 100px 80px;
          gap: 16px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          align-items: center;
          transition: background 0.15s;
        }

        .tableRow:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .colDate {
          font-size: 13px;
        }

        .colPlayer {
          font-size: 14px;
        }

        .colMode {
          font-size: 13px;
        }

        .colRank {
          font-size: 13px;
        }

        .colPoints {
          text-align: right;
          font-size: 14px;
          font-weight: 800;
        }

        .playerCell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .playerAvatar {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
        }

        .rankBadge {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(213, 179, 85, 0.2);
          border-radius: 4px;
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

.rankBadge[data-rank="2750"],
        .rankBadge[data-rank="2500"] {
          background: rgba(213, 179, 85, 0.25);
          color: #d5b355;
        }

        .rankBadge[data-rank="2250"],
        .rankBadge[data-rank="2000"] {
          background: rgba(136, 136, 149, 0.25);
          color: #888d95;
        }

        .rankBadge[data-rank="1750"],
        .rankBadge[data-rank="1500"] {
          background: rgba(221, 136, 73, 0.25);
          color: #dd8849;
        }

        .rankBadge[data-rank="1250"],
        .rankBadge[data-rank="1000"] {
          background: rgba(183, 170, 223, 0.25);
          color: #b7aadf;
        }

        .rankBadge[data-rank="750"],
        .rankBadge[data-rank="500"] {
          background: rgba(111, 99, 137, 0.25);
          color: #6f6389;
        }

        /* Retired rank styling */
        .rankBadge[data-retired="true"] {
          background: rgba(143, 124, 255, 0.25);
          color: #8f7cff;
        }

         .logTypeTabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .logTypeTab {
          padding: 12px 16px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-weight: 800;
          font-size: 14px;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
          position: relative;
          bottom: -1px;
        }

        .logTypeTab:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .logTypeTab.active {
          color: #fff;
          border-bottom-color: #c41e3a;
        }

        .auditTable {
          margin-top: 24px;
        }

        .auditRow {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .colAdmin {
          flex: 0 0 80px;
        }

        .colAction {
          flex: 0 0 140px;
        }

        .colDetails {
          flex: 1;
          min-width: 200px;
        }

        .actionBadge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 800;
        }

        .actionBadge.tier_save {
          background: rgba(40, 167, 69, 0.2);
          color: #28a745;
        }

        .actionBadge.tier_delete {
          background: rgba(196, 30, 58, 0.2);
          color: #ff6b6b;
        }

        .actionBadge.player_remove {
          background: rgba(196, 30, 58, 0.2);
          color: #ff6b6b;
        }

.actionBadge.admin_login {
          background: rgba(58, 100, 196, 0.2);
          color: #3a64c4;
        }

        .actionBadge.player_rename {
          background: rgba(79, 167, 255, 0.2);
          color: #4fa7ff;
        }

        .actionBadge.player_add {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
        }

        .auditCard {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 18px 20px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .auditCardHeader {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .auditCardDate {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 4px;
        }

        .auditCardMeta {
          font-size: 14px;
          color: #fff;
        }

        .auditCardBody {
          display: grid;
          gap: 10px;
          grid-template-columns: minmax(220px, 1fr) 1fr;
        }

        .auditField {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          line-height: 1.5;
        }

        .auditDetails {
          color: rgba(255, 255, 255, 0.75);
          font-size: 13px;
          line-height: 1.6;
          display: grid;
          gap: 6px;
        }

        .restoreBtn {
          padding: 10px 16px;
          background: rgba(74, 222, 128, 0.12);
          border: 1px solid rgba(74, 222, 128, 0.3);
          border-radius: 12px;
          color: #d4f8dc;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .restoreBtn:hover {
          background: rgba(74, 222, 128, 0.2);
          border-color: rgba(74, 222, 128, 0.55);
        }

        .unauthorizedNotice {
          padding: 50px;
          text-align: center;
          width: 100%;
          color: #fff;
        }

        .unauthorizedNotice h2 {
          margin: 0 0 10px;
          font-size: 24px;
          font-weight: 800;
        }

        .unauthorizedNotice p {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 15px;
        }

        .toast {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: 24px;
          padding: 14px 18px;
          border-radius: 14px;
          font-weight: 700;
          z-index: 2000;
          box-shadow: 0 24px 60px rgba(0,0,0,0.3);
        }

        .toast.ok {
          background: rgba(34, 197, 94, 0.18);
          border: 1px solid rgba(74, 222, 128, 0.4);
          color: #fff;
        }

        .toast.error {
          background: rgba(220, 38, 38, 0.16);
          border: 1px solid rgba(248, 113, 113, 0.35);
          color: #fff;
        }

        .emptyState {
          padding: 40px;
          text-align: center;
        }

        .emptyTitle {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 8px;
        }

        .emptySub {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .loadingState {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        @media (max-width: 768px) {
          .tableHead,
          .tableRow {
            grid-template-columns: 1fr;
          }

          .tableHead {
            display: none;
          }

        .tableRow {
          display: flex;
          gap: 0;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          align-items: center;
          transition: background 0.15s;
        }

        .tableRow:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .colDate {
          flex: 0 0 130px;
          font-size: 13px;
        }

        .colPlayer {
          flex: 1;
          min-width: 120px;
          font-size: 14px;
        }

        .colMode {
          flex: 0 0 110px;
          font-size: 13px;
        }

          .tableCell::before {
            display: block;
            font-weight: 800;
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .colDate::before {
            content: "Dátum";
          }
          .colPlayer::before {
            content: "Játékos";
          }
          .colMode::before {
            content: "Játékmód";
          }
          .colRank::before {
            content: "Tier";
          }
          .colPoints::before {
            content: "Pont";
          }
        }
      `}</style>
    </div>
  );
}
