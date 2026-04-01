"use client";

import React, { useEffect, useMemo, useState } from "react";

const DISCORD_INVITE = "https://discord.gg/7fanAQDxaN";

// =========================
// EASTER THEME 🐣
// =========================
const EASTER_MODE = true;

const EASTER_EGGS = [
  { emoji: "🥚", color: "#FFB6C1" },
  { emoji: "🐣", color: "#FFEAA7" },
  { emoji: "🐰", color: "#DDA0DD" },
  { emoji: "🌷", color: "#FF69B4" },
  { emoji: "🦋", color: "#87CEEB" },
  { emoji: "🌼", color: "#FFD700" },
  { emoji: "🐇", color: "#E6E6FA" },
  { emoji: "🌸", color: "#FFB7C5" },
];

// Gamemodes
const MODE_LIST = [
  "Összes",
  "Vanilla",
  "UHC",
  "Pot",
  "NethPot",
  "SMP",
  "Sword",
  "Axe",
  "Mace",
  "Cart",
  "Creeper",
  "DiaSMP",
  "OGVanilla",
  "ShieldlessUHC",
  "SpearMace",
  "SpearElytra",
];

// Gamemode abbreviations for compact display
const MODE_ABBR = {
  "Összes": "All",
  "Vanilla": "Van",
  "UHC": "UHC",
  "Pot": "Pot",
  "NethPot": "Neth",
  "SMP": "SMP",
  "Sword": "Swd",
  "Axe": "Axe",
  "Mace": "Mce",
  "Cart": "Cart",
  "Creeper": "Creep",
  "DiaSMP": "Dia",
  "OGVanilla": "OG",
  "ShieldlessUHC": "sUHC",
  "SpearMace": "SpMce",
  "SpearElytra": "SpEly",
};

// Rank -> tier number + points
const RANK_POINTS = {
  LT5: 1, HT5: 2, LT4: 3, HT4: 4,
  LT3: 6, HT3: 8, LT2: 10, HT2: 12,
  LT1: 14, HT1: 18,
};

function tierFromRank(rank) {
  if (!rank || typeof rank !== "string") return null;
  const m = rank.match(/([LH]T)([1-5])/i);
  if (!m) return null;
  return Number(m[2]);
}

// Tier colors matching mctiers.com style
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

export default function Page() {
  const [activeMode, setActiveMode] = useState("Összes");
  const [query, setQuery] = useState("");
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tests from API
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/tests", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        const list = Array.isArray(data?.tests) ? data.tests : [];
        setTests(list);
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

  // Build leaderboard
  const leaderboard = useMemo(() => {
    const rows = tests
      .map((r) => ({
        id: r?.id,
        username: String(r?.username || "").trim(),
        gamemode: String(r?.gamemode || "").trim(),
        rank: String(r?.rank || "").trim(),
        points:
          r?.points != null
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
    const filteredByMode =
      activeMode === "Összes"
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
    const searched = !q
      ? players
      : players.filter((p) => p.username.toLowerCase().includes(q));

    searched.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.username.localeCompare(b.username);
    });

    return searched;
  }, [tests, activeMode, query]);

  // Easter floating eggs
  const floatingEggs = EASTER_MODE
    ? Array.from({ length: 18 }, (_, i) => {
        const egg = EASTER_EGGS[i % EASTER_EGGS.length];
        return {
          key: i, emoji: egg.emoji,
          style: {
            left: `${5 + (i * 5.2) % 90}%`,
            animationDelay: `${(i * 0.7) % 6}s`,
            animationDuration: `${6 + (i % 5) * 1.5}s`,
            fontSize: `${18 + (i % 3) * 8}px`,
          },
        };
      })
    : [];

  return (
    <div className="page">
      <div className="bg" />

      {/* Easter floating eggs */}
      {EASTER_MODE && (
        <div className="easterEggsContainer">
          {floatingEggs.map((egg) => (
            <span key={egg.key} className="floatingEgg" style={egg.style}>
              {egg.emoji}
            </span>
          ))}
        </div>
      )}

      {/* Top spacer */}
      <div style={{ paddingTop: "2rem" }} />

      {/* Header / Nav bar */}
      <header className="navbar">
        <div className="navInner">
          <a className="navLogo" href="/">
            <span className="dot" />
            <span className="logoText">{EASTER_MODE ? "🐰 NeonTiers" : "NeonTiers"}</span>
          </a>
          <nav className="navLinks">
            <a className="navLink active" href="/">
              <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/></svg>
              Főoldal
            </a>
            <a className="navLink" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/></svg>
              Discord
            </a>
          </nav>
          <div className="navSearch">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"/></svg>
            <input
              className="navSearchInput"
              placeholder="Játékos keresése..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
            />
            <kbd className="navSearchKbd">/</kbd>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mainContent">
        {/* Mode tabs - overlapping the card like mctiers.com */}
        <section className="modeTabs">
          {MODE_LIST.map((m) => (
            <a
              key={m}
              className={`modeTab ${activeMode === m ? "active" : ""}`}
              onClick={() => setActiveMode(m)}
              role="button"
              tabIndex={0}
            >
              <strong className="modeTabLabel">{MODE_ABBR[m] || m}</strong>
              {activeMode === m && <span className="modeTabIndicator" />}
            </a>
          ))}
        </section>

        {/* Main card */}
        <div className="mainCard">
          {/* Column headers */}
          <div className="colHeaders">
            <span className="colHash">#</span>
            <span className="colPlayer">Játékos</span>
            <span className="colTiers">Rangok</span>
          </div>

          {/* Player list */}
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
              <div className="playerRow" key={p.username}>
                <span className="rowHash">{idx + 1}</span>
                <span className="rowName">{p.username}</span>
                <span className="rowTiers">
                  {p.entries.map((r) => {
                    const tier = tierFromRank(r.rank);
                    const color = tierColor(tier);
                    return (
                      <span
                        className="tierBadge"
                        key={`${r.gamemode}:${r.rank}`}
                        style={{ color }}
                      >
                        <span style={{ opacity: 0.6 }}>{MODE_ABBR[displayMode(r.gamemode)] || displayMode(r.gamemode)}</span>
                        {" "}{r.rank}
                      </span>
                    );
                  })}
                </span>
                <span className="rowPoints">{p.total}</span>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="pageFooter">
        <div className="footerText">NeonTiers © {new Date().getFullYear()}</div>
      </footer>

      <style jsx global>{`
        :root {
          --bg: #09090b;
          --card: #0c0c10;
          --border: rgba(255, 255, 255, 0.08);
          --text: rgba(255, 255, 255, 0.87);
          --muted: rgba(255, 255, 255, 0.45);
          --accent: rgba(139, 92, 246, 0.5);
          --accent-border: rgba(139, 92, 246, 0.4);
          --tab-bg: rgba(12, 12, 16, 0.95);
        }

        * { box-sizing: border-box; }

        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          background: var(--bg);
          color: var(--text);
          font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .page {
          min-height: 100vh;
          position: relative;
        }

        .bg {
          position: fixed;
          inset: 0;
          background: var(--bg);
          z-index: -1;
        }

        /* ===== NAVBAR ===== */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(9, 9, 11, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }

        .navInner {
          max-width: 1352px;
          margin: 0 auto;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 0 16px;
        }

        .navLogo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: var(--text);
          margin-right: auto;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a777ff, #35d0ff);
          box-shadow: 0 0 10px rgba(167, 119, 255, 0.5);
          flex-shrink: 0;
        }

        .logoText {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .navLinks {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .navLink {
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          color: var(--muted);
          font-size: 14px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }

        .navLink:hover, .navLink.active {
          color: var(--text);
          background: rgba(255, 255, 255, 0.06);
        }

        .navSearch {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 6px 10px;
          color: var(--muted);
        }

        .navSearchInput {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 13px;
          width: 180px;
        }

        .navSearchKbd {
          background: rgba(255, 255, 255, 0.08);
          color: var(--muted);
          font-size: 11px;
          font-family: inherit;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        /* ===== MODE TABS ===== */
        .mainContent {
          max-width: 1352px;
          margin: 0 auto;
          padding: 0 16px;
          position: relative;
        }

        .modeTabs {
          display: flex;
          gap: 2px;
          overflow-x: auto;
          overflow-y: hidden;
          padding-bottom: 0;
          position: relative;
          z-index: 10;
        }

        .modeTab {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 14px;
          text-decoration: none;
          cursor: pointer;
          user-select: none;
          position: relative;
          border: 2px solid transparent;
          border-bottom: none;
          border-radius: 12px 12px 0 0;
          background: transparent;
          color: var(--muted);
          transition: color 0.15s, background 0.15s;
          transform: translateY(2px);
        }

        .modeTab:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.04);
        }

        .modeTab.active {
          background: rgba(139, 92, 246, 0.12);
          color: var(--text);
          border-color: var(--border);
        }

        .modeTabIndicator {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #a78bfa;
        }

        /* ===== MAIN CARD ===== */
        .mainCard {
          background: var(--card);
          border: 2px solid var(--border);
          border-radius: 0 12px 12px 12px;
          padding: 0 24px;
        }

        /* Column headers */
        .colHeaders {
          display: grid;
          grid-template-columns: 40px 1fr auto;
          gap: 16px;
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          border-bottom: 1px solid var(--border);
        }

        .colHash { text-align: center; }
        .colPlayer { text-align: left; }
        .colTiers { text-align: right; min-width: 200px; }

        /* Player rows */
        .playerRow {
          display: grid;
          grid-template-columns: 40px 1fr auto;
          gap: 16px;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          transition: background 0.1s;
        }

        .playerRow:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .playerRow:last-child {
          border-bottom: none;
        }

        .rowHash {
          text-align: center;
          font-size: 14px;
          font-weight: 700;
          color: var(--muted);
        }

        .rowName {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rowTiers {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: flex-end;
        }

        .tierBadge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .rowPoints {
          text-align: right;
          font-size: 15px;
          font-weight: 800;
          color: #a78bfa;
        }

        /* Empty state */
        .emptyState {
          padding: 48px 24px;
          text-align: center;
        }

        .emptyTitle {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
        }

        .emptySub {
          margin-top: 6px;
          font-size: 13px;
          color: var(--muted);
        }

        /* Footer */
        .pageFooter {
          max-width: 1352px;
          margin: 80px auto 0;
          padding: 32px 16px;
          text-align: center;
        }

        .footerText {
          font-size: 14px;
          color: var(--muted);
        }

        /* Easter eggs */
        .easterEggsContainer {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .floatingEgg {
          position: absolute;
          bottom: -40px;
          animation: floatUp linear infinite;
          opacity: 0.3;
        }

        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-110vh) rotate(360deg); opacity: 0; }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .navLinks { display: none; }
          .navSearchInput { width: 120px; }
          .modeTab { padding: 6px 10px; }
          .colTiers { display: none; }
          .rowTiers { display: none; }
        }
      `}</style>
    </div>
  );
}
