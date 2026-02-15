"use client";

import React, { useEffect, useMemo, useState } from "react";

const DISCORD_INVITE = "https://discord.gg/7fanAQDxaN";

// Gamemodes (buttons)
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

// Rank -> tier number (for glow) + points (for fallback)
const RANK_POINTS = {
  LT5: 1,
  HT5: 2,
  LT4: 3,
  HT4: 4,
  LT3: 5,
  HT3: 6,
  LT2: 7,
  HT2: 8,
  LT1: 9,
  HT1: 10,
};

// Tier glow styles
function tierFromRank(rank) {
  if (!rank || typeof rank !== "string") return null;
  const m = rank.match(/([LH]T)([1-5])/i);
  if (!m) return null;
  return Number(m[2]);
}

function glowStyleForTier(tier) {
  // text color + border + glow
  // 1: yellow, 2: silver, 3: bronze, 4: neon purple, 5: blue
  switch (tier) {
    case 1:
      return {
        color: "#FFD86B",
        borderColor: "rgba(255, 216, 107, 0.85)",
        boxShadow:
          "0 0 10px rgba(255, 216, 107, 0.55), 0 0 22px rgba(255, 216, 107, 0.25)",
      };
    case 2:
      return {
        color: "#E7EEF8",
        borderColor: "rgba(231, 238, 248, 0.85)",
        boxShadow:
          "0 0 10px rgba(231, 238, 248, 0.45), 0 0 22px rgba(231, 238, 248, 0.22)",
      };
    case 3:
      return {
        color: "#D7A67A",
        borderColor: "rgba(215, 166, 122, 0.85)",
        boxShadow:
          "0 0 10px rgba(215, 166, 122, 0.45), 0 0 22px rgba(215, 166, 122, 0.22)",
      };
    case 4:
      return {
        color: "#B58CFF",
        borderColor: "rgba(181, 140, 255, 0.9)",
        boxShadow:
          "0 0 10px rgba(181, 140, 255, 0.55), 0 0 24px rgba(181, 140, 255, 0.28)",
      };
    case 5:
      return {
        color: "#63B6FF",
        borderColor: "rgba(99, 182, 255, 0.9)",
        boxShadow:
          "0 0 10px rgba(99, 182, 255, 0.55), 0 0 24px rgba(99, 182, 255, 0.28)",
      };
    default:
      return null;
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

  // Fetch tests from your API
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);

        // ✅ RELATIVE URL (NO undefined)
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

    // Optional: auto refresh every 10s (remove if you don’t want)
    const t = setInterval(load, 10000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Build leaderboard: latest per (username+gamemode) AND total points per user
  const leaderboard = useMemo(() => {
    // Normalize incoming rows
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

    // If DB already enforces unique(username,gamemode) you’ll still be fine,
    // but this also guards duplicates by keeping the newest.
    const latestByUserMode = new Map();
    for (const r of rows) {
      const key = `${r.username}__${r.gamemode}`;
      const prev = latestByUserMode.get(key);
      if (!prev) {
        latestByUserMode.set(key, r);
        continue;
      }
      // Compare by created_at then id
      const prevTime = prev.created_at ? Date.parse(prev.created_at) : 0;
      const curTime = r.created_at ? Date.parse(r.created_at) : 0;
      if (curTime > prevTime) latestByUserMode.set(key, r);
      else if (curTime === prevTime && safeInt(r.id, 0) > safeInt(prev.id, 0))
        latestByUserMode.set(key, r);
    }

    const latestRows = Array.from(latestByUserMode.values());

    // Filter by mode
    const filteredByMode =
      activeMode === "Összes"
        ? latestRows
        : latestRows.filter((r) => r.gamemode === activeMode);

    // Group by username
    const byUser = new Map();
    for (const r of filteredByMode) {
      if (!byUser.has(r.username)) byUser.set(r.username, []);
      byUser.get(r.username).push(r);
    }

    // Build player entries
    const players = Array.from(byUser.entries()).map(([username, entries]) => {
      // Sort ranks by gamemode name for consistent pill order
      entries.sort((a, b) => a.gamemode.localeCompare(b.gamemode));

      const total = entries.reduce((sum, e) => sum + safeInt(e.points, 0), 0);
      return { username, entries, total };
    });

    // Search filter
    const q = query.trim().toLowerCase();
    const searched = !q
      ? players
      : players.filter((p) => p.username.toLowerCase().includes(q));

    // Sort by points desc, then username
    searched.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.username.localeCompare(b.username);
    });

    return searched;
  }, [tests, activeMode, query]);

  return (
    <div className="page">
      <div className="bg" />

      <header className="topbar">
        <div className="brand">
          <span className="dot" />
          <span className="brandText">NeonTiers</span>
        </div>

        <div className="searchWrap">
          <div className="searchInner">
            <span className="searchIcon">🔎</span>
            <input
              className="search"
              placeholder="Játékos keresése"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="navButtons">
          <a className="navBtn navBtnPrimary" href="/">
            Főoldal
          </a>
          <a className="navBtn" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
            Discord
          </a>
        </div>
      </header>

      <main className="container">
        <section className="modes">
          <div className="modesInner">
            {MODE_LIST.map((m) => (
              <button
                key={m}
                className={`modeBtn ${activeMode === m ? "active" : ""}`}
                onClick={() => setActiveMode(m)}
                type="button"
              >
                {m}
              </button>
            ))}
          </div>
        </section>

        <div className="sectionHead">
          <h1 className="title">Ranglista</h1>
          <div className="count">
            {loading ? "Betöltés..." : `${leaderboard.length} játékos`}
          </div>
        </div>

        <section className="list">
          {loading ? (
            <div className="emptyCard">
              <div className="emptyTitle">Betöltés...</div>
              <div className="emptySub">Kérlek várj.</div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="emptyCard">
              <div className="emptyTitle">Nincs adat</div>
              <div className="emptySub">Még nincs mentett teszt eredmény.</div>
            </div>
          ) : (
            leaderboard.map((p, idx) => (
              <div className="playerCard" key={p.username}>
                <div className="rankNum">{idx + 1}.</div>

                <div className="playerMain">
                  <div className="playerName">{p.username}</div>

                  <div className="pillRow">
                    {p.entries.map((r) => {
                      const tier = tierFromRank(r.rank);
                      const glow = glowStyleForTier(tier);

                      // ✅ IMPORTANT: whole pill text + border glow, including "Mace HT1"
                      const pillStyle = glow
                        ? {
                            borderColor: glow.borderColor,
                            boxShadow: glow.boxShadow,
                            color: glow.color,
                          }
                        : undefined;

                      return (
                        <span className="pill" key={`${r.gamemode}:${r.rank}`} style={pillStyle}>
                          {r.gamemode} {r.rank}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="points">
                  <div className="pointsNum">{p.total}</div>
                  <div className="pointsLabel">PONT</div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <style jsx global>{`
        :root {
          --bg1: #060a1a;
          --bg2: #07122a;
          --card: rgba(255, 255, 255, 0.06);
          --card2: rgba(255, 255, 255, 0.075);
          --border: rgba(255, 255, 255, 0.12);
          --border2: rgba(255, 255, 255, 0.16);
          --text: rgba(255, 255, 255, 0.92);
          --muted: rgba(255, 255, 255, 0.65);
          --muted2: rgba(255, 255, 255, 0.5);
          --shadow: 0 20px 70px rgba(0, 0, 0, 0.55);
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          height: 100%;
          margin: 0;
          padding: 0;
          background: var(--bg1);
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans",
            "Apple Color Emoji", "Segoe UI Emoji";
        }

        .page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        .bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(900px 600px at 10% 20%, rgba(155, 89, 255, 0.33), transparent 60%),
            radial-gradient(1000px 700px at 70% 40%, rgba(0, 200, 255, 0.18), transparent 60%),
            radial-gradient(900px 700px at 60% 100%, rgba(0, 130, 255, 0.15), transparent 70%),
            linear-gradient(180deg, #060a1a, #050816);
          filter: saturate(1.05);
          transform: scale(1.05);
        }

        .topbar {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr minmax(260px, 520px) 1fr;
          gap: 16px;
          align-items: center;
          padding: 26px 28px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(135deg, #a777ff, #35d0ff);
          box-shadow: 0 0 18px rgba(167, 119, 255, 0.5), 0 0 26px rgba(53, 208, 255, 0.28);
        }

        .brandText {
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .searchWrap {
          display: flex;
          justify-content: center;
        }

        .searchInner {
          width: 100%;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
        }

        .searchIcon {
          opacity: 0.7;
          font-size: 14px;
        }

        .search {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-size: 14px;
        }

        .navButtons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .navBtn {
          text-decoration: none;
          color: var(--text);
          font-weight: 800;
          font-size: 14px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
          transition: transform 0.08s ease, background 0.12s ease, border-color 0.12s ease;
          user-select: none;
        }

        .navBtn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.18);
        }

        .navBtnPrimary {
          background: rgba(125, 160, 255, 0.18);
          border-color: rgba(160, 190, 255, 0.32);
        }

        .container {
          position: relative;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 28px 48px;
        }

        .modes {
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: var(--shadow);
          padding: 16px;
          backdrop-filter: blur(10px);
        }

        .modesInner {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .modeBtn {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(0, 0, 0, 0.22);
          color: rgba(255, 255, 255, 0.9);
          padding: 10px 14px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
          transition: transform 0.08s ease, background 0.12s ease, border-color 0.12s ease;
          user-select: none;
        }

        .modeBtn:hover {
          transform: translateY(-1px);
          background: rgba(0, 0, 0, 0.28);
          border-color: rgba(255, 255, 255, 0.18);
        }

        .modeBtn.active {
          background: rgba(130, 160, 255, 0.16);
          border-color: rgba(160, 190, 255, 0.32);
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset,
            0 0 18px rgba(120, 170, 255, 0.18);
        }

        .sectionHead {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-top: 26px;
          margin-bottom: 12px;
        }

        .title {
          font-size: 46px;
          margin: 0;
          font-weight: 1000;
          letter-spacing: -0.03em;
          text-shadow: 0 10px 60px rgba(0, 0, 0, 0.6);
        }

        .count {
          color: var(--muted);
          font-weight: 800;
          font-size: 14px;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .playerCard {
          display: grid;
          grid-template-columns: 42px 1fr 130px;
          gap: 16px;
          align-items: center;
          padding: 20px 22px;
          border-radius: 22px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.04));
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: var(--shadow);
          backdrop-filter: blur(10px);
        }

        .rankNum {
          font-weight: 1000;
          font-size: 18px;
          color: rgba(255, 255, 255, 0.78);
          text-align: right;
        }

        .playerMain {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .playerName {
          font-size: 28px;
          font-weight: 1000;
          letter-spacing: -0.02em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pillRow {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(0, 0, 0, 0.22);
          color: rgba(255, 255, 255, 0.9);
          font-weight: 1000;
          font-size: 13px;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
        }

        .points {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          gap: 2px;
        }

        .pointsNum {
  font-size: 42px;
  font-weight: 900; /* ← ez a lényeg */
  color: #6fe3ff;
  text-shadow: 0 0 16px rgba(111, 227, 255, 0.25);
  line-height: 1;
}


        .pointsLabel {
          font-weight: 1000;
          font-size: 14px;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.75);
        }

        .emptyCard {
          padding: 26px 22px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: var(--shadow);
          backdrop-filter: blur(10px);
        }

        .emptyTitle {
          font-weight: 1000;
          font-size: 18px;
        }

        .emptySub {
          margin-top: 6px;
          color: var(--muted);
          font-weight: 700;
          font-size: 13px;
        }

        @media (max-width: 980px) {
          .topbar {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .navButtons {
            justify-content: flex-start;
          }
          .playerCard {
            grid-template-columns: 34px 1fr;
            grid-template-rows: auto auto;
          }
          .points {
            grid-column: 2;
            align-items: flex-start;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
