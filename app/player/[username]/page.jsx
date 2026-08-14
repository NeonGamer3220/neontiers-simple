"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import RankHistoryChart from "../../_components/RankHistoryChart";
import { useLang, LangToggle } from "../../_lib/i18n";
import {
  MODE_ICONS, displayMode, rankBadgeColor, eloRankLabel, hexToRgba,
  skinUrl, getPointsForElo, safeInt, entriesForUser, totalPointsForEntries,
  latestByUserMode,
} from "../../_lib/tiers";

function PlayerPanel({ username, tests, history, onRemove, compact }) {
  const { t } = useLang();
  const entries = useMemo(() => entriesForUser(tests, username), [tests, username]);
  const total = totalPointsForEntries(entries);
  const found = entries.length > 0;

  const rankMap = useMemo(() => {
    const rows = latestByUserMode(tests);
    const byMode = new Map();
    for (const r of rows) {
      if (!byMode.has(r.gamemode)) byMode.set(r.gamemode, []);
      byMode.get(r.gamemode).push(r);
    }
    return byMode;
  }, [tests]);

  const [activeMode, setActiveMode] = useState(null);

  useEffect(() => {
    if (!activeMode && entries.length > 0) {
      const sorted = [...entries].sort((a, b) => safeInt(b.points) - safeInt(a.points));
      setActiveMode(sorted[0].gamemode);
    }
  }, [entries, activeMode]);

  const uuid = entries[0]?.uuid || null;
  const modeHistory = useMemo(() => {
    if (!activeMode) return [];
    return (history || []).filter((h) => h.gamemode.toLowerCase() === activeMode.toLowerCase());
  }, [history, activeMode]);

  return (
    <div className={`ppPanel ${compact ? "ppPanelCompact" : ""}`}>
      {onRemove && (
        <button className="ppRemoveBtn" onClick={onRemove} aria-label="Eltávolítás">×</button>
      )}
      <div className="ppHeader">
        <img className="ppAvatar" src={skinUrl(username, uuid)} alt={username} width={72} height={72} referrerPolicy="no-referrer" />
        <div className="ppHeaderInfo">
          <div className="ppUsername">{username}</div>
          {found ? (
            <div className="ppTotal">{total} {t("points_suffix")} · {entries.length} {t("modes_suffix")}</div>
          ) : (
            <div className="ppTotal ppMuted">{t("no_test_results")}</div>
          )}
        </div>
      </div>

      {found && (
        <>
          <div className="ppTiers">
            {entries
              .slice()
              .sort((a, b) => safeInt(b.points) - safeInt(a.points))
              .map((e) => {
                const color = rankBadgeColor(e.rank, e.retired);
                const label = e.retired ? `R${eloRankLabel(e.rank)}` : eloRankLabel(e.rank);
                const modeName = displayMode(e.gamemode);
                const active = activeMode === e.gamemode;
                return (
                  <button
                    key={e.gamemode}
                    className={`ppTierBadge ${active ? "ppTierBadgeActive" : ""}`}
                    onClick={() => setActiveMode(e.gamemode)}
                    style={{
                      color,
                      '--tier-border': hexToRgba(color, 0.78),
                      '--tier-surface': hexToRgba(color, 0.22),
                    }}
                  >
                    {MODE_ICONS[modeName] && <img src={MODE_ICONS[modeName]} alt="" width={20} height={20} />}
                    <span>{modeName}</span>
                    <span className="ppTierLabel">{label}</span>
                  </button>
                );
              })}
          </div>

          {activeMode && (
            <div className="ppChartCard">
              <div className="ppChartTitle">{displayMode(activeMode)} — fejlődés</div>
              <RankHistoryChart history={modeHistory} height={compact ? 170 : 220} />
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .ppPanel {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 22px;
          position: relative;
          flex: 1;
          min-width: 0;
        }
        .ppRemoveBtn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: none;
          background: #ffffff14;
          color: #ffffffc2;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }
        .ppRemoveBtn:hover { background: #ffffff24; }
        .ppHeader {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }
        .ppAvatar {
          border-radius: 14px;
          image-rendering: pixelated;
        }
        .ppUsername {
          font-size: 24px;
          font-weight: 800;
          color: var(--text);
          word-break: break-word;
        }
        .ppTotal { font-size: 13px; color: var(--muted); font-weight: 700; margin-top: 4px; }
        .ppMuted { opacity: 0.6; }
        .ppTiers {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }
        .ppTierBadge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--tier-surface);
          border: 1px solid var(--tier-border);
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          opacity: 0.75;
        }
        .ppTierBadgeActive, .ppTierBadge:hover { opacity: 1; }
        .ppTierLabel { color: inherit; }
        .ppChartCard {
          background: #ffffff05;
          border: 1px solid #ffffff0f;
          border-radius: 16px;
          padding: 16px;
        }
        .ppChartTitle {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          margin-bottom: 10px;
        }
        @media (max-width: 640px) {
          .ppPanel { padding: 16px; border-radius: 18px; }
          .ppAvatar { width: 56px; height: 56px; }
          .ppUsername { font-size: 19px; }
        }
      `}</style>
    </div>
  );
}

export default function PlayerProfilePage() {
  const { t } = useLang();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = decodeURIComponent(params?.username || "");
  const vsParam = searchParams.get("vs") || "";

  const [tests, setTests] = useState([]);
  const [history, setHistory] = useState([]);
  const [vsHistory, setVsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareQuery, setCompareQuery] = useState("");
  const [compareResults, setCompareResults] = useState([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/tests");
        const json = await res.json();
        if (alive) setTests(Array.isArray(json?.tests) ? json.tests : []);
      } catch {
        if (alive) setTests([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!username) return;
    fetch(`/api/rank-history?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((j) => { if (alive) setHistory(Array.isArray(j?.history) ? j.history : []); })
      .catch(() => { if (alive) setHistory([]); });
    return () => { alive = false; };
  }, [username]);

  useEffect(() => {
    let alive = true;
    if (!vsParam) { setVsHistory([]); return; }
    fetch(`/api/rank-history?username=${encodeURIComponent(vsParam)}`)
      .then((r) => r.json())
      .then((j) => { if (alive) setVsHistory(Array.isArray(j?.history) ? j.history : []); })
      .catch(() => { if (alive) setVsHistory([]); });
    return () => { alive = false; };
  }, [vsParam]);

  // Autocomplete for the compare search box, sourced from the players
  // already present in the tests list (case-insensitive substring match).
  useEffect(() => {
    const q = compareQuery.trim().toLowerCase();
    if (!q) { setCompareResults([]); return; }
    const names = new Set();
    for (const r of tests) {
      const n = String(r?.username || "").trim();
      if (n && n.toLowerCase().includes(q) && n.toLowerCase() !== username.toLowerCase()) names.add(n);
    }
    setCompareResults(Array.from(names).slice(0, 8));
  }, [compareQuery, tests, username]);

  const setVs = (name) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (name) sp.set("vs", name); else sp.delete("vs");
    router.push(`/player/${encodeURIComponent(username)}?${sp.toString()}`);
    setCompareQuery("");
    setCompareResults([]);
  };

  return (
    <div className="ppPage">
      <div className="bg" />
      <div className="ppTopBar">
        <a href="/" className="ppBackLink">{t("back_to_leaderboard")}</a>
        <LangToggle />
      </div>

      <main className="ppMain">
        {loading ? (
          <div className="ppLoading">{t("loading")}</div>
        ) : (
          <>
            <div className={`ppPanelRow ${vsParam ? "ppPanelRowCompare" : ""}`}>
              <PlayerPanel username={username} tests={tests} history={history} compact={!!vsParam} />
              {vsParam && (
                <PlayerPanel
                  username={vsParam}
                  tests={tests}
                  history={vsHistory}
                  compact
                  onRemove={() => setVs(null)}
                />
              )}
            </div>

            <div className="ppCompareBox">
              <label className="ppCompareLabel">
                {vsParam ? t("compare_another") : t("compare_player")}
              </label>
              <div className="ppCompareSearchWrap">
                <input
                  className="ppCompareInput"
                  placeholder={t("compare_placeholder")}
                  value={compareQuery}
                  onChange={(e) => setCompareQuery(e.target.value)}
                />
                {compareResults.length > 0 && (
                  <div className="ppCompareDropdown">
                    {compareResults.map((n) => (
                      <button key={n} className="ppCompareItem" onClick={() => setVs(n)}>{n}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <style jsx global>{`
        .ppPage { min-height: 100vh; position: relative; }
        .bg { position: fixed; inset: 0; background: var(--bg); z-index: -1; }
        .ppTopBar { max-width: 1100px; margin: 0 auto; padding: 24px 20px 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .ppBackLink { color: var(--muted); text-decoration: none; font-weight: 700; font-size: 14px; }
        .ppBackLink:hover { color: var(--text); }
        .ppMain { max-width: 1100px; margin: 0 auto; padding: 18px 20px 80px; }
        .ppLoading { padding: 80px 0; text-align: center; color: var(--muted); }
        .ppPanelRow { display: flex; gap: 18px; }
        .ppPanelRowCompare .ppPanel { max-width: none; }
        .ppCompareBox { margin-top: 20px; max-width: 360px; }
        .ppCompareLabel {
          display: block;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .ppCompareSearchWrap { position: relative; }
        .ppCompareInput {
          width: 100%;
          background: #ffffff0a;
          border: 1px solid #ffffff1a;
          border-radius: 10px;
          padding: 10px 12px;
          color: var(--text);
          font-size: 14px;
        }
        .ppCompareDropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #14161f;
          border: 1px solid #ffffff1f;
          border-radius: 12px;
          overflow: hidden;
          z-index: 10;
          max-height: 220px;
          overflow-y: auto;
        }
        .ppCompareItem {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-bottom: 1px solid #ffffff0d;
          color: var(--text);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .ppCompareItem:hover { background: #ffffff0c; }

        @media (max-width: 760px) {
          .ppPanelRow { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
