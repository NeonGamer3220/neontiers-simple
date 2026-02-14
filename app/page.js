"use client";

import React, { useEffect, useMemo, useState } from "react";

const DISCORD_INVITE = "https://discord.gg/7fanAQDxaN";

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

// pontos mapping (fix)
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
  Unranked: 0,
};

// tier szám (glowhoz)
function tierNumberFromRank(rank) {
  if (!rank) return null;
  const m = String(rank).match(/([1-5])/);
  return m ? Number(m[1]) : null;
}

function safeText(v) {
  return (v ?? "").toString().trim();
}

export default function Page() {
  const [rawTests, setRawTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedMode, setSelectedMode] = useState("Összes");
  const [query, setQuery] = useState("");

  async function load() {
    try {
      setErr("");
      setLoading(true);

      const res = await fetch("/api/tests", { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`API hiba (${res.status}) ${txt}`);
      }

      const data = await res.json();
      const tests = Array.isArray(data?.tests) ? data.tests : [];
      setRawTests(tests);
    } catch (e) {
      setErr(e?.message || "Ismeretlen hiba.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // 5 sec frissítés
    return () => clearInterval(t);
  }, []);

  // normalizálás + fallback pont számítás
  const normalizedTests = useMemo(() => {
    return rawTests
      .map((t) => {
        const username = safeText(t.username);
        const gamemode = safeText(t.gamemode);
        const rank = safeText(t.rank) || "Unranked";
        const createdAt = t.created_at ? new Date(t.created_at).getTime() : 0;

        // db-ben lehet points is, de ha rossz/missing, számoljuk mappingből
        const points =
          typeof t.points === "number"
            ? t.points
            : RANK_POINTS[rank] ?? 0;

        return { username, gamemode, rank, points, createdAt };
      })
      .filter((t) => t.username && t.gamemode);
  }, [rawTests]);

  // leaderboard: username -> { testsByMode, totalPoints }
  const players = useMemo(() => {
    const map = new Map();

    for (const t of normalizedTests) {
      if (!map.has(t.username)) {
        map.set(t.username, {
          username: t.username,
          testsByMode: new Map(),
        });
      }
      const p = map.get(t.username);

      // ha valamiért duplikált jönne, a legfrissebbet tartjuk meg
      const prev = p.testsByMode.get(t.gamemode);
      if (!prev || (t.createdAt || 0) >= (prev.createdAt || 0)) {
        p.testsByMode.set(t.gamemode, t);
      }
    }

    // map -> array + pont összeg
    const arr = [];
    for (const p of map.values()) {
      const tests = Array.from(p.testsByMode.values());

      const totalPoints = tests.reduce((sum, x) => sum + (x.points || 0), 0);

      arr.push({
        username: p.username,
        tests,
        totalPoints,
      });
    }

    // szűrés
    const q = query.trim().toLowerCase();
    let filtered = arr;

    if (selectedMode !== "Összes") {
      filtered = filtered.filter((p) =>
        p.tests.some((t) => t.gamemode === selectedMode)
      );
    }
    if (q) {
      filtered = filtered.filter((p) => p.username.toLowerCase().includes(q));
    }

    // rendezés pont szerint
    filtered.sort((a, b) => b.totalPoints - a.totalPoints);

    return filtered;
  }, [normalizedTests, selectedMode, query]);

  return (
    <div className="nt-root">
      <header className="nt-header">
        <div className="nt-brand">NeonTiers</div>

        <div className="nt-searchWrap">
          <input
            className="nt-search"
            placeholder="Játékos keresése"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="nt-navBtns">
            <button
              className="nt-navBtn"
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
              type="button"
            >
              Főoldal
            </button>

            <a className="nt-navBtn" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
              Discord
            </a>
          </div>
        </div>
      </header>

      <main className="nt-main">
        <section className="nt-modes">
          {MODE_LIST.map((m) => {
            const active = m === selectedMode;
            return (
              <button
                key={m}
                className={`nt-modeBtn ${active ? "is-active" : ""}`}
                onClick={() => setSelectedMode(m)}
                type="button"
              >
                {m}
              </button>
            );
          })}
        </section>

        <div className="nt-titleRow">
          <h1 className="nt-title">Ranglista</h1>
          <div className="nt-count">{players.length} játékos</div>
        </div>

        {loading ? (
          <div className="nt-state">Betöltés…</div>
        ) : err ? (
          <div className="nt-state nt-error">{err}</div>
        ) : players.length === 0 ? (
          <div className="nt-state">Jelenleg nincs megjeleníthető adat.</div>
        ) : (
          <div className="nt-list">
            {players.map((p, idx) => (
              <div key={p.username} className="nt-card">
                <div className="nt-rankNo">{idx + 1}.</div>

                <div className="nt-cardMid">
                  <div className="nt-username">{p.username}</div>

                  <div className="nt-badges">
                    {p.tests
                      .slice()
                      .sort((a, b) => a.gamemode.localeCompare(b.gamemode))
                      .map((t) => {
                        const tier = tierNumberFromRank(t.rank);
                        const tierClass = tier ? `tier-${tier}` : "";
                        return (
                          <span
                            key={`${t.gamemode}:${t.rank}`}
                            className={`nt-badge ${tierClass}`}
                            title={`${t.gamemode} • ${t.rank} • ${t.points} pont`}
                          >
                            {t.gamemode} {t.rank}
                          </span>
                        );
                      })}
                  </div>
                </div>

                <div className="nt-points">
                  <div className="nt-pointsNum">{p.totalPoints}</div>
                  <div className="nt-pointsLbl">PONT</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Mini stílus fallback: ha nincs CSS, akkor is legyen minimálisan nézhető.
          Ha van saját globals.css-ed, ezeket nyugodtan hagyhatod, nem zavar. */}
      <style jsx global>{`
        .nt-root {
          min-height: 100vh;
          padding: 28px;
          background: radial-gradient(1200px 700px at 20% 10%, rgba(140, 60, 255, 0.35), transparent 60%),
            radial-gradient(1200px 700px at 70% 50%, rgba(0, 255, 255, 0.20), transparent 60%),
            #05070d;
          color: #e9ecff;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Apple Color Emoji",
            "Segoe UI Emoji";
        }

        .nt-header {
          display: flex;
          gap: 20px;
          align-items: center;
          justify-content: space-between;
          max-width: 1100px;
          margin: 0 auto 18px auto;
        }

        .nt-brand {
          font-weight: 900;
          letter-spacing: 0.4px;
          font-size: 34px;
        }

        .nt-searchWrap {
          display: flex;
          gap: 12px;
          align-items: center;
          width: 100%;
          justify-content: flex-end;
        }

        .nt-search {
          width: min(520px, 60vw);
          padding: 12px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(0, 0, 0, 0.25);
          color: #fff;
          outline: none;
        }

        .nt-search:focus {
          border-color: rgba(160, 120, 255, 0.6);
          box-shadow: 0 0 0 6px rgba(160, 120, 255, 0.12);
        }

        .nt-navBtns {
          display: flex;
          gap: 10px;
        }

        .nt-navBtn {
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(0, 0, 0, 0.18);
          color: #fff;
          text-decoration: none;
          cursor: pointer;
          user-select: none;
        }

        .nt-navBtn:hover {
          border-color: rgba(255, 255, 255, 0.22);
          background: rgba(0, 0, 0, 0.26);
        }

        .nt-main {
          max-width: 1100px;
          margin: 0 auto;
        }

        .nt-modes {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(10px);
        }

        .nt-modeBtn {
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(0, 0, 0, 0.20);
          color: #fff;
          cursor: pointer;
          font-weight: 650;
        }

        .nt-modeBtn:hover {
          border-color: rgba(255, 255, 255, 0.22);
        }

        .nt-modeBtn.is-active {
          border-color: rgba(170, 120, 255, 0.7);
          box-shadow: 0 0 0 6px rgba(170, 120, 255, 0.10);
        }

        .nt-titleRow {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin: 22px 0 12px 0;
        }

        .nt-title {
          font-size: 44px;
          margin: 0;
          font-weight: 900;
        }

        .nt-count {
          opacity: 0.8;
        }

        .nt-state {
          margin-top: 18px;
          padding: 18px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.18);
        }

        .nt-error {
          border-color: rgba(255, 80, 120, 0.35);
        }

        .nt-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .nt-card {
          display: grid;
          grid-template-columns: 60px 1fr 120px;
          gap: 10px;
          align-items: center;
          padding: 18px 18px;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(10px);
        }

        .nt-rankNo {
          opacity: 0.85;
          font-weight: 800;
          font-size: 18px;
        }

        .nt-username {
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .nt-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .nt-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(0, 0, 0, 0.25);
          font-weight: 750;
          font-size: 13px;
          line-height: 1;
          white-space: nowrap;
        }

        .nt-points {
          text-align: right;
        }

        .nt-pointsNum {
          font-size: 44px;
          font-weight: 900;
          color: #6be8ff;
          line-height: 1;
        }

        .nt-pointsLbl {
          opacity: 0.85;
          font-weight: 800;
          letter-spacing: 1px;
        }

        /* GLOW tier szerint */
        .tier-1 {
          box-shadow: 0 0 18px rgba(255, 215, 0, 0.40);
          border-color: rgba(255, 215, 0, 0.35);
        }
        .tier-2 {
          box-shadow: 0 0 18px rgba(200, 210, 225, 0.35);
          border-color: rgba(200, 210, 225, 0.30);
        }
        .tier-3 {
          box-shadow: 0 0 18px rgba(205, 127, 50, 0.35);
          border-color: rgba(205, 127, 50, 0.30);
        }
        .tier-4 {
          box-shadow: 0 0 18px rgba(190, 80, 255, 0.35);
          border-color: rgba(190, 80, 255, 0.30);
        }
        .tier-5 {
          box-shadow: 0 0 18px rgba(70, 160, 255, 0.35);
          border-color: rgba(70, 160, 255, 0.30);
        }

        @media (max-width: 900px) {
          .nt-card {
            grid-template-columns: 50px 1fr;
            grid-template-rows: auto auto;
          }
          .nt-points {
            grid-column: 2;
          }
          .nt-searchWrap {
            flex-direction: column;
            align-items: flex-end;
          }
          .nt-search {
            width: min(520px, 86vw);
          }
        }
      `}</style>
    </div>
  );
}
