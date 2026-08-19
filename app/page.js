"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLang, LangToggle } from "./_lib/i18n";
import "./home.css";

const DISCORD_INVITE = "https://discord.gg/7fanAQDxaN";

// Show player lists and leaderboard
const SHOW_LISTS = true;

const MODE_LIST = [
  "Összes",
  "Vanilla", "UHC", "Pot", "NethPot", "SMP",
  "Sword", "Axe", "Mace", "Cart", "Creeper", "DiaSMP",
  "OGVanilla", "ShieldlessUHC", "SpearMace", "SpearElytra", "Trident",
];

const REAL_MODES = MODE_LIST.filter((m) => m !== "Összes");

const MODE_ICONS = {
  "Összes": "/images/overall.png",
  "Vanilla": "/images/vanilla.png",
  "UHC": "/images/uhc.png",
  "Pot": "/images/pot.png",
  "NethPot": "/images/nethpot.png",
  "SMP": "/images/smp.png",
  "Sword": "/images/sword.png",
  "Axe": "/images/axe.png",
  "Mace": "/images/mace.png",
  "Cart": "/images/cart.png",
  "Creeper": "/images/creeper.png",
  "DiaSMP": "/images/diasmp.png",
  "OGVanilla": "/images/ogvanilla.png",
  "SpearMace": "/images/spear.png",
  "SpearElytra": "/images/spear.png",
  "ShieldlessUHC": "/images/shieldlessuhc.png",
  "Trident": "/images/trident.png",
};

const MODE_DISPLAY_MAP = {
  "vanilla": "Vanilla", "uhc": "UHC", "pot": "Pot", "nethpot": "NethPot",
  "smp": "SMP", "sword": "Sword", "axe": "Axe", "mace": "Mace",
  "cart": "Cart", "creeper": "Creeper", "diasmp": "DiaSMP",
  "ogvanilla": "OGVanilla", "shieldlessuhc": "ShieldlessUHC",
  "spearmace": "SpearMace", "spearelytra": "SpearElytra",
  "trident": "Trident",
};

function displayMode(mode) {
  if (!mode) return "";
  const key = mode.toLowerCase().replace(/\s+/g, "");
  return MODE_DISPLAY_MAP[key] || mode || "";
}

const TIER_TO_POINTS = {
  LT5: 1, HT5: 2, LT4: 3, HT4: 4,
  LT3: 6, HT3: 10, LT2: 16, HT2: 22,
  LT1: 40, HT1: 60,
};

function getPointsForElo(rank) {
  if (typeof rank !== "string") return 0;
  return TIER_TO_POINTS[rank.trim().toUpperCase()] || 0;
}

const TIER_ICONS = {
  1: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  2: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/></svg>,
  3: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 7V17L12 22L20 17V7L12 2Z"/></svg>,
  4: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 9L12 22L22 9L12 2ZM12 5.5L18.5 10L12 14.5L5.5 10L12 5.5Z"/></svg>,
  5: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12h20L12 2z"/></svg>,
};

const TIER_IMAGE_MAP = {
  1: "/images/tier_1.svg",
  2: "/images/tier_2.svg",
  3: "/images/tier_3.svg",
};

const TIER_COLORS = {
  1: { accent: "#d5b355", surface: "rgba(213, 179, 85, 0.22)" },
  2: { accent: "#a4b3c7", surface: "rgba(164, 179, 199, 0.22)" },
  3: { accent: "#dd8849", surface: "rgba(221, 136, 73, 0.22)" },
  4: { accent: "#b7aadf", surface: "rgba(183, 170, 223, 0.22)" },
  5: { accent: "#6f6389", surface: "rgba(111, 99, 137, 0.22)" },
};

// Convert rank (tier string or ELO number) to tier number (1-5)
function tierFromRank(rank) {
  if (!rank) return null;
  const val = String(rank).trim().toUpperCase();
  if (val.startsWith("R")) return null;
  const tierMap = { LT5:5, HT5:5, LT4:4, HT4:4, LT3:3, HT3:3, LT2:2, HT2:2, LT1:1, HT1:1 };
  if (tierMap[val] !== undefined) return tierMap[val];
  const num = Number(val);
  if (Number.isNaN(num)) return null;
  if (num >= 2500) return 1;
  if (num >= 2000) return 2;
  if (num >= 1500) return 3;
  if (num >= 1000) return 4;
  if (num >= 500) return 5;
  return null;
}

// Get badge color for rank (tier string only)
function rankBadgeColor(rank, retired = false) {
  if (retired) return "#8f7cff";
  if (!rank) return "#888d95";
  const val = String(rank).trim().toUpperCase();
  const tierMap = { LT5:5, HT5:5, LT4:4, HT4:4, LT3:3, HT3:3, LT2:2, HT2:2, LT1:1, HT1:1 };
  const clean = val.startsWith("R") ? val.slice(1) : val;
  const isLT = clean.startsWith("LT");
  const effectiveTier = tierMap[clean];
  if (!effectiveTier) return "#888d95";
  switch (effectiveTier) {
    case 1: return "#d5b355";
    case 2: return isLT ? "#888d95" : "#a4b3c7";
    case 3: return isLT ? "#b36830" : "#dd8849";
    case 4: return isLT ? "#514764" : "#b7aadf";
    case 5: return isLT ? "#40384f" : "#6f6389";
    default: return "#888d95";
  }
}

// Convert rank (tier string or raw ELO number) into a display label like "HT3".
// The database stores rank as a raw ELO number, so without this the site
// would show numbers like "1750" instead of the tier name.
function eloRankLabel(rank) {
  if (rank === null || rank === undefined || rank === "") return "";
  return String(rank).trim().toUpperCase();
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

function skinUrl(username, uuid) {
  if (uuid && uuid.replace(/-/g, "").length === 32) {
    return `https://mc-heads.net/avatar/${uuid.replace(/-/g, "")}/56`;
  }
  return `https://mc-heads.net/avatar/${encodeURIComponent(username)}/56`;
}

export default function Page() {
  const { t } = useLang();
  const [activeMode, setActiveMode] = useState("Összes");
  const [query, setQuery] = useState("");
const [tests, setTests] = useState([]);
  const [bannedUsernames, setBannedUsernames] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [tierBoardMode, setTierBoardMode] = useState(null);
  const [showTierBoard, setShowTierBoard] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showPlayerDetail, setShowPlayerDetail] = useState(false);
  const [singleModeFilter, setSingleModeFilter] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapRef = React.useRef(null);

  useEffect(() => {
    let alive = true;
    async function load(isInitial) {
      try {
        if (isInitial) setLoading(true);
        // The API already sends a Cache-Control header (s-maxage=30,
        // stale-while-revalidate=30) — let the browser honor it instead of
        // forcing a fresh network round-trip on every load/interval tick.
        const [testRes, bansRes] = await Promise.all([
          fetch("/api/tests"),
          fetch("/api/bans/public").catch(() => null),
        ]);
        if (!alive) return;
        const testJson = await testRes.json();
        setTests(Array.isArray(testJson?.tests) ? testJson.tests : []);
        if (bansRes) {
          try {
            const bansJson = await bansRes.json();
            const names = Array.isArray(bansJson?.usernames) ? bansJson.usernames : [];
            setBannedUsernames(new Set(names));
          } catch {
            // leave bannedUsernames as-is on parse failure
          }
        }
      } catch {
        if (!alive) return;
        if (isInitial) setTests([]);
      } finally {
        if (!alive) return;
        if (isInitial) {
          // Data is in — drop the skeleton immediately instead of padding
          // out an artificial minimum delay.
          setLoading(false);
        }
      }
    }
    load(true);

    // Keep the leaderboard in sync with the Supabase "tests" table by
    // re-fetching every 60 seconds, without a full page reload or loading flicker.
    const intervalId = setInterval(() => load(false), 60000);

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

    return () => { alive = false; clearInterval(intervalId); };
  }, []);

  // Grouped/sorted by mode+points only — independent of the search box, so
  // typing in search doesn't re-run this whole grouping/sorting pass on
  // every keystroke (it only depends on data + the mode filters now).
  const basePlayers = useMemo(() => {
    const rows = tests
      .map((r) => ({
        id: r?.id,
        username: String(r?.username || "").trim(),
        gamemode: String(r?.gamemode || "").trim(),
        uuid: r?.uuid || null,
        rank: r?.rank || null,
        retired: r?.retired === true,
        points: r?.points != null
          ? safeInt(r.points, 0)
          : getPointsForElo(r?.rank),
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
      filtered = latestRows.filter(r => 
        singleModeFilter.some(m => r.gamemode.toLowerCase().replace(/\s+/g, "") === m.toLowerCase())
      );
    } else if (activeMode !== "Összes") {
      const activeNorm = activeMode.toLowerCase().replace(/\s+/g, "");
      filtered = latestRows.filter((r) => r.gamemode.toLowerCase().replace(/\s+/g, "") === activeNorm);
    }

    const byUser = new Map();
    for (const r of filtered) {
      if (!byUser.has(r.username)) byUser.set(r.username, []);
      byUser.get(r.username).push(r);
    }

    const players = Array.from(byUser.entries()).map(([username, entries]) => {
      entries.sort((a, b) => {
        const rankA = tierFromRank(a.rank);
        const tierA = rankA ? getPointsForElo(a.rank) : 0;
        const rankB = tierFromRank(b.rank);
        const tierB = rankB ? getPointsForElo(b.rank) : 0;
        if (tierB !== tierA) return tierB - tierA;
        return a.gamemode.localeCompare(b.gamemode);
      });
      const total = entries.reduce((sum, e) => sum + safeInt(e.points, 0), 0);
      const banned = bannedUsernames.has(username.trim().toLowerCase());
      return { username, entries, total, banned };
    });

    // Banned players always sink to the bottom of the list, below every
    // active player, regardless of points — while the ban is active. Within
    // each group (active / banned) the existing points-based order applies.
    players.sort((a, b) => {
      if (a.banned !== b.banned) return a.banned ? 1 : -1;
      return b.total !== a.total ? b.total - a.total : a.username.localeCompare(b.username);
    });
    return players;
  }, [tests, activeMode, singleModeFilter, bannedUsernames]);

  // Cheap re-filter/re-rank on top of basePlayers whenever the search box
  // changes — no re-grouping of the raw rows needed here.
  const leaderboard = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return basePlayers;

    const searched = basePlayers.filter((p) => p.username.toLowerCase().includes(q));

    // Improve search ranking: exact match > startsWith > includes > total points
    searched.sort((a, b) => {
      if (a.banned !== b.banned) return a.banned ? 1 : -1;
      const an = a.username.toLowerCase();
      const bn = b.username.toLowerCase();
      const ae = an === q ? 0 : an.startsWith(q) ? 1 : an.includes(q) ? 2 : 3;
      const be = bn === q ? 0 : bn.startsWith(q) ? 1 : bn.includes(q) ? 2 : 3;
      if (ae !== be) return ae - be;
      if (a.total !== b.total) return b.total - a.total;
      return a.username.localeCompare(b.username);
    });

    return searched;
  }, [basePlayers, query]);

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
    const onClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const searchSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return leaderboard.filter((p) => p.username.toLowerCase().includes(q)).slice(0, 6);
  }, [query, leaderboard]);

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
          uuid: r?.uuid || null,
          rank: r?.rank || null,
          retired: r?.retired === true,
          points: r?.points != null
            ? safeInt(r.points, 0)
            : getPointsForElo(r?.rank),
        }))
        .filter((r) => r.username && r.gamemode && r.rank != null);

     const latestByUserMode = new Map();
     for (const r of rows) {
       const key = `${r.username}__${r.gamemode}`;
       const prev = latestByUserMode.get(key);
       if (!prev) { latestByUserMode.set(key, r); continue; }
     }

     const latestRows = Array.from(latestByUserMode.values());
      const tierNorm = tierBoardMode.toLowerCase().replace(/\s+/g, "");
      const filtered = tierBoardMode === "Összes"
        ? latestRows
        : latestRows.filter((r) => r.gamemode.toLowerCase().replace(/\s+/g, "") === tierNorm);
     return filtered;
   };

   return (
     <div className={`page ${showTierBoard ? 'modal-open' : ''}`}>
       <div className="bg" />

{/* Navbar */}
       <header className="navbar">
         <nav className="navInner">
           <h1 className="navLogo"><a href="/">NeonTiers</a></h1>
           <ul className="navLinks" style={{ display: "flex", gap: 4, listStyle: "none", margin: 0, padding: 0, justifyContent: "center" }}>
            <li>
               <a className="navLink active" href="/">
               <svg className="navLinkIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
                 <path d="M12 3.2 3.8 9.8a1 1 0 0 0-.38.78V20a1 1 0 0 0 1 1h5.1a1 1 0 0 0 1-1v-4.8h3V20a1 1 0 0 0 1 1h5.08a1 1 0 0 0 1-1v-9.42a1 1 0 0 0-.37-.78L12 3.2Z"/>
               </svg>
               <span className="navLinkText">{t("nav_home")}</span>
             </a>
           </li>
           <li>
              <a className="navLink" href="/docs">
                <svg className="navLinkIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
                  <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6Zm7 1.5L18.5 9H13V3.5ZM7 12h10v1.5H7V12Zm0 4h10v1.5H7V16Zm0-8h4v1.5H7V8Z"/>
                </svg>
                <span className="navLinkText">{t("nav_docs_link")}</span>
              </a>
            </li>
<li>
              <a className="navLink" href="https://modrinth.com/mod/neontierstagger" target="_blank" rel="noreferrer">
                <svg className="navLinkIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
                  <path d="M11.14 3.38a1.7 1.7 0 0 1 1.72 0l6 3.42A1.72 1.72 0 0 1 19.72 8v8a1.72 1.72 0 0 1-.86 1.48l-6 3.42a1.7 1.7 0 0 1-1.72 0l-6-3.42A1.72 1.72 0 0 1 4.28 16V8c0-.62.33-1.2.86-1.49l6-3.13Zm.86 2.03L7.16 8.17 12 10.93l4.84-2.76L12 5.41Zm-5.72 4.2V15L11 17.67v-5.52L6.28 9.6Zm7.72 8.06 4.72-2.68V9.6L13 12.15v5.52Z"/>
                </svg>
                <span className="navLinkText">{t("nav_mod")}</span>
              </a>
            </li>
            <li>
              <a className="navLink" href="/legacy">
                <svg className="navLinkIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                </svg>
                <span className="navLinkText">{t("nav_legacy")}</span>
              </a>
            </li>
            </ul>
           <span className="searchWrap" ref={searchWrapRef}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"/>
            </svg>
            <input
              className="searchInput"
              placeholder={t("search_placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              spellCheck={false}
            />
            <kbd className="searchKbd">/</kbd>
            {searchFocused && query.trim() && searchSuggestions.length > 0 && (
              <div className="searchDropdown">
                {searchSuggestions.map((p) => (
                  <a key={p.username} className="searchDropdownItem" href={`/player/${encodeURIComponent(p.username)}`}>
                    <img className="searchDropdownSkin" src={skinUrl(p.username, p.entries?.[0]?.uuid)} alt="" width={22} height={22} referrerPolicy="no-referrer" />
                    <span>{p.username}</span>
                    <span className="searchDropdownPoints">{p.total} pont</span>
                  </a>
                ))}
              </div>
            )}
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
                        <svg className="navLinkIcon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
                          <path d="M19.82 5.7a16.5 16.5 0 0 0-4.12-1.3l-.2.4a14.75 14.75 0 0 1 3.85 1.53 12.93 12.93 0 0 0-3.92-1.26 15.52 15.52 0 0 0-6.87 0A12.95 12.95 0 0 0 4.65 6.3a14.74 14.74 0 0 1 3.84-1.52l-.2-.39a16.4 16.4 0 0 0-4.1 1.3C1.6 9.6.9 13.4 1.23 17.16a16.6 16.6 0 0 0 5.04 2.56l1.08-1.77c-.6-.2-1.17-.46-1.7-.76.14.1.28.18.43.27 3.28 1.88 6.83 1.88 10.08 0 .15-.09.29-.17.43-.27a10.2 10.2 0 0 1-1.7.76l1.08 1.77a16.5 16.5 0 0 0 5.04-2.56c.4-4.37-.67-8.14-2.7-11.46ZM8.87 14.83c-1 0-1.8-.93-1.8-2.08 0-1.15.8-2.08 1.8-2.08 1.01 0 1.82.94 1.8 2.08 0 1.15-.8 2.08-1.8 2.08Zm6.26 0c-1 0-1.8-.93-1.8-2.08 0-1.15.8-2.08 1.8-2.08 1.01 0 1.82.94 1.8 2.08 0 1.15-.79 2.08-1.8 2.08Z"/>
                        </svg>
                        <span>Discord</span>
                      </a>
                      <LangToggle />
                    </div>
</div>

                   {/* Column headers */}
                  <h2 className="colHead">
                    <span className="colHash">#</span>
                    <span className="colSkinSpacer" aria-hidden="true"></span>
                    <span className="colPlayer">{t("col_player")}</span>
                    <span className="colTiers">{t("col_tiers")}</span>
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
                   <h3 className="emptyTitle">{t("no_data")}</h3>
                   <div className="emptySub">{t("no_saved_tests")}</div>
                 </div>
                  ) : (
                  leaderboard.map((p, idx) => {
                    const entryMap = Object.fromEntries(
                      (p.entries || []).map((r) => [displayMode(r.gamemode), r])
                    );
                    return (
                    <div
                      key={p.username}
                      id={p.username}
                      className={`playerRow${p.banned ? " playerRowBanned" : ""}`}
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
                      src={skinUrl(p.username, p.uuid)}
                      alt={p.username}
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                    <span className="playerNameWrap">
                      <span className="playerName">
                        {p.username}
                        {p.banned && <span className="bannedBadge">Kitiltva</span>}
                      </span>
                      <span className="playerPoints">{p.total} pont</span>
                    </span>
                    <span className="rowChevron" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    </span>
<span className="rowTiers">
                       {REAL_MODES.map((modeName) => {
                         const r = entryMap[modeName];
                         if (!r) {
                           return (
                             <span
                               key={`empty:${modeName}`}
                               className="tierBadge tierBadgeEmpty"
                               data-gamemode={modeName.toLowerCase()}
                               aria-label={`${modeName} nincs rangsorolva`}
                             >
                               <span className="tierIcon tierIconEmpty" aria-hidden="true" />
                               <span className="tierLabel tierLabelEmpty" aria-hidden="true" />
                               <span className="tierTooltip" aria-hidden="true">
                                 <span className="tierTooltipRank">—</span>
                                 <span>{modeName}</span>
                                 <span>Nincs rangsorolva</span>
                               </span>
                             </span>
                           );
                         }
                         const baseColor = rankBadgeColor(r.rank, r.retired);
                         const pts = r.points != null ? safeInt(r.points, 0) : getPointsForElo(r.rank);
                         const displayRank = r.retired ? `R${eloRankLabel(r.rank)}` : eloRankLabel(r.rank);
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
                 );
                })
               )}
                </>
              ) : (
                <div className="statsOnlyView">
                  <div className="emptyState">
                    <h3 className="emptyTitle">{t("leaderboard_paused")}</h3>
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
                        const activeModeNorm = activeMode.toLowerCase().replace(/\s+/g, "");
                        const entry = p.entries.find(e => e.gamemode.toLowerCase().replace(/\s+/g, "") === activeModeNorm);
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
                            <span className="modeTierHeadIcon">
                              {TIER_IMAGE_MAP[tier] ? (
                                <img src={TIER_IMAGE_MAP[tier]} alt="" width={22} height={22} />
                              ) : null}
                            </span>
                           <span className="modeTierNumber">Tier {tier}</span>
                         </header>
                         <div className="modeTierList">
                           {tierPlayers.length > 0 ? (
                              tierPlayers.map((p, i) => {
                                 const entry = (p.entries || []).find(e => e.gamemode.toLowerCase() === activeMode.toLowerCase());
                                 const rank = entry ? entry.rank : 500;
                                 const retired = entry ? entry.retired : false;
                                 const badgeColor = rankBadgeColor(rank, retired);
                                 const displayRank = retired ? `R${eloRankLabel(rank)}` : eloRankLabel(rank);
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
                                     src={skinUrl(p.username, p.uuid)}
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
                             <div className="emptyTierList">{t("no_players")}</div>
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
                  <button className="tierBoardClose" onClick={closeTierBoard} aria-label={t("close")}>
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
                            <span className="modeTierHeadIcon">
                              {TIER_IMAGE_MAP[tier] ? (
                                <img src={TIER_IMAGE_MAP[tier]} alt="" width={22} height={22} />
                              ) : null}
                            </span>
                           <span className="modeTierNumber">Tier {tier}</span>
                         </header>
                         <div className="modeTierList">
                           {tierPlayers.map((p, i) => {
                             const badgeColor = rankBadgeColor(p.rank, p.retired);
                             const displayRank = p.retired ? `R${eloRankLabel(p.rank)}` : eloRankLabel(p.rank);
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
                                   src={skinUrl(p.username, p.uuid)}
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
                <button className="playerDetailClose" onClick={closePlayerDetail} aria-label={t("close")}>
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
                      src={skinUrl(selectedPlayer.username, selectedPlayer.uuid)}
                   />
                 </div>
               </div>
                <div className="detailRight">
                 <div className="detailUsername" id="player-modal-title">{selectedPlayer.username}</div>
                 <div className="detailPosition">{t("position_label")}: {rankMap.get(selectedPlayer.username) || "-"}</div>
                 <a className="detailProfileLink" href={`/player/${encodeURIComponent(selectedPlayer.username)}`}>
                   {t("view_full_profile")}
                 </a>
                 <div className="detailStats">
                   <div className="detailStat">
                     <span className="detailStatValue">{totalPoints}</span>
                     <span className="detailStatLabel">{t("col_points")}</span>
                   </div>
                   <div className="detailStat">
                     <span className="detailStatValue">{modeCount}</span>
                     <span className="detailStatLabel">{t("col_mode")}</span>
                   </div>
                 </div>
<div className="detailTiers">
                    {selectedPlayer.entries.map((entry, idx) => {
                      const baseColor = rankBadgeColor(entry.rank, entry.retired);
                      const pts = entry.points != null ? safeInt(entry.points, 0) : getPointsForElo(entry.rank);
                      const modeName = displayMode(entry.gamemode);
                      const displayRank = entry.retired ? `R${eloRankLabel(entry.rank)}` : eloRankLabel(entry.rank);
                      
                      // If viewing single-mode, show all entries; else filter to matching ones
                      const shouldShow = !singleModeFilter || singleModeFilter.some(m => entry.gamemode.toLowerCase().replace(/\s+/g, "") === m.toLowerCase());
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
<nav className="footerNav" aria-label={t("footer_pages")}>
             <a className="footerNavLink" href="https://render.crafty.gg">Crafty.gg</a>
             <a className="footerNavLink" href="https://modrinth.com/mod/neontierstagger">Mod</a>
             <a className="footerNavLink" href={DISCORD_INVITE} target="_blank" rel="noreferrer">Discord</a>
             <span className="footerDivider" aria-hidden="true">|</span>
              <a className="footerNavLink" href="/legacy">Legacy</a>
           </nav>
          <div className="footerLastUpdate">{t("footer_last_update")}</div>
        </footer>
        <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />


    </div>
  );
}
