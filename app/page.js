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

// Rank point values
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
  // flat mapping: tier number only (1-5), matching CSS variable usage
  const colors = {
    1: "#d5b355",
    2: "#888d95",
    3: "#b36830",
    4: "#514764",
    5: "#40384f",
  };
  return colors[tier] || "rgba(255,255,255,0.7)";
}

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rankBadgeColor(rank) {
  if (!rank) return "#888d95";
  const r = rank.toUpperCase();
  // LT tiers
  if (r === "LT1") return "#d5b355";
  if (r === "LT2") return "#888d95";
  if (r === "LT3") return "#b36830";
  if (r === "LT4") return "#514764";
  if (r === "LT5") return "#40384f";
  // HT tiers
  if (r === "HT1") return "#d5b355";
  if (r === "HT2") return "#a4b3c7";
  if (r === "HT3") return "#dd8849";
  if (r === "HT4") return "#b7aadf";
  if (r === "HT5") return "#6f6389";
  // RLT/RHT (special)
  if (r === "RLT1" || r === "RLT2" || r === "RHT2") return "#8f7cff";
  return "#888d95";
}

function safeInt(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function skinUrl(username) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(username)}/56`;
}

// ===== TIER BOARD MODAL =====

function TierPlayerCard({ player, rank }) {
  const badgeColor = rankBadgeColor(rank);
  const skin = `https://mc-heads.net/avatar/${encodeURIComponent(player.username)}/56`;

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
      <img className="modeTierSkin" alt={player.username} width={38} height={38} loading="lazy" decoding="async" referrerPolicy="no-referrer" src={skin} />
      <span className="modeTierName">{player.username}</span>
      <span className="modeTierRank">{rank}</span>
    </button>
  );
}

function TierColumn({ tier, players }) {
  const colors = {
    1: { accent: "#d5b355", surface: "rgba(213, 179, 85, 0.22)" },
    2: { accent: "#a4b3c7", surface: "rgba(164, 179, 199, 0.22)" },
    3: { accent: "#dd8849", surface: "rgba(221, 136, 73, 0.22)" },
    4: { accent: "#b7aadf", surface: "rgba(183, 170, 223, 0.22)" },
    5: { accent: "#6f6389", surface: "rgba(111, 99, 137, 0.22)" },
  }[tier];

  if (!colors) return null;

  // Unique SVG shape per tier (simple icons)
  const tierIcons = {
    1: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    2: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"/></svg>,
    3: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 7V17L12 22L20 17V7L12 2Z"/></svg>,
    4: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 9L12 22L22 9L12 2ZM12 5.5L18.5 10L12 14.5L5.5 10L12 5.5Z"/></svg>,
    5: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12h20L12 2z"/></svg>,
  }[tier];

  return (
    <section className="modeTierColumn" style={{
      '--column-accent': colors.accent,
      '--column-surface': colors.surface,
    }}>
      <header className="modeTierHead">
        <span className="modeTierHeadIcon">{tierIcons}</span>
        <span className="modeTierNumber">{tier}</span>
      </header>
      <div className="modeTierList">
        {players.map((p, i) => (
          <TierPlayerCard key={`${p.username}-${i}`} player={p} rank={p.rank} />
        ))}
      </div>
    </section>
  );
}

function TierBoardModal({ isOpen, mode, players, onClose }) {
  if (!isOpen || !mode || !players) return null;

  const tiers = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  players.forEach((p) => {
    const t = tierFromRank(p.rank);
    if (t && tiers[t]) tiers[t].push(p);
  });

  // Sort each tier by points descending
  Object.keys(tiers).forEach(t => {
    tiers[t].sort((a, b) => (b.points || 0) - (a.points || 0));
  });

  return (
    <div className="tierBoardModal" onClick={onClose}>
      <style jsx>{`
        .tierBoardModal {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.85);
          z-index: 9998;
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>
      <div className="tierBoardContent" onClick={(e) => e.stopPropagation()}>
        <div className="tierBoardHeader">
          <h2 className="tierBoardTitle">{displayMode(mode)} Ranglista</h2>
          <button className="tierBoardClose" onClick={onClose} aria-label="Bezárás">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modeBoard">
          {[1, 2, 3, 4, 5].map((t) => (
            tiers[t] && tiers[t].length > 0 && (
              <TierColumn key={t} tier={t} players={tiers[t]} />
            )
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====

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
      } catch {
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

    // Return list of player records with username, rank, and points
    return filtered.map(r => ({
      username: r.username,
      rank: r.rank,
      points: r.points,
    }));
  }, [tests, tierBoardMode]);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showTierBoard) {
        closeTierBoard();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showTierBoard]);

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
        key: i,
        emoji: EASTER_EGGS[i % EASTER_EGGS.length].emoji,
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

      {/* Navbar */}
      <header className="navbar">
        <nav className="navInner">
          <a className="navLogo" href="/">
            {EASTER_MODE ? "🐰 NeonTiers" : "NeonTiers"}
          </a>
          <ul className="navLinks">
            <li>
              <a className="navLink active" href="/">
                <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
                  <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
                </svg>
                Főoldal
              </a>
            </li>
            <li>
              <a className="navLink" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
                  <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
                </svg>
                Discord
              </a>
            </li>
          </ul>
          <span className="searchWrap">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
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

      {/* Main content */}
      <main className="mainWrap">
        <div className="mainCard">
          {/* Mode tabs */}
          <section className="tabRow">
            {MODE_LIST.map((m) => (
              <button
                key={m}
                className={`tabBtn ${activeMode === m ? "active" : ""}`}
                onClick={() => {
                  setActiveMode(m);
                  openTierBoard(m);
                }}
                aria-pressed={activeMode === m}
                type="button"
              >
                {MODE_ICONS[m] && (
                  <img className="tabIcon" src={MODE_ICONS[m]} alt={m} width={28} height={28} />
                )}
                <strong className="tabLabel">{m}</strong>
                {activeMode === m && <span className="tabActiveLine" />}
              </button>
            ))}
          </section>

          {/* Info bar */}
          <div className="infoBar">
            <span className="infoText">
              {activeMode === "Összes"
                ? "Minden gamemode összesítve"
                : displayMode(activeMode) + " gamemode ranglista"}
            </span>
          </div>

          {/* Column headers */}
          <div className="colHead">
            <span className="colHash">#</span>
            <span className="colPlayer">Játékos</span>
            <span className="colTiers">Tierek</span>
          </div>

          {/* Player rows */}
          {loading ? (
            <div className="emptyState">
              <div className="emptyTitle">Betöltés...</div>
              <div className="emptySub">Kérlek várj.</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="emptyState">
              <div className="emptyTitle">Nincs adat</div>
              <div className="emptySub">Még nincs mentett teszt eredmény.</div>
            </div>
          ) : (
            leaderboard.map((p, idx) => (
              <div key={p.username} className="playerRow">
                <span className="rowNum">{idx + 1}</span>
                <img
                  className="playerSkin"
                  src={skinUrl(p.username)}
                  alt={p.username}
                  width={44}
                  height={44}
                />
                <span className="playerName">{p.username}</span>
                <span className="rowTiers">
                   {p.entries.map((r) => {
                     const tier = tierFromRank(r.rank);
                     const baseColor = rankBadgeColor(r.rank);
                     const pts = safeInt(RANK_POINTS[r.rank] || r.points, 0);
                     return (
                       <span className="tierBadge" key={`${r.gamemode}:${r.rank}`}
                         style={{
                           '--tier-accent': baseColor,
                           '--tier-border': hexToRgba(baseColor, 0.78),
                           '--tier-surface': hexToRgba(baseColor, 0.22),
                           '--tier-text': baseColor,
                           color: baseColor,
                         }}
                         title={`${displayMode(r.gamemode)} ${r.rank} — ${pts} pont`}
                       >
                         {MODE_ICONS[displayMode(r.gamemode)] && (
                           <img className="tierIcon" src={MODE_ICONS[displayMode(r.gamemode)]} alt="" width={28} height={28} />
                         )}
                         <span className="tierLabel">{r.rank}</span>
                         <span className="tierTooltip">
                           {displayMode(r.gamemode)} {r.rank}
                           <span className="tierTooltipPts">{pts} pont</span>
                         </span>
                       </span>
                     );
                   })}
                </span>
              </div>
            ))
          )}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        :root {
          --bg: #0b0e14;
          --bg-panel: #0b0d11fa;
          --border: #ffffff14;
          --text: #fffffff0;
          --muted: #ffffff9e;
          --accent: #8f7cff;
        }

        * { box-sizing: border-box; }

        html, body {
          height: 100%; margin: 0; padding: 0;
          background: var(--bg); color: var(--text);
          font-family: "Montserrat", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizelegibility;
        }

        .page { min-height: 100vh; position: relative; }

        .bg {
          position: fixed; inset: 0;
          background: var(--bg); z-index: -1;
          pointer-events: none;
        }

        /* Navbar */
        .navbar {
          width: 100%; max-width: 1480px; margin: 0 auto;
          padding: 18px 20px 0;
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
          text-decoration: none; letter-spacing: -0.04em;
          flex-shrink: 0;
        }

        .navLinks {
          display: flex; gap: 8px; list-style: none; margin: 0; padding: 0;
          flex-shrink: 0;
        }

        .navLink {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; color: var(--muted);
          font-size: 15px; font-weight: 700; padding: 12px 16px;
          border-radius: 13px; transition: color 0.15s, background 0.15s;
        }

        .navLink:hover, .navLink.active {
          color: var(--text); background: rgba(255,255,255,0.06);
        }

        .searchWrap {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.08); border: none;
          border-radius: 999px; padding: 0 14px; height: 46px; color: var(--muted);
          flex-shrink: 0;
        }

        .searchInput {
          background: transparent; border: none; outline: none;
          color: var(--text); font-size: 15px; width: 100%;
          flex: 1; min-width: 0;
        }
        .searchInput::placeholder { color: #ffffff75; }

        .searchKbd {
          background: rgba(255,255,255,0.08); color: var(--muted);
          border-radius: 8px; flex-shrink: 0;
          padding: 4px 9px; font-size: 12px; font-weight: 800;
        }

        /* Main card */
        .mainWrap {
          max-width: 1480px; margin: 0 auto;
          padding: 0 20px;
          position: relative;
        }

        .mainCard {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 22px 28px 28px;
          margin-top: 68px;
          position: relative;
          box-shadow: 0 24px 72px #00000061;
          overflow: visible;
        }

        /* Mode tabs */
        .tabRow {
          position: absolute; bottom: 100%; left: 0; right: 0;
          display: flex; gap: 10px;
          overflow-x: auto; overflow-y: hidden;
          padding: 6px 0 0;
          scrollbar-width: none;
          align-items: flex-end;
        }
        .tabRow::-webkit-scrollbar { display: none; }

        .tabBtn {
          display: flex; flex-direction: column; align-items: center;
          justify-content: flex-end; gap: 6px;
          min-width: 96px; padding: 12px 10px 10px;
          cursor: pointer; user-select: none; position: relative;
          border: 1px solid #ffffff1a; border-bottom: none;
          border-radius: 18px 18px 0 0;
          background: #ffffff06; color: #ffffff8f;
          transition: color 0.15s, background 0.15s, border-color 0.15s;
        }
        .tabBtn:hover {
          color: var(--text); background: #ffffff0d; border-color: #ffffff2e;
        }
        .tabBtn.active {
          color: var(--text); background: var(--bg-panel);
          border-color: rgba(255,255,255,0.2);
        }
        .tabActiveLine {
          position: absolute; bottom: 0;
          left: 14px; right: 14px;
          height: 3px; background: #fff;
          border-radius: 999px;
        }
        .tabIcon { width: 28px; height: 28px; }
        .tabLabel {
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        /* Info bar */
        .infoBar {
          display: flex; align-items: center; justify-content: flex-end;
          margin-bottom: 16px; padding-top: 4px;
        }
        .infoText {
          font-size: 14px; font-weight: 700;
          color: var(--muted);
          letter-spacing: 0.11em; text-transform: uppercase;
        }

        /* Leaderboard table */
        .colHead {
          display: grid; grid-template-columns: 56px 68px minmax(180px,1fr) minmax(0,1.35fr);
          gap: 14px; padding: 10px 18px;
          font-size: 11px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.11em;
          color: var(--muted);
        }
        .colHash { text-align: center; }
        .colPlayer { grid-column: 3; text-align: left; }
        .colTiers { text-align: right; justify-self: end; padding-right: 6px; }

        .playerRow {
          display: grid; grid-template-columns: 56px 68px minmax(180px,1fr) minmax(0,1.35fr);
          gap: 14px; align-items: center;
          padding: 16px 18px; border-radius: 15px;
          background: #ffffff04; border: 1px solid #ffffff0f;
          margin-bottom: 9px;
          transition: border-color 0.15s, background 0.15s;
          position: relative; overflow: visible;
          text-align: left; width: 100%; color: inherit;
        }
        .playerRow:hover {
          background: #ffffff0a; border-color: #ffffff29;
          z-index: 4;
        }

        .rowNum {
          text-align: center; font-size: 21px; font-weight: 900;
          color: var(--muted);
        }

        .playerSkin {
          width: 64px; height: 64px; border-radius: 13px;
          image-rendering: pixelated;
          background: transparent;
          filter: drop-shadow(-4px 0 6px #0000002e);
          transform: translateY(4px);
        }

        .playerName {
          font-size: 22px; font-weight: 800; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .rowTiers {
          display: flex; flex-wrap: nowrap; gap: 11px;
          padding: 2px 4px;
          justify-content: flex-end; justify-self: stretch;
          width: 100%; min-width: 0; max-width: 100%;
          min-height: 82px;
          overflow: visible;
        }

        .tierBadge {
          isolation: isolate;
          background: transparent; border: none;
          flex-direction: column; align-items: center;
          gap: 1px; width: 42px; min-width: 42px;
          height: auto; padding: 0; display: inline-flex;
          position: relative; overflow: visible;
          text-align: center;
        }
        .tierBadge:hover { z-index: 30; }

        .tierIcon {
          box-sizing: border-box;
          border: 2px solid var(--tier-border);
          background: #141a24;
          border-radius: 999px;
          width: 41px; height: 41px; padding: 8px;
          box-shadow: inset 0 1px #ffffff08;
          display: flex; align-items: center; justify-content: center;
        }
        .tierIcon img { width: 100%; height: 100%; object-fit: contain; }

        .tierLabel {
          background: var(--tier-surface, #ffffff24);
          min-height: 19px; color: var(--tier-text);
          white-space: nowrap; letter-spacing: 0.03em;
          border: none; border-radius: 999px;
          display: inline-flex; justify-content: center; align-items: center;
          margin-top: -3px; padding: 0 7px;
          font-size: 12px; font-weight: 900; line-height: 1;
        }

        .tierTooltip {
          display: none;
          position: absolute; bottom: calc(100% + 8px); left: 50%;
          transform: translateX(-50%); white-space: nowrap;
          background: #11161ffa; border: 1px solid #ffffff1f;
          border-radius: 15px; padding: 10px 12px;
          color: var(--text); flex-direction: column; align-items: center; gap: 4px;
          min-width: 96px; box-shadow: 0 18px 40px #0000005c;
          pointer-events: none; z-index: 140;
        }
        .tierTooltipRank, .tierTooltipPts { color: var(--tier-accent); font-size: 14px; font-weight: 900; line-height: 1; }
        .tierTooltip span:not(.tierTooltipRank) { color: var(--muted); font-size: 12px; font-weight: 700; }
        .tierBadge:hover .tierTooltip { display: flex; }

        /* Empty state */
        .emptyState { padding: 64px 22px; text-align: center; }
        .emptyTitle { font-size: 20px; font-weight: 900; }
        .emptySub { color: var(--muted); margin-top: 10px; font-size: 15px; }

        /* Footer */
        .pageFooter {
          max-width: 1352px; margin: 80px auto 0;
          padding: 26px 16px; text-align: center;
        }
        .footerText { color: var(--muted); font-size: 15px; }

        /* Easter eggs */
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

        /* ===== TIER BOARD MODAL ===== */
        .tierBoardModal {
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
        }

        .tierBoardContent {
          background: #0b0d11fa;
          border: 1px solid #ffffff1f;
          border-radius: 24px;
          width: min(860px, calc(100vw - 40px));
          max-height: calc(100vh - 60px);
          position: relative;
          overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 28px 90px #00000075;
          animation: modalSlideIn 0.25s ease;
        }

        .tierBoardHeader {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 28px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }

        .tierBoardTitle {
          font-size: 22px; font-weight: 800; color: var(--text);
          margin: 0;
        }

        .tierBoardClose {
          position: absolute; top: 16px; right: 16px;
          width: 40px; height: 40px;
          border: none; border-radius: 999px;
          background: #ffffff14; color: #ffffffc2;
          cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .tierBoardClose:hover { color: var(--text); background: #ffffff1f; }
        .tierBoardClose svg { width: 18px; height: 18px; }

        .modeBoard {
          display: grid;
          grid-template-columns: repeat(5, minmax(180px, 1fr));
          gap: 10px;
          padding: 2px 2px 8px;
          overflow-x: auto;
          background: transparent;
        }
        .modeBoard::-webkit-scrollbar { display: none; }
        .modeBoard { scrollbar-width: none; }

        .modeTierColumn {
          min-width: 180px;
          background: #ffffff07;
          border: 1px solid #ffffff12;
          border-radius: 16px;
          overflow: hidden;
          display: flex; flex-direction: column;
          content-visibility: auto; contain-intrinsic-size: 400px;
        }

        .modeTierHead {
          display: flex; align-items: center; gap: 8px;
          justify-content: center;
          padding: 0 14px;
          min-height: 48px;
          background: var(--column-surface);
          color: var(--column-accent);
          font-size: 16px; font-weight: 900;
          letter-spacing: -0.02em;
          border-bottom: 1px solid #ffffff0f;
        }
        .modeTierHeadIcon {
          flex-shrink: 0; width: 20px; height: 20px;
          fill: currentColor;
        }
        .modeTierNumber {
          font-size: 20px; font-weight: 900;
          letter-spacing: -0.02em;
        }

        .modeTierList {
          display: flex; flex-direction: column; gap: 1px;
          padding: 8px;
          overflow-y: auto;
          max-height: 60vh;
        }

        .modeTierPlayer {
          display: grid;
          grid-template-columns: 38px minmax(0,1fr) auto;
          align-items: center; gap: 10px;
          width: 100%; padding: 8px 12px;
          background: var(--mode-player-surface, #ffffff08);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 8px;
          border-bottom: none; border-left: none; border-right: none;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          position: relative; color: var(--text);
          font-size: 15px; font-weight: 800;
          min-height: 54px;
        }
        .modeTierPlayer:hover {
          background: var(--mode-player-surface-hover, #ffffff0e);
          border-color: var(--player-rank-border);
        }
        .modeTierPlayer:before {
          content: "";
          background: var(--player-accent);
          width: 3px; position: absolute;
          top: 0; bottom: 0; left: 0;
        }

        .modeTierSkin {
          width: 38px; height: 38px; border-radius: 6px;
          image-rendering: pixelated;
          flex-shrink: 0;
          filter: drop-shadow(-3px 0 4px #00000029);
          background: transparent;
        }

        .modeTierName {
          flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
        }

        .modeTierRank {
          font-size: 11px; font-weight: 900;
          color: var(--player-rank-text);
          background: var(--player-rank-surface);
          border: 1px solid var(--player-rank-border);
          border-radius: 999px;
          padding: 0 8px; min-width: 40px; min-height: 24px;
          display: inline-flex; justify-content: center; align-items: center;
          flex-shrink: 0;
        }

        /* Responsive */
        @media (max-width: 1180px) {
          .colHead, .playerRow {
            grid-template-columns: 56px 56px minmax(180px,1fr);
          }
          .colTiers, .rowTiers { display: none; }
          .playerDetail { padding: 22px 24px; }
        }
        @media (max-width: 980px) {
          .navbar, .mainWrap, .pageFooter {
            padding-left: 14px; padding-right: 14px;
          }
          .navbar { padding-top: 14px; }
          .navLogoMark { height: 21px; }
          .searchWrap { border-radius: 999px; width: 100%; min-height: 46px; }
          .mainCard { border-radius: 22px; padding: 16px 14px 18px; }
          .tabBtn { border-radius: 16px 16px 0 0; min-width: 84px; padding: 10px 9px 9px; }
          .tabRow { justify-content: flex-start; gap: 8px; min-width: max-content; }
          .tabIcon { width: 24px; height: 24px; }
          .tabLabel { font-size: 9px; letter-spacing: 0.03em; }
          .playerDetail { flex-direction: column; gap: 16px; }
          .detailTiers { flex-wrap: wrap; }
          .tierBoardContent { max-width: 100vw; max-height: 85vh; }
        }
        @media (max-width: 760px) {
          .navbar, .mainWrap, .pageFooter { padding-left: 10px; padding-right: 10px; }
          .tabsWrap { margin: 40px auto -1px; padding-top: 10px; }
          .tabBtn { min-width: 76px; padding: 9px 8px 8px; }
          .tabLabel { font-size: 8px; }
        }
      `}</style>
    </div>
  );
}
