"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminNavbar from "../../_components/AdminNavbar";
import "../../admin-theme.css";
import { actionLabelFor, actionMetaFor } from "../../_lib/auditActions";

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString("hu-HU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso || "—";
  }
}

export default function RegulatorProfilePage() {
  const router = useRouter();
  const params = useParams();
  const staffName = decodeURIComponent(params?.name || "");

  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");

  const [staffInfo, setStaffInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | tests | high

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      if (data.role) setAdminRole(String(data.role).toLowerCase());
      if (data.admin_name) setAdminName(String(data.admin_name));
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!staffName || !adminName) return;
    const isOwnProfile = String(adminName).trim().toLowerCase() === String(staffName).trim().toLowerCase();
    (async () => {
      try {
        const res = await fetch(isOwnProfile ? "/api/admin/staff?action=self" : "/api/admin/staff");
        const data = await res.json();
        if (isOwnProfile) {
          setStaffInfo(data?.staff || { admin_name: staffName, role: "regulator" });
        } else {
          const list = Array.isArray(data?.staff) ? data.staff : [];
          const found = list.find((s) => s.admin_name === staffName);
          setStaffInfo(found || { admin_name: staffName, role: "regulator" });
        }
      } catch {
        setStaffInfo({ admin_name: staffName, role: "regulator" });
      }
    })();
  }, [staffName, adminName]);

  useEffect(() => {
    if (!staffName) return;
    setLogsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/audit-log?admin_name=${encodeURIComponent(staffName)}&limit=1000`);
        const data = await res.json();
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
      } catch {
        setLogs([]);
      } finally {
        setLogsLoading(false);
      }
    })();
  }, [staffName]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  const testLogs = useMemo(() => logs.filter((l) => l.action === "tier_save"), [logs]);
  const highLogs = useMemo(() => logs.filter((l) => l.action === "high_score_save"), [logs]);
  const otherLogs = useMemo(
    () => logs.filter((l) => l.action !== "tier_save" && l.action !== "high_score_save"),
    [logs]
  );

  const stats = useMemo(() => {
    const uniquePlayers = new Set(logs.map((l) => l.target_username).filter(Boolean));
    const gamemodeCounts = {};
    for (const l of logs) {
      if (!l.gamemode) continue;
      gamemodeCounts[l.gamemode] = (gamemodeCounts[l.gamemode] || 0) + 1;
    }
    const topModes = Object.entries(gamemodeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const lastActivity = logs[0]?.created_at || null; // logs already ordered desc by API
    const firstActivity = logs.length ? logs[logs.length - 1]?.created_at : null;
    return {
      total: logs.length,
      tests: testLogs.length,
      high: highLogs.length,
      uniquePlayers: uniquePlayers.size,
      topModes,
      lastActivity,
      firstActivity,
    };
  }, [logs, testLogs.length, highLogs.length]);

  const visibleLogs = tab === "tests" ? testLogs : tab === "high" ? highLogs : logs;

  if (loading) {
    return (
      <div className="rpLoadingPage admin-panel">
        <div className="rpSpinner" />
      </div>
    );
  }

  const role = String(staffInfo?.role || "regulator").toLowerCase();

  return (
    <div className="rpPage admin-panel">
      <AdminNavbar adminName={adminName} adminRole={adminRole} onLogout={handleLogout} />

      <main className="rpContent">
        <button type="button" className="rpBack" onClick={() => router.push("/admin/dashboard")}>
          ← Vissza
        </button>

        <header className="rpHeader">
          <img
            className="rpAvatar"
            src={`https://mc-heads.net/avatar/${encodeURIComponent(staffName || "MHF_Question")}/72`}
            alt=""
            width={64}
            height={64}
          />
          <div className="rpHeaderInfo">
            <h1>{staffName}</h1>
            <span className={`rpRoleBadge role-${role}`}>
              {role === "owner" ? "★ " : ""}
              {role.toUpperCase()}
            </span>
          </div>
        </header>

        <section className="rpStatsGrid">
          <div className="rpStatCard">
            <span className="rpStatValue">{stats.total}</span>
            <span className="rpStatLabel">Összes tevékenység</span>
          </div>
          <div className="rpStatCard">
            <span className="rpStatValue">{stats.tests}</span>
            <span className="rpStatLabel">Tier / teszt mentés</span>
          </div>
          <div className="rpStatCard">
            <span className="rpStatValue">{stats.high}</span>
            <span className="rpStatLabel">Magas eredmény</span>
          </div>
          <div className="rpStatCard">
            <span className="rpStatValue">{stats.uniquePlayers}</span>
            <span className="rpStatLabel">Egyedi tesztelt játékos</span>
          </div>
        </section>

        {stats.topModes.length > 0 && (
          <section className="rpCard">
            <h2 className="rpCardTitle">Leggyakoribb játékmódok</h2>
            <div className="rpModeChips">
              {stats.topModes.map(([mode, count]) => (
                <span className="rpModeChip" key={mode}>
                  {mode} <strong>{count}</strong>
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="rpCard">
          <div className="rpCardTitleRow">
            <h2 className="rpCardTitle">Tevékenységek</h2>
            <div className="rpTabs">
              <button type="button" className={`rpTab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
                Összes ({logs.length})
              </button>
              <button type="button" className={`rpTab ${tab === "tests" ? "active" : ""}`} onClick={() => setTab("tests")}>
                Tesztek ({testLogs.length})
              </button>
              <button type="button" className={`rpTab ${tab === "high" ? "active" : ""}`} onClick={() => setTab("high")}>
                Magas eredmények ({highLogs.length})
              </button>
            </div>
          </div>

          {logsLoading ? (
            <div className="rpEmpty">Betöltés...</div>
          ) : visibleLogs.length === 0 ? (
            <div className="rpEmpty">
              <span className="rpEmptyTitle">Nincs rögzített tevékenység</span>
              <span className="rpEmptySub">Ez a regulator még nem mentett tesztet vagy magas eredményt.</span>
            </div>
          ) : (
            <div className="rpLogList">
              {visibleLogs.map((log, idx) => (
                <div className="rpLogRow" key={`${log.created_at}-${idx}`}>
                  <span
                    className={`rpLogAction ${log.action === "high_score_save" ? "high" : ""}`}
                    style={{ "--badge-color": actionMetaFor(log.action).color }}
                  >
                    {actionMetaFor(log.action).icon} {actionLabelFor(log.action)}
                  </span>
                  <span className="rpLogPlayer">{log.target_username || "—"}</span>
                  <span className="rpLogMode">{log.gamemode || "—"}</span>
                  <span className="rpLogTier">
                    {log.old_rank != null && <span className="rpLogPill">{log.old_rank}</span>}
                    {log.old_rank != null && log.new_rank != null && <span className="rpLogArrow">→</span>}
                    {log.new_rank != null && <span className="rpLogPill new">{log.new_rank}</span>}
                  </span>
                  <span className="rpLogDate">{fmtDate(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <style jsx global>{`
        .rpLoadingPage {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #05060a;
        }
        .rpSpinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-top-color: #8f7cff;
          animation: rpspin 0.8s linear infinite;
        }
        @keyframes rpspin {
          to { transform: rotate(360deg); }
        }
        .rpPage {
          min-height: 100vh;
          background: #05060a;
          color: #fff;
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }
        .rpContent {
          max-width: 980px;
          margin: 0 auto;
          padding: 28px 24px 80px;
          display: grid;
          gap: 20px;
        }
        .rpBack {
          justify-self: start;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.75);
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
          padding: 8px 14px;
          border-radius: 10px;
        }
        .rpBack:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .rpHeader {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .rpAvatar {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          object-fit: cover;
          image-rendering: pixelated;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.14);
        }
        .rpHeaderInfo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .rpHeaderInfo h1 {
          margin: 0;
          font-size: 26px;
          font-weight: 900;
        }
        .rpRoleBadge {
          align-self: flex-start;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.04em;
          padding: 4px 11px;
          border-radius: 999px;
          background: rgba(143, 124, 255, 0.16);
          border: 1px solid rgba(143, 124, 255, 0.35);
          color: #d7d0ff;
        }
        .rpRoleBadge.role-owner {
          background: rgba(213, 179, 85, 0.18);
          border-color: rgba(213, 179, 85, 0.45);
          color: #e8cf8a;
        }
        .rpStatsGrid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .rpStatCard {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 18px 20px;
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .rpStatValue {
          font-size: 26px;
          font-weight: 900;
          color: #fff;
        }
        .rpStatLabel {
          font-size: 11.5px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
        }
        .rpCard {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 22px 24px;
        }
        .rpCardTitleRow {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }
        .rpCardTitle {
          margin: 0 0 14px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.85);
        }
        .rpCardTitleRow .rpCardTitle {
          margin-bottom: 0;
        }
        .rpModeChips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .rpModeChip {
          font-size: 12.5px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.75);
        }
        .rpModeChip strong {
          color: #d7d0ff;
          margin-left: 4px;
        }
        .rpTabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rpTab {
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.65);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .rpTab.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(143, 124, 255, 0.32), rgba(214, 71, 71, 0.16));
          border-color: #8f7cff;
        }
        .rpEmpty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 32px 20px;
          text-align: center;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.12);
        }
        .rpEmptyTitle {
          font-size: 14px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.75);
        }
        .rpEmptySub {
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.45);
        }
        .rpLogList {
          display: grid;
          gap: 6px;
          overflow-x: auto;
        }
        .rpLogRow {
          display: grid;
          grid-template-columns: 150px 1fr 110px 150px 150px;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 12.5px;
          min-width: 700px;
        }
        .rpLogRow:hover {
          background: rgba(255, 255, 255, 0.045);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .rpLogAction {
          font-weight: 800;
          color: var(--badge-color, rgba(255, 255, 255, 0.75));
        }
        .rpLogAction.high {
          color: #e8cf8a;
        }
        .rpLogPlayer {
          font-weight: 700;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .rpLogMode {
          color: rgba(255, 255, 255, 0.6);
        }
        .rpLogTier {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rpLogPill {
          padding: 2px 8px;
          border-radius: 7px;
          background: rgba(214, 71, 71, 0.14);
          border: 1px solid rgba(214, 71, 71, 0.35);
          color: #ffb4b4;
          font-weight: 800;
          font-size: 11px;
        }
        .rpLogPill.new {
          background: rgba(52, 211, 153, 0.14);
          border-color: rgba(52, 211, 153, 0.35);
          color: #b8f5dd;
        }
        .rpLogArrow {
          color: rgba(255, 255, 255, 0.35);
        }
        .rpLogDate {
          color: rgba(255, 255, 255, 0.4);
          font-size: 11.5px;
          font-variant-numeric: tabular-nums;
        }

        @media (max-width: 720px) {
          .rpStatsGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
