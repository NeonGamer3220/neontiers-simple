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
  if (r === "LT1") return "#d5b355";
  if (r === "LT2") return "#888d95";
  if (r === "LT3") return "#b36830";
  if (r === "LT4") return "#514764";
  if (r === "LT5") return "#40384f";
  if (r === "HT1") return "#d5b355";
  if (r === "HT2") return "#a4b3c7";
  if (r === "HT3") return "#dd8849";
  if (r === "HT4") return "#b7aadf";
  if (r === "HT5") return "#6f6389";
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

export default function Page() {
  const [activeMode, setActiveMode] = useState("Összes");
  const [query, setQuery] = useState("");
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

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
                onClick={() => setActiveMode(m)}
                aria-pressed={activeMode === m}
                type="button"
              >
                {MODE_ICONS[m] && (
                  <img className="tabIcon" src={MODE_ICONS[m]} alt={m} width={28} height={28} />
                )}
                <strong className="tabLabel">{m}</strong>
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
                  width={48}
                  height={48}
                />
                <div className="playerInfo">
                  <span className="playerName">{p.username}</span>
                  <span className="playerPoints">{p.total} pont</span>
                </div>
                <div className="tierBadges">
                  {p.entries.map((r) => {
                    const baseColor = rankBadgeColor(r.rank);
                    const pts = safeInt(RANK_POINTS[r.rank] || r.points, 0);
                    return (
                      <span className="badge" key={`${r.gamemode}:${r.rank}`} style={{
                        '--tier-accent': baseColor,
                        '--tier-border': hexToRgba(baseColor, 0.78),
                        '--tier-surface': hexToRgba(baseColor, 0.22),
                        '--tier-text': baseColor,
                      }}>
                        {MODE_ICONS[displayMode(r.gamemode)] && (
                          <img className="badgeIcon" src={MODE_ICONS[displayMode(r.gamemode)]} alt="" width={24} height={24} />
                        )}
                        <span className="badgeRank">{r.rank}</span>
                        <span className="badgePoints">{pts} pont</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="pageFooter">
        <div className="footerText">NeonTiers © {new Date().getFullYear()}</div>
      </footer>

      <style jsx global>{`
        :root {
          --bg: #09090b;
          --bg-panel: #0a0a0f;
          --border: rgba(255,255,255,0.08);
          --text: #ffffff;
          --muted: rgba(255,255,255,0.45);
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
          width: 100%; max-width: 1100px; margin: 0 auto;
          padding: 18px 16px 0;
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
        .searchInput::placeholder { color: rgba(255,255,255,0.5); }

        .searchKbd {
          background: rgba(255,255,255,0.08); color: var(--muted);
          border-radius: 8px; flex-shrink: 0;
          padding: 4px 9px; font-size: 12px; font-weight: 800;
        }

        /* Main card */
        .mainWrap {
          max-width: 1100px; margin: 0 auto;
          padding: 0 16px;
          position: relative;
        }

        .mainCard {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px 24px;
          margin-top: 20px;
          box-shadow: 0 24px 72px rgba(0,0,0,0.4);
        }

        /* Mode tabs */
        .tabRow {
          display: flex; gap: 6px;
          overflow-x: auto; scrollbar-width: none;
          padding: 4px 0 0;
          align-items: flex-end;
          border-bottom: 1px solid var(--border);
          margin-bottom: 12px;
        }
        .tabRow::-webkit-scrollbar { display: none; }

        .tabBtn {
          display: flex; flex-direction: column; align-items: center;
          justify-content: flex-end; gap: 6px;
          min-width: 88px; padding: 12px 10px 10px;
          cursor: pointer; border: none; border-bottom: 2px solid transparent;
          border-radius: 12px 12px 0 0;
          background: transparent; color: var(--muted);
          transition: color 0.15s, background 0.15s;
        }
        .tabBtn:hover {
          color: var(--text); background: rgba(255,255,255,0.06);
        }
        .tabBtn.active {
          color: var(--text);
          border-bottom-color: var(--accent);
          background: rgba(255,255,255,0.04);
        }
        .tabIcon { width: 28px; height: 28px; }
        .tabLabel {
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.04em; white-space: nowrap;
        }

        /* Info bar */
        .infoBar {
          display: flex; justify-content: flex-end;
          margin-bottom: 12px; padding-top: 4px;
        }
        .infoText {
          font-size: 14px; font-weight: 700;
          color: var(--muted);
          letter-spacing: 0.11em; text-transform: uppercase;
        }

        /* Leaderboard */
        .leaderboard {
          display: flex; flex-direction: column; gap: 6px;
        }

        .playerRow {
          display: grid;
          grid-template-columns: 50px 56px 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: background 0.15s, border-color 0.15s;
        }
        .playerRow:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.12);
        }

        .rowNum {
          text-align: center; font-size: 18px; font-weight: 800;
          color: var(--muted);
        }

        .playerSkin {
          width: 48px; height: 48px; border-radius: 8px;
          image-rendering: pixelated;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }

        .playerInfo {
          display: flex; flex-direction: column; gap: 2px;
          min-width: 0;
        }
        .playerName {
          font-size: 18px; font-weight: 800; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .playerPoints {
          font-size: 13px; color: var(--muted); font-weight: 700;
        }

        .tierBadges {
          display: flex; flex-wrap: wrap; gap: 6px;
          justify-content: flex-end; align-items: center;
        }

        .badge {
          display: inline-flex;
          flex-direction: column; align-items: center;
          gap: 2px;
          padding: 6px 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          min-width: 48px;
          transition: transform 0.1s, box-shadow 0.1s;
          position: relative;
        }
        .badge:hover {
          z-index: 10; transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          border-color: var(--tier-accent);
        }
        .badgeIcon {
          width: 24px; height: 24px;
          /* border: 2px solid var(--tier-border); */
          /* background: #141a24; */
          border-radius: 999px;
          display: flex; align-items: center; justify-content: center;
        }
        .badgeRank {
          font-size: 11px; font-weight: 900;
          color: var(--tier-accent);
          background: var(--tier-surface);
          border: 1px solid var(--tier-border);
          border-radius: 999px;
          padding: 0 6px; min-height: 18px; line-height: 1;
          display: inline-flex; justify-content: center; align-items: center;
        }
        .badgePoints {
          font-size: 9px; color: var(--muted);
        }

        /* Empty state */
        .emptyState { padding: 48px 24px; text-align: center; }
        .emptyTitle { font-size: 18px; font-weight: 800; color: var(--text); }
        .emptySub { margin-top: 8px; font-size: 14px; color: var(--muted); }

        /* Footer */
        .pageFooter {
          max-width: 1100px; margin: 80px auto 0;
          padding: 24px 16px; text-align: center;
        }
        .footerText { color: var(--muted); font-size: 14px; }

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

        /* Responsive */
        @media (max-width: 768px) {
          .playerRow {
            grid-template-columns: 40px 44px 1fr;
          }
          .tierBadges {
            grid-column: 3;
            margin-top: 8px;
          }
          .rowNum { font-size: 16px; }
          .playerSkin { width: 40px; height: 40px; }
          .playerName { font-size: 16px; }
          .playerPoints { font-size: 12px; }
          .badge { padding: 4px 6px; min-width: 40px; }
          .badgeIcon { width: 20px; height: 20px; }
          .badgeRank { font-size: 10px; }
          .badgePoints { font-size: 8px; }
        }
        @media (max-width: 480px) {
          .navbar, .mainWrap, .pageFooter { padding-left: 10px; padding-right: 10px; }
          .tabBtn { min-width: 76px; padding: 9px 8px 8px; }
          .tabLabel { font-size: 8px; }
          .playerRow {
            grid-template-columns: 32px 36px 1fr;
            gap: 8px; padding: 8px;
          }
          .playerSkin { width: 32px; height: 32px; }
        }
      `}</style>
    </div>
  );
}
