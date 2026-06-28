"use client";

import React, { useEffect, useMemo, useState } from "react";

const DISCORD_INVITE = "https://discord.gg/7fanAQDxaN";

// Show player lists and leaderboard
const SHOW_LISTS = true;

  const MODE_LIST = [
  "Összes",
  "Boxing", "Combo", "Bridge", "No Debuff", "OP", "Soup", "Fireball Fight",
];

  const MODE_ICONS = {
  "Összes": "/images/overall.png",
  "Boxing": "/images/boxing.png",
  "Combo": "/images/combo.png",
  "Bridge": "/images/bridge.png",
  "No Debuff": "/images/no debuff.png",
  "OP": "/images/op.png",
  "Soup": "/images/soup.png",
  "Fireball Fight": "/images/fireball fight.png",
};

  const MODE_DISPLAY_MAP = {
  "boxing": "Boxing", "combo": "Combo", "bridge": "Bridge",
  "nodebuff": "No Debuff", "op": "OP", "soup": "Soup", "fireballfight": "Fireball Fight",
};

function displayMode(mode) {
  if (!mode) return "";
  const key = mode.toLowerCase().replace(/\s+/g, "");
  return MODE_DISPLAY_MAP[key] || mode || "";
}

// ELO to points mapping (same tier values preserved for sorting)
const RANK_POINTS = {
  500: 1, 750: 2, 1000: 3, 1250: 4,
  1500: 6, 1750: 10, 2000: 16, 2250: 22, 2500: 28, 2750: 34,
};

const TIER_ICONS = {
  1: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  2: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/></svg>,
  3: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 7V17L12 22L20 17V7L12 2Z"/></svg>,
  4: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 9L12 22L22 9L12 2ZM12 5.5L18.5 10L12 14.5L5.5 10L12 5.5Z"/></svg>,
  5: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12h20L12 2z"/></svg>,
};

const TIER_COLORS = {
  1: { accent: "#d5b355", surface: "rgba(213, 179, 85, 0.22)" },
  2: { accent: "#a4b3c7", surface: "rgba(164, 179, 199, 0.22)" },
  3: { accent: "#dd8849", surface: "rgba(221, 136, 73, 0.22)" },
  4: { accent: "#b7aadf", surface: "rgba(183, 170, 223, 0.22)" },
  5: { accent: "#6f6389", surface: "rgba(111, 99, 137, 0.22)" },
};

// Convert ELO to tier number (1-5)
function tierFromRank(rank) {
  if (!rank) return null;
  const elo = typeof rank === "string" ? parseInt(rank, 10) : rank;
  if (!Number.isFinite(elo)) return null;
  if (elo >= 2500) return 1;
  if (elo >= 2000) return 2;
  if (elo >= 1500) return 3;
  if (elo >= 1000) return 4;
  if (elo >= 500) return 5;
  return null;
}

// Get badge color for ELO rank
function rankBadgeColor(rank, retired = false) {
  if (retired) return "#8f7cff";
  if (!rank) return "#888d95";
  const elo = typeof rank === "string" ? parseInt(rank, 10) : rank;
  if (!Number.isFinite(elo)) return "#888d95";
  
  // Determine LT/HT based on midpoint
  const getTier = (e) => {
    if (e >= 2500) return 1;
    if (e >= 2000) return 2;
    if (e >= 1500) return 3;
    if (e >= 1000) return 4;
    return 5;
  };
  const tier = getTier(elo);
  const midpoints = {5: 625, 4: 1125, 3: 1625, 2: 2125, 1: 2625};
  const isLT = elo < (midpoints[tier] || 0);
  
  switch (tier) {
    case 1: return "#d5b355";
    case 2: return isLT ? "#888d95" : "#a4b3c7";
    case 3: return isLT ? "#b36830" : "#dd8849";
    case 4: return isLT ? "#514764" : "#b7aadf";
    case 5: return isLT ? "#40384f" : "#6f6389";
    default: return "#888d95";
  }
}

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function safeInt(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function skinUrl(username) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(username)}/56`;
}

export default function Page() {
  const [activeMode, setActiveMode] = useState("Összes");
  const [query, setQuery] = useState("");
const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tierBoardMode, setTierBoardMode] = useState(null);
  const [showTierBoard, setShowTierBoard] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerDetail, setShowPlayerDetail] = useState(false);
  const [singleModeFilter, setSingleModeFilter] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
const testRes = await fetch("/api/tests");
        if (!alive) return;
        const testJson = await testRes.json();
        setTests(Array.isArray(testJson?.tests) ? testJson.tests : []);
      } catch {
        if (!alive) return;
        setTests([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    load();
    
    // Parse URL for mode parameter: /mode=mace,vanilla or ?mode=mace,vanilla
    try {
      const sp = new URLSearchParams(window.location.search || "");
      let modeParam = sp.get("mode");
      if (!modeParam && window.location.pathname.includes("mode=")) {
        const match = window.location.pathname.match(/mode=([^/?]+)/);
        if (match) modeParam = match[1];
      }
      if (modeParam) {
        const modes = modeParam.split(",").map(m => m.trim().toLowerCase());
        if (modes.length === 1) {
          const displayName = displayMode(modes[0]);
          if (displayName && displayName !== "Összes") {
            setActiveMode(displayName);
            setSingleModeFilter(null);
          }
        } else {
          setSingleModeFilter(modes);
        }
      }
    } catch (e) {}
    
    return () => { alive = false; };
  }, []);

  const leaderboard = useMemo(() => {
    const rows = tests
      .map((r) => ({
        id: r?.id,
        username: String(r?.username || "").trim(),
        gamemode: String(r?.gamemode || "").trim(),
        rank: r?.rank != null ? Number(r.rank) : null,
        retired: r?.retired === true,
        points: r?.points != null
          ? safeInt(r.points, 0)
          : safeInt(RANK_POINTS[Number(r?.rank)] || 0, 0),
        created_at: r?.created_at ? String(r.created_at) : "",
      }))
      .filter((r) => r.username && r.gamemode && r.rank != null);

    const latestByUserMode = new Map();
    for (const r of rows) {
      const key = `${r.username}__${r.gamemode}`;
      const prev = latestByUserMode.get(key);
      if (!prev) { latestByUserMode.set(key, r); continue; }
      const prevTime = prev.created_at ? Date.parse(prev.created_at) : 0;
      const curTime = r.created_at ? Date.parse(r.created_at) : 0;
      if (curTime > prevTime) latestByUserMode.set(key, r);
      else if (curTime === prevTime && safeInt(r.id, 0) > safeInt(prev.id, 0))
        latestByUserMode.set(key, r);
    }

    const latestRows = Array.from(latestByUserMode.values());
    
    // Apply gamemode filter
    let filtered = latestRows;
    if (singleModeFilter && singleModeFilter.length > 0) {
      // Filter to rows matching ANY of the modes in the filter
      filtered = latestRows.filter(r => 
        singleModeFilter.some(m => r.gamemode.toLowerCase() === m.toLowerCase())
      );
    } else if (activeMode !== "Összes") {
      filtered = latestRows.filter((r) => r.gamemode.toLowerCase() === activeMode.toLowerCase());
    }

    const byUser = new Map();
    for (const r of filtered) {
      if (!byUser.has(r.username)) byUser.set(r.username, []);
      byUser.get(r.username).push(r);
    }

    const players = Array.from(byUser.entries()).map(([username, entries]) => {
      entries.sort((a, b) => {
        const rankA = tierFromRank(a.rank);
        const tierA = rankA ? RANK_POINTS[a.rank] || 0 : 0;
        const rankB = tierFromRank(b.rank);
        const tierB = rankB ? RANK_POINTS[b.rank] || 0 : 0;
        if (tierB !== tierA) return tierB - tierA;
        return a.gamemode.localeCompare(b.gamemode);
      });
      const total = entries.reduce((sum, e) => sum + safeInt(e.points, 0), 0);
      return { username, entries, total };
    });

    const q = query.trim().toLowerCase();
    let searched = !q ? players : players.filter((p) => p.username.toLowerCase().includes(q));

    // Improve search ranking: exact match > startsWith > includes > total points
    if (q) {
      searched.sort((a, b) => {
        const an = a.username.toLowerCase();
        const bn = b.username.toLowerCase();
        const ae = an === q ? 0 : an.startsWith(q) ? 1 : an.includes(q) ? 2 : 3;
        const be = bn === q ? 0 : bn.startsWith(q) ? 1 : bn.includes(q) ? 2 : 3;
        if (ae !== be) return ae - be;
        if (a.total !== b.total) return b.total - a.total;
        return a.username.localeCompare(b.username);
      });
    } else {
      searched.sort((a, b) => b.total !== a.total ? b.total - a.total : a.username.localeCompare(b.username));
    }

    return searched;
  }, [tests, activeMode, query, singleModeFilter]);

  // Map usernames to their current position in the filtered leaderboard
  const rankMap = useMemo(() => {
    const m = new Map();
    leaderboard.forEach((p, i) => m.set(p.username, i + 1));
    return m;
  }, [leaderboard]);

  const openTierBoard = (mode) => {
    if (mode !== "Összes") {
      setTierBoardMode(mode);
      setShowTierBoard(true);
    }
  };

  const closeTierBoard = () => {
    setShowTierBoard(false);
    setTimeout(() => setTierBoardMode(null), 300);
  };

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setShowPlayerDetail(true);
  };

const closePlayerDetail = () => {
    setShowPlayerDetail(false);
    setTimeout(() => setSelectedPlayer(null), 300);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showTierBoard) {
        closeTierBoard();
      }
      if (e.key === "Escape" && showPlayerDetail) {
        closePlayerDetail();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
   }, [showTierBoard, showPlayerDetail]);

  useEffect(() => {
    if (showTierBoard) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showTierBoard]);

// Build mode players for tier board modal (inline — stable reference)
    const eachModePlayer = () => {
      if (!tierBoardMode) return [];
      const rows = tests
        .map((r) => ({
          id: r?.id,
          username: String(r?.username || "").trim(),
          gamemode: String(r?.gamemode || "").trim(),
          rank: r?.rank != null ? Number(r.rank) : null,
          retired: r?.retired === true,
          points: r?.points != null
            ? safeInt(r.points, 0)
            : safeInt(RANK_POINTS[Number(r?.rank)] || 0, 0),
        }))
        .filter((r) => r.username && r.gamemode && r.rank != null);

     const latestByUserMode = new Map();
     for (const r of rows) {
       const key = `${r.username}__${r.gamemode}`;
       const prev = latestByUserMode.get(key);
       if (!prev) { latestByUserMode.set(key, r); continue; }
     }

     const latestRows = Array.from(latestByUserMode.values());
     const filtered = tierBoardMode === "Összes"
       ? latestRows
       : latestRows.filter((r) => r.gamemode.toLowerCase() === tierBoardMode.toLowerCase());
     return filtered;
   };

   return (
     <div className={`page ${showTierBoard ? 'modal-open' : ''}`}>
       <div className="bg" />

{/* Navbar */}
        <header className="navbar">
          <nav className="navInner">
            <h1 className="navLogo"><a href="/">NeonTiers</a></h1>
            <ul className="navLinks">
              <li>
                <a className="navLink active" href="/">
                <svg className="navLinkIcon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                Főoldal
              </a>
            </li>
            <li>
              <a className="navLink" href="https://discord.gg/7fanAQDxaN" target="_blank" rel="noreferrer">
                <svg className="navLinkIcon" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
                 <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
                </svg>
                Discord
              </a>
            </li>
            </ul>
             <span className="searchWrap">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"/>
              </svg>
              <input
                className="searchInput"
                placeholder="Játékos keresése..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                spellCheck={false}
              />
              <kbd className="searchKbd">/</kbd>
            </span>
          </nav>
        </header>

        {/* Gamemode tabs */}
        <div className="tabsWrap">
         <div className="tabsScroller">
           <div className="tabRow">
             {MODE_LIST.map((m) => (
<button
                   key={m}
                   className={`tabBtn ${activeMode === m ? "active" : ""}`}
                   onClick={() => setActiveMode(m)}
                   aria-pressed={activeMode === m}
                   type="button"
                 >
                 {MODE_ICONS[m] && (
                   <img className="tabIcon" src={MODE_ICONS[m]} alt={`${m} ikon`} width={30} height={30} loading="lazy" decoding="async" />
                 )}
                 <span className="tabLabel">{m}</span>
                 {activeMode === m && <span className="tabActiveLine" />}
               </button>
             ))}
           </div>
         </div>
       </div>

        {/* Main content */}
<main className="mainWrap">

           {/* Leaderboard - shown only for Összes */}
            {activeMode === "Összes" && (
            <div className="mainCard">
              {SHOW_LISTS ? (
                <>
                  {/* Info bar */}
                  <div className="infoBar">
                    <div className="infoBarLeft">
                      <a className="infoDiscordLink" href={DISCORD_INVITE} target="_blank" rel="noreferrer" aria-label="Discord" title="Discord">
                        <svg className="navLinkIcon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                          <path d="M19.82 5.7a16.5 16.5 0 0 0-4.12-1.3l-.2.4a14.75 14.75 0 0 1 3.85 1.53 12.93 12.93 0 0 0-3.92-1.26 15.52 15.52 0 0 0-6.87 0A12.95 12.95 0 0 0 4.65 6.3a14.74 14.74 0 0 1 3.84-1.52l-.2-.39a16.4 16.4 0 0 0-4.1 1.3C1.6 9.6.9 13.4 1.23 17.16a16.6 16.6 0 0 0 5.04 2.56l1.08-1.77c-.6-.2-1.17-.46-1.7-.76.14.1.28.18.43.27 3.28 1.88 6.83 1.88 10.08 0 .15-.09.29-.17.43-.27a10.2 10.2 0 0 1-1.7.76l1.08 1.77a16.5 16.5 0 0 0 5.04-2.56c.4-4.37-.67-8.14-2.7-11.46ZM8.87 14.83c-1 0-1.8-.93-1.8-2.08 0-1.15.8-2.08 1.8-2.08 1.01 0 1.82.94 1.8 2.08 0 1.15-.8 2.08-1.8 2.08Zm6.26 0c-1 0-1.8-.93-1.8-2.08 0-1.15.8-2.08 1.8-2.08 1.01 0 1.82.94 1.8 2.08 0 1.15-.79 2.08-1.8 2.08Z"/>
                        </svg>
                        <span>Discord</span>
                      </a>
                    </div>
</div>

                   {/* Column headers */}
                  <h2 className="colHead">
                    <span className="colHash">#</span>
                    <span className="colSkinSpacer" aria-hidden="true"></span>
                    <span className="colPlayer">Játékos</span>
                    <span className="colTiers">Tierek</span>
                  </h2>

                   {/* Player rows */}
                   {loading ? (
                     Array.from({ length: 8 }).map((_, i) => (
                       <div key={`skel-${i}`} className="playerRow skelRow" aria-hidden="true">
                         <span className="rowNum skel skelNum"></span>
                         <span className="skel skelSkin"></span>
                         <span className="playerNameWrap">
                           <span className="skel skelName"></span>
                           <span className="skel skelPoints"></span>
                         </span>
                         <span className="rowTiers">
                           <span className="skel skelBadge"></span>
                           <span className="skel skelBadge"></span>
                           <span className="skel skelBadge"></span>
                         </span>
                       </div>
                     ))
                    ) : leaderboard.length === 0 ? (
                     <div className="emptyState">
                   <h3 className="emptyTitle">Nincs adat</h3>
                   <div className="emptySub">Még nincs mentett teszt eredmény.</div>
                 </div>
                  ) : (
                  leaderboard.map((p, idx) => (
                    <div
                      key={p.username}
                      id={p.username}
                      className="playerRow"
                      role="button"
                      tabIndex={0}
                      aria-haspopup="dialog"
                      aria-expanded={showPlayerDetail ? "true" : "false"}
                      onClick={() => handlePlayerClick(p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePlayerClick(p);
                      }
                    }}
                  >
                    <span className="rowNum">{idx + 1}.</span>
<img
                      className="playerSkin"
                      src={skinUrl(p.username)}
                      alt={p.username}
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                    <span className="playerNameWrap">
                      <span className="playerName">{p.username}</span>
                      <span className="playerPoints">{p.total} pont</span>
                    </span>
<span className="rowTiers">
                       {p.entries.map((r) => {
                         const baseColor = rankBadgeColor(r.rank, r.retired);
                         const pts = safeInt(RANK_POINTS[r.rank] || r.points, 0);
                         const modeName = displayMode(r.gamemode);
                         const displayRank = r.retired ? `R${r.rank}` : String(r.rank);
                         return (
                           <span
                             key={`${r.gamemode}:${displayRank}`}
                             className="tierBadge"
                             data-gamemode={r.gamemode.toLowerCase()}
                             style={{
                               color: baseColor,
                               '--tier-accent': baseColor,
                               '--tier-border': hexToRgba(baseColor, 0.78),
                               '--tier-surface': hexToRgba(baseColor, 0.22),
                               '--tier-text': baseColor,
                             }}
                             aria-label={`${modeName} ${displayRank}`}
                           >
                             {MODE_ICONS[modeName] && (
                               <img
                                 className="tierIcon"
                                 src={MODE_ICONS[modeName]}
                                 alt={`${modeName} ikon`}
                                 width={30}
                                 height={30}
                                 loading="lazy"
                                 decoding="async"
                               />
                             )}
                             <span className="tierLabel">{displayRank}</span>
                             <span className="tierTooltip" aria-hidden="true">
                               <span className="tierTooltipRank">{displayRank}</span>
                               <span>{modeName}</span>
                               <span>{pts} pont</span>
                             </span>
                           </span>
                         );
                       })}
                     </span>
                   </div>
                 ))
               )}
                </>
              ) : (
                <div className="statsOnlyView">
                  <div className="emptyState">
                    <h3 className="emptyTitle">Rangsor szünetel</h3>
                    <div className="emptySub">A teljes rangsor jelenleg nem érhető el.</div>
                  </div>
                </div>
              )}
            </div>
          )}

{/* Gamemode-specific tier board inline - no modal */}
{activeMode !== "Összes" && (
              <div className="mainCard">
                <div className="modeBoard">
{[1, 2, 3, 4, 5].map((tier) => {
                     const tierPlayers = leaderboard.filter(p => {
                       const entry = p.entries.find(e => e.gamemode.toLowerCase() === activeMode.toLowerCase());
                       if (!entry) return false;
                       const entryTier = tierFromRank(entry.rank);
                       return entryTier === tier;
                     });
                     return (
                       <section
                         key={tier}
                         className="modeTierColumn"
                         style={{
                           '--column-accent': TIER_COLORS[tier].accent,
                           '--column-surface': TIER_COLORS[tier].surface,
                         }}
                       >
                         <header className="modeTierHead">
                           <span className="modeTierHeadIcon">{TIER_ICONS[tier]}</span>
                           <span className="modeTierNumber">Tier {tier}</span>
                         </header>
                         <div className="modeTierList">
                           {tierPlayers.length > 0 ? (
                              tierPlayers.map((p, i) => {
                                 const entry = (p.entries || []).find(e => e.gamemode.toLowerCase() === activeMode.toLowerCase());
                                 const rank = entry ? entry.rank : 500;
                                 const retired = entry ? entry.retired : false;
                                 const badgeColor = rankBadgeColor(rank, retired);
                                 const displayRank = retired ? `R${rank}` : String(rank);
                                return (
                                   <div
                                     key={`${p.username}-${i}`}
                                     className="modeTierPlayer"
                                     onClick={() => handlePlayerClick(p)}
                                     style={{
                                       '--player-accent': badgeColor,
                                       '--mode-player-surface': 'rgba(255,255,255,0.018)',
                                       '--mode-player-surface-hover': 'rgba(255,255,255,0.035)',
                                       '--player-rank-surface': `${badgeColor}33`,
                                       '--player-rank-border': `${badgeColor}44`,
                                       '--player-rank-text': badgeColor,
                                     }}
                                   >
                                   <img
                                     className="modeTierSkin"
                                     src={skinUrl(p.username)}
                                     alt={p.username}
                                     width={38}
                                     height={38}
                                     loading="lazy"
                                     decoding="async"
                                     referrerPolicy="no-referrer"
                                   />
                                   <span className="modeTierName">{p.username}</span>
                                   <span className="modeTierRank">{displayRank}</span>
                                 </div>
                               );
                             })
                           ) : (
                             <div className="emptyTierList">Nincs játékos</div>
                          )}
                        </div>
                      </section>
                    );
                  })}
               </div>
             </div>
           )}
        </main>


        {/* Tier Board Modal */}
        {(() => {
          if (!showTierBoard || !tierBoardMode) return null;
const tierColors = {
            1: { accent: "#d5b355", surface: "rgba(213, 179, 85, 0.22)" },
            2: { accent: "#a4b3c7", surface: "rgba(164, 179, 199, 0.22)" },
            3: { accent: "#dd8849", surface: "rgba(221, 136, 73, 0.22)" },
            4: { accent: "#b7aadf", surface: "rgba(183, 170, 223, 0.22)" },
            5: { accent: "#6f6389", surface: "rgba(111, 99, 137, 0.22)" },
          };

          return (
            <div className="playerModalBackdrop" onClick={closeTierBoard}>
              <div className="playerModalCard" onClick={(e) => e.stopPropagation()}>
                <div className="tierBoardHeader">
                  <h2 className="tierBoardTitle">{displayMode(tierBoardMode)} ranglista</h2>
                  <button className="tierBoardClose" onClick={closeTierBoard} aria-label="Bezárás">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
<div className="modeBoard">
{[1, 2, 3, 4, 5].map((tier) => {
                     const tierPlayers = eachModePlayer().filter(p => {
                       const entryTier = tierFromRank(p.rank);
                       return entryTier === tier;
                     });
                     return tierPlayers.length > 0 && (
                       <section key={tier} className="modeTierColumn" style={{
                         '--column-accent': tierColors[tier].accent,
                         '--column-surface': tierColors[tier].surface,
                       }}>
                         <header className="modeTierHead">
                           <span className="modeTierHeadIcon">{TIER_ICONS[tier]}</span>
                           <span className="modeTierNumber">Tier {tier}</span>
                         </header>
                         <div className="modeTierList">
                           {tierPlayers.map((p, i) => {
                             const badgeColor = rankBadgeColor(p.rank, p.retired);
                             const displayRank = p.retired ? `R${p.rank}` : String(p.rank);
                             return (
                               <button
                                 key={`${p.username}-${i}`}
                                 className="modeTierPlayer"
                                 type="button"
                                 style={{
                                   '--player-accent': badgeColor,
                                   '--mode-player-surface': 'rgba(255,255,255,0.018)',
                                   '--mode-player-surface-hover': 'rgba(255,255,255,0.035)',
                                   '--player-rank-surface': `${badgeColor}33`,
                                   '--player-rank-border': `${badgeColor}44`,
                                   '--player-rank-text': badgeColor,
                                 }}
                               >
                                 <img
                                   className="modeTierSkin"
                                   src={skinUrl(p.username)}
                                   alt={p.username}
                                   width={38}
                                   height={38}
                                   loading="lazy"
                                   decoding="async"
                                   referrerPolicy="no-referrer"
                                 />
                                 <span className="modeTierName">{p.username}</span>
                                 <span className="modeTierRank">{displayRank}</span>
                               </button>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
             </div>
           </div>
         );
        })()}

       {/* Player Detail Modal */}
       {showPlayerDetail && selectedPlayer && (() => {
const totalPoints = selectedPlayer.total;
          const modeCount = selectedPlayer.entries.length;
          const firstEntryRank = selectedPlayer.entries[0]?.rank ?? 500;
          const firstEntryRetired = selectedPlayer.entries[0]?.retired ?? false;
          return (
            <div className="playerDetailBackdrop" onClick={closePlayerDetail}>
              <div className="playerDetailCard" onClick={(e) => e.stopPropagation()}>
                <button className="playerDetailClose" onClick={closePlayerDetail} aria-label="Bezárás">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
                <div className="detailLeft">
                  <div className="detailAvatarFrame" style={{
                    '--detail-avatar-border': hexToRgba(rankBadgeColor(firstEntryRank, firstEntryRetired), 0.3),
                    '--detail-avatar-surface': hexToRgba(rankBadgeColor(firstEntryRank, firstEntryRetired), 0.08),
                  }}>
                   <img
                     className="detailAvatar"
                     alt={selectedPlayer.username}
                     width={118}
                     height={118}
                     loading="lazy"
                     decoding="async"
                     referrerPolicy="no-referrer"
                     src={skinUrl(selectedPlayer.username)}
                   />
                 </div>
               </div>
                <div className="detailRight">
                 <div className="detailUsername" id="player-modal-title">{selectedPlayer.username}</div>
                 <div className="detailPosition">Pozíció: {rankMap.get(selectedPlayer.username) || "-"}</div>
                 <div className="detailStats">
                   <div className="detailStat">
                     <span className="detailStatValue">{totalPoints}</span>
                     <span className="detailStatLabel">Pont</span>
                   </div>
                   <div className="detailStat">
                     <span className="detailStatValue">{modeCount}</span>
                     <span className="detailStatLabel">Mód</span>
                   </div>
                 </div>
<div className="detailTiers">
                    {selectedPlayer.entries.map((entry, idx) => {
                      const baseColor = rankBadgeColor(entry.rank, entry.retired);
                      const pts = safeInt(RANK_POINTS[entry.rank] || entry.points, 0);
                      const modeName = displayMode(entry.gamemode);
                      const displayRank = entry.retired ? `R${entry.rank}` : String(entry.rank);
                      
                      // If viewing single-mode, show all entries; else filter to matching ones
                      const shouldShow = !singleModeFilter || singleModeFilter.some(m => entry.gamemode.toLowerCase() === m.toLowerCase());
                      if (!shouldShow) return null;
                      
                      return (
                        <div
                          key={`${entry.gamemode}-${idx}`}
                          className="detailTier"
                          data-gamemode={entry.gamemode.toLowerCase()}
                          style={{
                            color: baseColor,
                            '--tier-accent': baseColor,
                            '--tier-border': hexToRgba(baseColor, 0.78),
                            '--tier-surface': hexToRgba(baseColor, 0.22),
                            '--tier-text': baseColor,
                          }}
                        >
                          {MODE_ICONS[modeName] && (
                            <img
                              className="detailTierIcon"
                              alt={`${modeName} ikon`}
                              width={26}
                              height={26}
                              loading="lazy"
                              decoding="async"
                              src={MODE_ICONS[modeName]}
                            />
                          )}
                          <span className="detailTierRank">{displayRank}</span>
                          <span className="tierTooltip" aria-hidden="true">
                            <span className="tierTooltipRank">{displayRank}</span>
                            <span>{modeName}</span>
                            <span>{pts} pont</span>
                          </span>
                        </div>
                      );
                    })}
                 </div>
               </div>
             </div>
           </div>
         );
       })()}

        <footer className="pageFooter">
          <div className="footerText">NeonTiers © {new Date().getFullYear()}</div>
<nav className="footerNav" aria-label="Oldalak">
             <a className="footerNavLink" href="https://render.crafty.gg">Crafty.gg</a>
             <a className="footerNavLink" href="https://modrinth.com/mod/neontierstagger">Mod</a>
             <a className="footerNavLink" href={DISCORD_INVITE} target="_blank" rel="noreferrer">Discord</a>
             <span className="footerDivider" aria-hidden="true">|</span>
              <a className="footerNavLink" href="/legacy">Legacy</a>
           </nav>
          <div className="footerLastUpdate">Eredmények frissítve: legutóbbi teszt futás alapján</div>
        </footer>
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />


<style jsx global>{`
        .page {
           min-height: 100vh;
           position: relative;
         }

        .bg {
           position: fixed;
           inset: 0;
           background: var(--bg);
           z-index: -1;
           pointer-events: none;
         }

         /* Skeleton rows */
        .skelRow {
           pointer-events: none;
           cursor: default;
           opacity: 0.55;
         }

        .skel {
           display: block;
           border-radius: 4px;
           background: linear-gradient(90deg, #ffffff10 25%, #ffffff1e 50%, #ffffff10 75%);
           background-size: 200% 100%;
           animation: shimmer 1.4s ease-in-out infinite;
         }

        .skelNum {
           width: 40px;
           height: 22px;
           border-radius: 6px;
         }

        .skelSkin {
           width: 56px;
           height: 56px;
           border-radius: 10px;
         }

        .skelName {
           width: 70%;
           height: 18px;
           margin-bottom: 6px;
         }

        .skelPoints {
           width: 45%;
           height: 14px;
         }

        .skelBadge {
           width: 34px;
           height: 18px;
           border-radius: 99px;
         }

        @keyframes shimmer {
           0%   { background-position: 200% 0; }
           100% { background-position: -200% 0; }
         }

         /* Info panel */
        .infoPanel {
          background: #0e1a22cc;
          border: 1px solid #ffffff10;
          border-radius: 22px;
          padding: 28px 32px;
        }

        .infoPanelTitle {
          font-size: 20px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.03em;
          margin: 0 0 16px;
        }

        .infoPanelSub {
          font-size: 13px;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 22px 0 10px;
        }

        .infoPanelText {
          font-size: 14px;
          color: var(--muted);
          line-height: 1.7;
          font-weight: 500;
          margin: 0 0 12px;
        }

        .infoPanelText strong {
          color: var(--text);
          font-weight: 700;
        }

        .infoPanelLink {
          color: var(--accent);
          font-weight: 700;
          text-decoration: none;
          transition: color 0.15s;
        }

        .infoPanelLink:hover {
          color: white;
          text-decoration: underline;
        }

        .infoPanelEndpoint {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: 5px 0;
        }

        .infoPanelMethod {
          font-family: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        .infoPanelMethodGet {
          background: #22c55e18;
          color: #4ade80;
          border: 1px solid #22c55e30;
        }

        .infoPanelPath {
          font-family: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
          font-size: 11px;
          color: var(--text);
          background: #ffffff08;
          border: 1px solid #ffffff14;
          border-radius: 4px;
          padding: 2px 8px;
          white-space: nowrap;
        }

        .infoPanelDesc {
          font-size: 13px;
          color: var(--muted);
          font-weight: 500;
        }

        /* Navbar */
        .navbar {
          max-width: 1480px;
          margin: 0 auto;
          padding-left: 20px;
          padding-right: 20px;
          padding-top: 18px;
        }

        .navInner {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
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
          justify-self: start;
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
          margin: 0;
          padding: 0;
          justify-content: center;
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

        .searchWrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 0 12px;
          height: 40px;
          color: rgba(255,255,255,0.45);
          justify-self: end;
        }

        .searchInput {
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 14px;
          width: 180px;
        }

        .searchKbd {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 4px;
        }

         /* Main layout */
         .mainWrap {
           max-width: 1480px;
           margin: 0 auto;
           padding-left: 20px;
           padding-right: 20px;
           position: relative;
         }

.mainCard {
           background: var(--bg-panel);
           border: 1px solid var(--border);
           border-radius: 24px;
           padding: 22px 28px 28px;
           margin-top: 0;
           position: relative;
           box-shadow: 0 24px 72px #00000061;
           overflow: visible;
         }

         /* Tabs */
.tabsWrap {
            max-width: 1480px;
            margin: 0 auto;
            padding-left: 20px;
            padding-right: 20px;
            margin-top: 100px;
            position: relative;
            z-index: 1;
          }

        .tabsScroller {
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tabsScroller::-webkit-scrollbar { display: none; }

.tabRow {
           display: flex;
           gap: 4px;
           align-items: flex-end;
           margin-top: 6px;
         }

          .tabBtn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            gap: 6px;
            min-width: 70px;
            padding: 8px 6px 7px;
            cursor: pointer;
            user-select: none;
            position: relative;
            border: 1px solid #ffffff1a;
            border-bottom: none;
            border-radius: 18px 18px 0 0;
            background: #ffffff06;
            color: #ffffff8f;
            transition: color 0.15s, background 0.15s, border-color 0.15s;
            flex-shrink: 0;
          }

        .tabBtn:hover {
          color: var(--text);
          background: #ffffff0d;
          border-color: #ffffff2e;
        }

        .tabBtn.active {
          color: var(--text);
          background: var(--bg-panel);
          border-color: #fff3;
        }

        .tabIcon {
          width: 28px;
          height: 28px;
        }

         .tabLabel {
           font-size: 9px;
           font-weight: 800;
           letter-spacing: 0.02em;
           white-space: nowrap;
         }

         .tabActiveLine {
           position: absolute;
           bottom: 0;
           left: 9px;
           right: 9px;
           height: 3px;
           background: #fff;
           border-radius: 999px;
         }

         /* Info bar */
         .infoBar {
           display: flex;
           justify-content: flex-end;
           margin-bottom: 12px;
           padding-top: 4px;
         }
         .infoBarLeft {
           display: flex;
           align-items: center;
           gap: 12px;
         }
         .infoDiscordLink {
           display: flex;
           align-items: center;
           gap: 8px;
           text-decoration: none;
           color: var(--muted);
           font-size: 14px;
           font-weight: 700;
           transition: color 0.15s;
         }
         .infoDiscordLink:hover { color: var(--text); }

        /* Column headers */
        .colHead {
          display: grid;
          grid-template-columns: 56px 68px minmax(180px, 1fr) minmax(0, 1.35fr);
          gap: 14px;
          padding: 10px 18px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.11em;
          color: var(--muted);
        }

        .colHash { text-align: center; }
        .colSkinSpacer { grid-column: 2; }
        .colPlayer { grid-column: 3; text-align: left; }
        .colTiers { grid-column: 4; text-align: right; justify-self: end; padding-right: 6px; }

        /* Player rows */
        .playerRow {
          display: grid;
          grid-template-columns: 56px 68px minmax(180px, 1fr) minmax(0, 1.35fr);
          gap: 14px;
          align-items: center;
          padding: 16px 18px;
          border-radius: 15px;
          background: #ffffff04;
          border: 1px solid #ffffff0f;
          margin-bottom: 9px;
          transition: border-color 0.15s, background 0.15s;
          position: relative;
          overflow: visible;
          text-align: left;
          width: 100%;
          color: inherit;
          cursor: pointer;
        }

        .playerRow:hover {
          background: #ffffff0a;
          border-color: #ffffff29;
          z-index: 4;
        }

        .rowNum {
          text-align: center;
          font-size: 21px;
          font-weight: 700;
          color: var(--muted);
        }

        .playerSkin {
          width: 64px;
          height: 64px;
          border-radius: 13px;
          image-rendering: pixelated;
          background: transparent;
          filter: drop-shadow(-4px 0 6px #0000002e);
          transform: translateY(4px);
        }

        .playerNameWrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .playerName {
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 22px;
          font-weight: 800;
        }

        .playerPoints {
          color: #ffffff75;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.15;
        }

        .rowTiers {
          display: flex;
          flex-wrap: nowrap;
          gap: 11px;
          padding: 2px 4px;
          justify-content: flex-end;
          justify-self: stretch;
          width: 100%;
          min-width: 0;
          max-width: 100%;
          min-height: 82px;
          overflow: visible;
        }

        .tierBadge {
          isolation: isolate;
          background: transparent;
          border: none;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          width: 42px;
          min-width: 42px;
          height: auto;
          padding: 0;
          display: inline-flex;
          position: relative;
          overflow: visible;
          text-align: center;
          cursor: pointer;
        }

        .tierBadge:hover, .tierBadge:focus-visible {
          z-index: 30;
        }

        .tierIcon {
          box-sizing: border-box;
          border: 2px solid var(--tier-border);
          background: #141a24;
          border-radius: 999px;
          width: 41px;
          height: 41px;
          padding: 8px;
          box-shadow: inset 0 1px #ffffff08;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tierLabel {
          background: var(--tier-surface, #ffffff24);
          min-height: 19px;
          color: var(--tier-text);
          white-space: nowrap;
          letter-spacing: 0.03em;
          border: none;
          border-radius: 999px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          margin-top: -3px;
          padding: 0 7px;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
        }

        .tierTooltip {
          display: none;
          position: absolute;
          white-space: nowrap;
          background: #11161ffa;
          border: 1px solid #ffffff1f;
          border-radius: 15px;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 96px;
          padding: 10px 12px;
          color: var(--text);
          box-shadow: 0 18px 40px #0000005c;
          pointer-events: none;
          z-index: 140;
          transform: translateX(-50%);
          bottom: calc(100% + 8px);
          left: 50%;
        }

        .tierTooltipRank {
          color: var(--tier-accent);
          font-size: 14px;
          font-weight: 700;
          line-height: 1;
        }

        .tierTooltip span:not(.tierTooltipRank) {
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }

        .tierBadge:hover .tierTooltip {
          display: flex;
        }

         /* Tier Board Modal */
         .playerModalBackdrop {
           position: fixed;
           inset: 0;
           display: flex;
           justify-content: center;
           align-items: center;
           z-index: 150;
           padding: 22px;
           background: #03050ac7;
           -webkit-backdrop-filter: blur(10px);
           backdrop-filter: blur(10px);
         }

         .playerModalCard {
           background: #0b0d11fa;
           border: 1px solid #ffffff1f;
           border-radius: 28px;
           width: min(920px, calc(100vw - 44px));
           max-height: calc(100vh - 44px);
           position: relative;
           overflow: visible;
           box-shadow: 0 28px 90px #00000075;
           animation: modalSlideIn 0.25s ease;
         }

        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .tierBoardHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }

        .tierBoardTitle {
          font-size: 16px;
          font-weight: 800;
          color: var(--text);
          margin: 0;
        }

        .tierBoardClose {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 999px;
          background: #ffffff14;
          color: #ffffffc2;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }

        .tierBoardClose:hover {
          color: var(--text);
          background: #ffffff1f;
        }

        .tierBoardClose svg {
          width: 14px;
          height: 14px;
        }

.modeBoard {
             display: grid;
             grid-template-columns: repeat(5, minmax(220px, 1fr));
             justify-content: center;
             align-items: start;
             gap: 12px;
             padding: 2px 2px 8px;
             overflow-x: auto;
             background: transparent;
           }

          .modeBoard::-webkit-scrollbar { display: none; }
          .modeBoard { scrollbar-width: none; }

.modeTierColumn {
            min-width: 220px;
            width: 100%;
            max-width: 260px;
            background: #ffffff07;
            border: 1px solid #ffffff12;
            border-radius: 20px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            content-visibility: auto;
            contain-intrinsic-size: 480px;
          }

.modeTierHead {
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: center;
            padding: 0 18px;
            min-height: 56px;
            background: var(--column-surface);
            color: var(--column-accent);
            font-size: 18px;
            font-weight: 800;
            font-family: "Montserrat", ui-sans-serif, system-ui, sans-serif;
            letter-spacing: -0.02em;
            border-bottom: 1px solid #ffffff0f;
          }

         .modeTierHeadIcon {
           flex-shrink: 0;
           width: 22px;
           height: 22px;
           fill: currentColor;
         }

          .modeTierList {
            display: flex;
            flex-direction: column;
          }

.modeTierPlayer {
             display: grid;
             grid-template-columns: 38px minmax(0, 1fr) auto;
             align-items: center;
             gap: 10px;
             width: 100%;
             padding: 8px 12px;
             background: var(--mode-player-surface, #ffffff08);
             border: 1px solid #ffffff0d;
             border-radius: 8px;
             cursor: pointer;
             transition: background 0.15s, border-color 0.15s;
             position: relative;
             color: var(--text);
             font-size: 15px;
             font-weight: 800;
             font-family: "Montserrat", ui-sans-serif, system-ui, sans-serif;
             min-height: 54px;
             content-visibility: auto;
             contain-intrinsic-size: 54px;
           }

          .modeTierPlayer:hover {
            background: var(--mode-player-surface-hover, #ffffff0e);
            border-color: var(--player-rank-border);
          }

          .modeTierPlayer:before {
            content: "";
            background: var(--player-accent);
            width: 3px;
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
          }

          .emptyTierList {
            padding: 20px 12px;
            text-align: center;
            color: var(--muted);
            font-size: 14px;
            font-weight: 600;
            font-style: italic;
          }

          .modeTierSkin {
            width: 38px;
            height: 38px;
            border-radius: 6px;
            image-rendering: pixelated;
            flex-shrink: 0;
            filter: drop-shadow(-3px 0 4px #00000029);
            background: transparent;
          }

          .modeTierName {
           text-overflow: ellipsis;
           white-space: nowrap;
           min-width: 0;
           font-size: 15px;
           font-weight: 800;
           overflow: hidden;
         }

         .modeTierRank {
           font-size: 11px;
           font-weight: 700;
           color: var(--player-rank-text);
           background: var(--player-rank-surface);
           border: 1px solid var(--player-rank-border);
           border-radius: 999px;
           padding: 0 8px;
           min-width: 40px;
           min-height: 24px;
           display: inline-flex;
           justify-content: center;
           align-items: center;
           flex-shrink: 0;
          }

         /* Empty state */
         .emptyState {
           padding: 48px 24px;
           text-align: center;
         }

         .emptyTitle {
           font-size: 18px;
           font-weight: 800;
           color: var(--text);
         }

         .emptySub {
           margin-top: 8px;
           font-size: 14px;
           color: var(--muted);
         }

         /* Player Detail Modal */
         .playerDetailBackdrop {
           position: fixed;
           inset: 0;
           display: flex;
           justify-content: center;
           align-items: center;
           z-index: 160;
           padding: 22px;
           background: #03050ac7;
           -webkit-backdrop-filter: blur(10px);
           backdrop-filter: blur(10px);
         }

         .playerDetailCard {
           background: #0b0d11fa;
           border: 1px solid #ffffff1f;
           border-radius: 28px;
           width: min(720px, calc(100vw - 44px));
           max-height: calc(100vh - 44px);
           position: relative;
           overflow: hidden;
           box-shadow: 0 28px 90px #00000075;
           animation: modalSlideIn 0.25s ease;
           display: flex;
           padding: 0;
         }

         .playerDetailClose {
           position: absolute;
           top: 10px;
           right: 10px;
           width: 32px;
           height: 32px;
           border: none;
           border-radius: 999px;
           background: #ffffff14;
           color: #ffffffc2;
           cursor: pointer;
           display: inline-flex;
           align-items: center;
           justify-content: center;
           transition: background 0.15s, color 0.15s;
           z-index: 10;
         }

         .playerDetailClose:hover {
           color: var(--text);
           background: #ffffff1f;
         }

         .playerDetailClose svg {
           width: 14px;
           height: 14px;
         }

         .detailLeft {
           flex-shrink: 0;
           width: 160px;
           padding: 24px;
           display: flex;
           align-items: center;
           justify-content: center;
           background: rgba(255,255,255,0.02);
           border-right: 1px solid rgba(255,255,255,0.08);
         }

         .detailAvatarFrame {
           width: 118px;
           height: 118px;
           border-radius: 50%;
           border: 3px solid var(--detail-avatar-border, rgba(213, 179, 85, 0.3));
           background: var(--detail-avatar-surface, rgba(213, 179, 85, 0.08));
           padding: 3px;
           display: flex;
           align-items: center;
           justify-content: center;
         }

         .detailAvatar {
           width: 100%;
           height: 100%;
           border-radius: 50%;
           image-rendering: pixelated;
           object-fit: cover;
         }

         .detailRight {
           flex: 1;
           padding: 20px 24px;
           overflow-y: auto;
           max-height: calc(100vh - 44px);
         }

         @media (max-height: 600px) {
           .detailRight {
             max-height: 50vh;
           }
         }

         .detailUsername {
           font-size: 24px;
           font-weight: 700;
           color: var(--text);
           margin-bottom: 16px;
           line-height: 1.2;
         }

         .detailStats {
           display: flex;
           gap: 24px;
           margin-bottom: 20px;
           padding-bottom: 16px;
           border-bottom: 1px solid rgba(255,255,255,0.08);
         }

        .detailPosition {
          font-size: 14px;
          color: rgba(255,255,255,0.85);
          font-weight: 700;
          margin-top: 6px;
        }

         .detailStat {
           display: flex;
           flex-direction: column;
           gap: 2px;
         }

         .detailStatValue {
           font-size: 28px;
           font-weight: 700;
           color: var(--text);
           line-height: 1;
         }

         .detailStatLabel {
           font-size: 12px;
           font-weight: 700;
           color: var(--muted);
           text-transform: uppercase;
           letter-spacing: 0.05em;
         }

         .detailTiers {
           display: flex;
           flex-wrap: wrap;
           gap: 8px;
         }

         .detailTier {
           isolation: isolate;
           background: transparent;
           border: none;
           flex-direction: column;
           align-items: center;
           gap: 1px;
           width: auto;
           min-width: 70px;
           height: auto;
           padding: 6px 10px;
           display: inline-flex;
           position: relative;
           overflow: visible;
           text-align: center;
           cursor: pointer;
           border-radius: 12px;
           background: rgba(255,255,255,0.04);
           border: 1px solid rgba(255,255,255,0.08);
           transition: all 0.15s;
         }

         .detailTier:hover {
           background: rgba(255,255,255,0.06);
           border-color: var(--tier-border);
         }

         .detailTierIcon {
           box-sizing: border-box;
           border: 2px solid var(--tier-border);
           background: #141a24;
           border-radius: 999px;
           width: 26px;
           height: 26px;
           padding: 4px;
           box-shadow: inset 0 1px #ffffff08;
           display: flex;
           align-items: center;
           justify-content: center;
         }

         .detailTierRank {
           background: var(--tier-surface, #ffffff24);
           min-height: 18px;
           color: var(--tier-text);
           white-space: nowrap;
           letter-spacing: 0.03em;
           border: none;
           border-radius: 999px;
           display: inline-flex;
           justify-content: center;
           align-items: center;
           margin-top: -2px;
           padding: 0 6px;
           font-size: 11px;
           font-weight: 700;
           line-height: 1;
         }

         .detailTier .tierTooltip {
           display: none;
           position: absolute;
           white-space: nowrap;
           background: #11161ffa;
           border: 1px solid #ffffff1f;
           border-radius: 15px;
           flex-direction: column;
           align-items: center;
           gap: 4px;
           min-width: 96px;
           padding: 10px 12px;
           color: var(--text);
           box-shadow: 0 18px 40px #0000005c;
           pointer-events: none;
           z-index: 170;
           transform: translateX(-50%);
           bottom: calc(100% + 8px);
           left: 50%;
         }

         .detailTier .tierTooltipRank {
           color: var(--tier-accent);
           font-size: 14px;
           font-weight: 700;
           line-height: 1;
         }

         .detailTier .tierTooltip span:not(.tierTooltipRank) {
           color: var(--muted);
           font-size: 12px;
           font-weight: 700;
         }

         .detailTier:hover .tierTooltip {
           display: flex;
         }

         /* Tooltip positioning adjustment for player detail (higher z-index) */
         .playerDetailBackdrop .tierTooltip {
           z-index: 180;
         }

        /* Footer */
        .pageFooter {
          max-width: 1100px;
          margin: 80px auto 0;
          padding: 24px 16px;
          text-align: center;
        }

        .footerText {
          color: var(--muted);
          font-size: 14px;
        }

        .footerNav {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 14px;
        }

        .footerDivider {
          color: var(--border-strong);
          opacity: 0.5;
          font-size: 12px;
        }

        .footerNavLink {
          color: var(--muted);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          letter-spacing: 0.03em;
          transition: color 0.15s;
        }

        .footerNavLink:hover {
          color: var(--text);
        }

        .footerLastUpdate {
          margin-top: 10px;
          color: var(--muted);
          font-size: 12px;
          opacity: 0.55;
        }

        /* Tooltip positioning adjustment */
        .modeTierPlayer .modeTierRank {
          position: static;
          transform: none;
        }

        /* Responsive */
        @media (max-width: 1180px) {
          .colHead, .playerRow {
            grid-template-columns: 56px 56px minmax(180px, 1fr);
          }
          .colSkinSpacer, .colTiers { display: none; }
        }

         @media (max-width: 980px) {
           .navbar, .mainWrap, .pageFooter {
             padding-left: 14px;
             padding-right: 14px;
           }
           .navbar { padding-top: 14px; }
           .navInner { gap: 12px; padding: 10px 16px; min-height: 64px; }
           .tabBtn { min-width: 76px; padding: 9px 8px 8px; }
            .tabLabel { font-size: 9px; letter-spacing: 0.02em; }
            .mainCard { border-radius: 22px; padding: 16px 14px 18px; }
          }

        @media (max-width: 760px) {
          .navbar, .mainWrap, .pageFooter {
            padding-left: 10px;
            padding-right: 10px;
          }
          .tabBtn { min-width: 76px; padding: 9px 8px 8px; }
          .tabLabel { font-size: 8px; }
          .playerRow {
            grid-template-columns: 48px 48px 1fr;
            gap: 10px;
            padding: 12px;
          }
          .rowNum { font-size: 16px; }
          .playerSkin { width: 48px; height: 48px; }
          .playerName { font-size: 18px; }
          .playerPoints { font-size: 12px; }
          .tierBadge { width: 38px; min-width: 38px; }
          .tierIcon { width: 36px; height: 36px; padding: 6px; }
          .tierLabel { font-size: 11px; }
          .modeTierColumn { min-width: 100px; }
        }

        @media (max-width: 480px) {
          .playerRow {
            grid-template-columns: 40px 40px 1fr;
            gap: 8px;
            padding: 10px;
          }
          .rowNum { font-size: 14px; }
          .playerSkin { width: 40px; height: 40px; }
          .playerName { font-size: 16px; }
          .rowTiers { gap: 6px; min-height: auto; }
          .tierBadge { width: 34px; min-width: 34px; }
          .tierIcon { width: 32px; height: 32px; }
          .tierLabel { font-size: 10px; }
        }

        /* Hidden helper */
        .visuallyHidden {
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
          width: 1px;
          height: 1px;
          margin: -1px;
          padding: 0;
          position: absolute;
          overflow: hidden;
        }

        /* Animations */
         @keyframes modalSlideIn {
           from { opacity: 0; transform: scale(0.95) translateY(20px); }
           to { opacity: 1; transform: scale(1) translateY(0); }
         }

         /* Hide page content when modal is open */
         .page.modal-open > .bg,
         .page.modal-open > .navbar,
         .page.modal-open > .tabsWrap,
         .page.modal-open > .mainWrap,
         .page.modal-open > .pageFooter {
           display: none !important;
         }
       `}</style>
    </div>
  );
}
