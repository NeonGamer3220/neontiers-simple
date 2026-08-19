"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import RankHistoryChart from "../../_components/RankHistoryChart";
import { useLang, LangToggle } from "../../_lib/i18n";
import "./player.css";
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

    </div>
  );
}
