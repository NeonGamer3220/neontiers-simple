"use client";

import React, { useEffect, useMemo, useState } from "react";

const DISCORD_INVITE = "https://discord.gg/7fanAQDxaN";

const EASTER_MODE = false;
const EASTER_EGGS = [
  { emoji: "🥚" }, { emoji: "🐣" }, { emoji: "🐰" }, { emoji: "🌷" },
  { emoji: "🦋" }, { emoji: "🌼" }, { emoji: "🐇" }, { emoji: "🌸" },
];

const MODE_LIST = [
  "Összes", "Vanilla", "UHC", "Pot", "NethPot", "SMP",
  "Sword", "Axe", "Mace", "Cart", "Creeper", "DiaSMP",
  "OGVanilla", "ShieldlessUHC", "SpearMace", "SpearElytra", "Stickfight",
];

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
   "Stickfight": "/images/stickfight.png",
 };

const MODE_DISPLAY_MAP = {
   "vanilla": "Vanilla", "uhc": "UHC", "pot": "Pot", "nethpot": "NethPot",
   "smp": "SMP", "sword": "Sword", "axe": "Axe", "mace": "Mace",
   "cart": "Cart", "creeper": "Creeper", "diasmp": "DiaSMP",
   "ogvanilla": "OGVanilla", "shieldlessuhc": "ShieldlessUHC",
   "spearmace": "SpearMace", "spearelytra": "SpearElytra",
   "stickfight": "Stickfight",
 };

function displayMode(mode) {
  if (!mode) return "";
  const key = mode.toLowerCase().replace(/\s+/g, "");
  return MODE_DISPLAY_MAP[key] || mode || "";
}

// Tier icons as SVG components
const TierIcon = ({ tier, width = 22, height = 22 }) => {
  const icons = {
    1: ( // Gold star for Tier 1
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    2: ( // Silver shield for Tier 2
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/>
      </svg>
    ),
    3: ( // Bronze hexagon for Tier 3
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z"/>
      </svg>
    ),
    4: ( // Purple gem for Tier 4
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 9L12 22L22 9L12 2ZM12 5.5L18.5 10L12 14.5L5.5 10L12 5.5Z"/>
      </svg>
    ),
    5: ( // Blue diamond for Tier 5
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 12L12 22L22 12L12 2ZM12 6L18.5 12L12 18L5.5 12L12 6Z"/>
      </svg>
    ),
  };
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor">
      {icons[tier]}
    </svg>
  );
};

// Rank badge color mapping based on rank type
function rankBadgeColor(rank) {
  if (!rank) return "#888d95";
  const r = rank.toUpperCase();
  if (r === "HT1" || r === "LT1") return "#d5b355";
  if (r === "HT2") return "#a4b3c7";
  if (r === "LT2") return "#888d95";
  if (r === "RHT2" || r === "RLT2") return "#8f7cff";
  if (r === "HT3") return "#dd8849";
  if (r === "LT3") return "#b36830";
  if (r === "HT4") return "#b7aadf";
  if (r === "HT5") return "#6f6389";
  return "#888d95";
}

// Tier column colors
const TIER_COLORS = {
  1: { accent: "#ffcf4a", surface: "rgba(255, 207, 74, 0.22)" },
  2: { accent: "#a4b3c7", surface: "rgba(164, 179, 199, 0.22)" },
  3: { accent: "#dd8849", surface: "rgba(221, 136, 73, 0.22)" },
  4: { accent: "#b7aadf", surface: "rgba(183, 170, 223, 0.14)" },
  5: { accent: "#6f6389", surface: "rgba(111, 99, 137, 0.14)" },
};

// Tier display names
const TIER_NAMES = {
  1: "Tier 1",
  2: "Tier 2",
  3: "Tier 3",
  4: "Tier 4",
  5: "Tier 5",
};

// Modal backdrop component
function ModalBackdrop({ onClose }) {
  return (
    <div className="tierBoardBackdrop" onClick={onClose}>
      <style jsx>{`
        .tierBoardBackdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          z-index: 9998;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Single player card for tier board
function TierPlayerCard({ player, rank }) {
  const badgeColor = rankBadgeColor(rank);
  const skinUrl = `https://mc-heads.net/avatar/${encodeURIComponent(player.username)}/56`;

  return (
    <button className="modeTierPlayer" type="button" aria-haspopup="dialog" aria-expanded="false"
      style={{
        '--player-accent': badgeColor,
        '--mode-player-surface': 'rgba(255, 255, 255, 0.018)',
        '--mode-player-surface-hover': 'rgba(255, 255, 255, 0.035)',
        '--player-rank-surface': `${badgeColor}33`,
        '--player-rank-border': `${badgeColor}44`,
        '--player-rank-text': badgeColor,
      }}
    >
      <img
        className="modeTierSkin"
        alt={player.username}
        width={38}
        height={38}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        src={skinUrl}
      />
      <span className="modeTierName">{player.username}</span>
      <span className="modeTierRank">{rank}</span>
    </button>
  );
}

// Single tier column
function TierColumn({ tier, players }) {
  const colors = TIER_COLORS[tier];
  if (!colors) return null;

  return (
    <section
      className="modeTierColumn"
      style={{
        '--column-accent': colors.accent,
        '--column-surface': colors.surface,
      }}
    >
      <header className="modeTierHead">
        <TierIcon tier={tier} />
        <span>{TIER_NAMES[tier]}</span>
      </header>
      <div className="modeTierList">
        {players.map((player, idx) => (
          <TierPlayerCard
            key={`${player.username}-${player.rank}-${idx}`}
            player={player}
            rank={player.rank}
          />
        ))}
      </div>
    </section>
  );
}

// Main Tier Board Modal
function TierBoardModal({ isOpen, mode, players, onClose }) {
  if (!isOpen || !mode || !players) return null;

  // Group players by tier
  const tiers = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  players.forEach((player) => {
    const tier = tierFromRank(player.rank);
    if (tier && tiers[tier]) {
      tiers[tier].push(player);
    }
  });

  return (
    <div className="tierBoardModal">
      <ModalBackdrop onClose={onClose} />
      <div className="tierBoardContent">
        <div className="tierBoardHeader">
          <h2 className="tierBoardTitle">{displayMode(mode)} Ranglista</h2>
          <button className="tierBoardClose" onClick={onClose} aria-label="Bezárás">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modeBoard">
          {[1, 2, 3, 4, 5].map((tier) => (
            tiers[tier] && tiers[tier].length > 0 && (
              <TierColumn key={tier} tier={tier} players={tiers[tier]} modeName={mode} />
            )
          ))}
        </div>
      </div>
    </div>
  );
}
 const RANK_POINTS = {
    LT5: 1, HT5: 2, LT4: 3, HT4: 4,
    LT3: 6, HT3: 10, LT2: 16, HT2: 28,
    LT1: 40, HT1: 60,
  };

function tierFromRank(rank) {
  if (!rank || typeof rank !== "string") return null;
  const m = rank.match(/([LH]T)([1-5])/i);
  if (!m) return null;
  return Number(m[2]);
}

function tierColor(tier) {
  switch (tier) {
    case 1: return "#FFD86B";
    case 2: return "#E7EEF8";
    case 3: return "#D7A67A";
    case 4: return "#B58CFF";
    case 5: return "#63B6FF";
    default: return "rgba(255,255,255,0.7)";
  }
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
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [tierBoardMode, setTierBoardMode] = useState(null);
  const [showTierBoard, setShowTierBoard] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/tests", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        setTests(Array.isArray(data?.tests) ? data.tests : []);
      } catch (e) {
        if (!alive) return;
        setTests([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, []);

   const leaderboard = useMemo(() => {
     const rows = tests
       .map((r) => ({
         id: r?.id,
         username: String(r?.username || "").trim(),
         gamemode: String(r?.gamemode || "").trim(),
         rank: String(r?.rank || "").trim(),
         points: r?.points != null
           ? safeInt(r.points, 0)
           : safeInt(RANK_POINTS[String(r?.rank || "").trim()] || 0, 0),
         created_at: r?.created_at ? String(r.created_at) : "",
       }))
       .filter((r) => r.username && r.gamemode && r.rank);

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
     const filteredByMode = activeMode === "Összes"
       ? latestRows
       : latestRows.filter((r) => r.gamemode.toLowerCase() === activeMode.toLowerCase());

     const byUser = new Map();
     for (const r of filteredByMode) {
       if (!byUser.has(r.username)) byUser.set(r.username, []);
       byUser.get(r.username).push(r);
     }

     const players = Array.from(byUser.entries()).map(([username, entries]) => {
       entries.sort((a, b) => a.gamemode.localeCompare(b.gamemode));
       const total = entries.reduce((sum, e) => sum + safeInt(e.points, 0), 0);
       return { username, entries, total };
     });

     const q = query.trim().toLowerCase();
     const searched = !q ? players : players.filter((p) => p.username.toLowerCase().includes(q));
     searched.sort((a, b) => b.total !== a.total ? b.total - a.total : a.username.localeCompare(b.username));
     return searched;
   }, [tests, activeMode, query]);

   // Compute players for a specific mode (for tier board)
   const modePlayers = useMemo(() => {
     if (!tierBoardMode) return [];
     const rows = tests
       .map((r) => ({
         id: r?.id,
         username: String(r?.username || "").trim(),
         gamemode: String(r?.gamemode || "").trim(),
         rank: String(r?.rank || "").trim(),
         points: r?.points != null
           ? safeInt(r.points, 0)
           : safeInt(RANK_POINTS[String(r?.rank || "").trim()] || 0, 0),
         created_at: r?.created_at ? String(r.created_at) : "",
       }))
       .filter((r) => r.username && r.gamemode && r.rank);

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
     const filtered = tierBoardMode === "Összes"
       ? latestRows
       : latestRows.filter((r) => r.gamemode.toLowerCase() === tierBoardMode.toLowerCase());

     // Return list of player records with username and rank
     return filtered.map(r => ({
       username: r.username,
       rank: r.rank,
     }));
   }, [tests, tierBoardMode]);

   const openTierBoard = (mode) => {
     setTierBoardMode(mode);
     setShowTierBoard(true);
   };

   const closeTierBoard = () => {
     setShowTierBoard(false);
     setTimeout(() => setTierBoardMode(null), 300);
   };

   // Add keyboard listener for Escape key
   useEffect(() => {
     const handleKeyDown = (e) => {
       if (e.key === "Escape" && showTierBoard) {
         closeTierBoard();
       }
     };
     window.addEventListener("keydown", handleKeyDown);
     return () => window.removeEventListener("keydown", handleKeyDown);
   }, [showTierBoard]);

   // Lock body scroll when modal open
   useEffect(() => {
     if (showTierBoard) {
       document.body.style.overflow = "hidden";
     } else {
       document.body.style.overflow = "";
     }
     return () => { document.body.style.overflow = ""; };
   }, [showTierBoard]);

  const floatingEggs = EASTER_MODE
    ? Array.from({ length: 18 }, (_, i) => ({
        key: i, emoji: EASTER_EGGS[i % EASTER_EGGS.length].emoji,
        style: {
          left: `${5 + (i * 5.2) % 90}%`,
          animationDelay: `${(i * 0.7) % 6}s`,
          animationDuration: `${6 + (i % 5) * 1.5}s`,
          fontSize: `${18 + (i % 3) * 8}px`,
        },
      }))
    : [];

   return (
     <div className="page">
       <div className="bg" />

       {EASTER_MODE && (
         <div className="easterEggsContainer">
           {floatingEggs.map((egg) => (
             <span key={egg.key} className="floatingEgg" style={egg.style}>{egg.emoji}</span>
           ))}
         </div>
       )}

       <div style={{ paddingTop: "1rem" }} />

       {/* Navbar */}
       <header className="navbar">
         <nav className="navInner">
           <a className="navLogo" href="/">
             {EASTER_MODE ? "🐰 NeonTiers" : "NeonTiers"}
           </a>
           <ul className="navLinks">
             <li>
               <a className="navLink active" href="/">
                 <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/></svg>
                 Főoldal
               </a>
             </li>
             <li>
               <a className="navLink" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
                 <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/></svg>
                 Discord
               </a>
             </li>
           </ul>
           <span className="searchWrap">
             <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"/></svg>
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

       {/* Main card with mode tabs */}
       <main className="mainWrap">
         <div className="mainCard">
           {/* Mode tabs - clicking opens tier board modal */}
          <section className="tabRow">
            {MODE_LIST.map((m) => (
              <a
                key={m}
                className={`tabBtn ${activeMode === m ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveMode(m);
                  // Only open tier board for specific game modes, not "Összes"
                  if (m !== "Összes") {
                    openTierBoard(m);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                 {MODE_ICONS[m] && (
                   <img className="tabIcon" src={MODE_ICONS[m]} alt={m} width={24} height={24} />
                 )}
                 <strong className="tabLabel">{m}</strong>
                 {activeMode === m && <span className="tabActiveLine" />}
               </a>
             ))}
           </section>

           {/* Info bar showing current mode */}
           <div className="infoBar">
             <span className="infoText">
               {EASTER_MODE ? "🐰 " : ""}
               {activeMode === "Összes"
                 ? "Minden gamemode összesítve"
                 : displayMode(activeMode) + " gamemode ranglista"}
             </span>
           </div>
         </div>
       </main>

       {/* Tier Board Modal */}
       <TierBoardModal
         isOpen={showTierBoard}
         mode={tierBoardMode}
         players={modePlayers}
         onClose={closeTierBoard}
       />

       <footer className="pageFooter">
        <div className="footerText">NeonTiers © {new Date().getFullYear()}</div>
      </footer>

      <style jsx global>{`
        :root {
          --bg: #09090b;
          --card: #0a0a0f;
          --border: rgba(255,255,255,0.08);
          --text: rgba(255,255,255,0.87);
          --muted: rgba(255,255,255,0.45);
          --accent: rgba(139,92,246,0.5);
        }

        * { box-sizing: border-box; }

        html, body {
          height: 100%; margin: 0; padding: 0;
          background: var(--bg); color: var(--text);
          font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .page { min-height: 100vh; position: relative; }

        .bg {
          position: fixed; inset: 0; background: var(--bg); z-index: -1;
        }

        /* ===== NAVBAR ===== */
        .navbar {
          width: 100%; max-width: 1352px; margin: 1rem auto 0; padding: 0 16px;
        }

        .navInner {
         height: 64px; display: flex; align-items: center;
          justify-content: space-between; gap: 24px;
          padding: 0 28px;
          background: rgba(10,10,15,0.9);
          border: 1px solid var(--border); border-radius: 12px;
        }

        .navLogo {
        font-size: 20px; font-weight: 700; color: var(--text);
          text-decoration: none; letter-spacing: -0.02em;
          flex-shrink: 0;
        }

        .navLinks {
        display: flex; gap: 4px; list-style: none; margin: 0; padding: 0;
          flex-shrink: 0;
        }

        .navLink {
        display: flex; align-items: center; gap: 8px;
          text-decoration: none; color: var(--muted);
          font-size: 15px; font-weight: 500; padding: 8px 14px;
          border-radius: 6px; transition: color 0.15s, background 0.15s;
        }

        .navLink:hover, .navLink.active {
          color: var(--text); background: rgba(255,255,255,0.06);
        }

        .searchWrap {
        display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04); border: 1px solid var(--border);
          border-radius: 8px; padding: 0 12px; height: 40px; color: var(--muted);
          flex-shrink: 0;
        }

        .searchInput {
          background: transparent; border: none; outline: none;
           color: var(--text); font-size: 14px; width: 180px;
          flex: 1; min-width: 0;
        }

        .searchKbd {
          background: rgba(255,255,255,0.08); color: var(--muted);
          font-size: 12px; font-family: inherit; padding: 3px 8px;
          border-radius: 4px; font-weight: 600;
        }

        /* ===== MAIN CARD ===== */
        .mainWrap {
          max-width: 1352px; margin: 0 auto; padding: 0 16px;
          position: relative;
        }

        .mainCard {
          background: var(--card); border: 2px solid var(--border);
          border-radius: 12px; padding: 12px 32px 20px;
          margin-top: 116px; position: relative;
        }

        /* ===== MODE TABS ===== */
        .tabRow {
          position: absolute; bottom: 100%; left: 0; right: 0;
          display: flex; gap: 2px; overflow-x: auto;
          overflow-y: hidden; padding-bottom: 0;
          scrollbar-width: none;
        }

        .tabRow::-webkit-scrollbar { display: none; }

        .tabBtn {
          display: flex; flex-direction: column; align-items: center;
          justify-content: flex-end; gap: 3px; padding: 6px 8px;
          min-width: 72px; text-decoration: none; cursor: pointer;
          user-select: none; position: relative;
          border: 2px solid transparent; border-bottom: none;
          border-radius: 18px 18px 0 0; background: transparent;
          color: rgba(255,255,255,0.25); transition: all 0.15s;
          transform: translateY(0px); flex-shrink: 0;
        }

        .tabBtn:hover {
          color: var(--text); background: rgba(255,255,255,0.04);
        }

        .tabBtn.active {
          background: rgba(139,92,246,0.15); color: var(--text);
          border-color: var(--border);
        }

        .tabActiveLine {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: white; border-radius: 1px;
        }

        .tabIcon {
          width: 24px; height: 24px;
        }

        .tabLabel {
          font-size: 10px; font-weight: 700; text-transform: capitalize;
          white-space: nowrap;
        }

        /* ===== INFO BAR ===== */
        .infoBar {
          display: flex; align-items: center; justify-content: flex-end;
          margin-bottom: 16px; padding-top: 4px;
        }

        .infoText {
          font-size: 14px; font-weight: 600; color: var(--muted);
        }

        /* ===== EMPTY STATE ===== */
        .emptyState { padding: 48px 24px; text-align: center; }
        .emptyTitle { font-size: 16px; font-weight: 700; color: var(--text); }
        .emptySub { margin-top: 6px; font-size: 13px; color: var(--muted); }

        /* ===== FOOTER ===== */
        .pageFooter {
          max-width: 1352px; margin: 80px auto 0; padding: 32px 16px; text-align: center;
        }
        .footerText { font-size: 14px; color: var(--muted); }

        /* Easter */
        .easterEggsContainer {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
        }
        .floatingEgg {
          position: absolute; bottom: -40px;
          animation: floatUp linear infinite; opacity: 0.25;
        }
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.25; }
          90% { opacity: 0.25; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }

         /* Responsive */
         @media (max-width: 768px) {
           .navLinks { display: none; }
           .searchInput { width: 100px; }
           .tabBtn { min-width: 72px; padding: 6px 10px; }
           .tabIcon { width: 24px; height: 24px; }
           .tabLabel { font-size: 10px; }
           .mainCard { padding: 8px 16px 16px; }
           .tierBoardContent { max-width: 100vw; max-height: 85vh; }
         }
      `}</style>
    </div>
  );
}