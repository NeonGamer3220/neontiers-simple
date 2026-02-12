"use client";

import { useEffect, useMemo, useState } from "react";

const DISCORD_INVITE = "https://discord.gg/7fanAQDxaN";

// gombok sorrendben
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

function safeMode(x) {
  if (!x) return "";
  return String(x);
}

function safeRank(x) {
  if (!x) return "";
  return String(x);
}

export default function Page() {
  const [tests, setTests] = useState([]);
  const [selectedMode, setSelectedMode] = useState("Összes");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/tests", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setTests(Array.isArray(data?.tests) ? data.tests : []);
      } catch {
        if (!cancelled) setTests([]);
      }
    }

    load();
    const t = setInterval(load, 5000); // frissülés
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // player -> utolsó eredmény gamemode-onként + pont összeg
  const players = useMemo(() => {
    const map = new Map();

    for (const row of tests) {
      const username = (row?.username || "").trim();
      const gamemode = safeMode(row?.gamemode).trim();
      const rank = safeRank(row?.rank).trim();
      const points = Number(row?.points || 0);
      const createdAt = row?.created_at ? new Date(row.created_at).getTime() : 0;

      if (!username || !gamemode || !rank) continue;

      if (!map.has(username)) {
        map.set(username, {
          username,
          byMode: {}, // gamemode -> { rank, points, createdAt }
        });
      }

      const u = map.get(username);
      const prev = u.byMode[gamemode];

      // csak a legutolsó maradjon gamemode-onként
      if (!prev || createdAt >= prev.createdAt) {
        u.byMode[gamemode] = { gamemode, rank, points, createdAt };
      }
    }

    // összegzés + lista
    const list = [];
    for (const u of map.values()) {
      const modes = Object.values(u.byMode);
      const total = modes.reduce((s, m) => s + (Number(m.points) || 0), 0);
      list.push({
        username: u.username,
        modes,
        total,
      });
    }

    // pont szerint csökkenő
    list.sort((a, b) => b.total - a.total);
    return list;
  }, [tests]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return players
      .map((p) => {
        let modes = p.modes;

        if (selectedMode !== "Összes") {
          modes = modes.filter((m) => String(m.gamemode).toLowerCase() === selectedMode.toLowerCase());
        }

        return { ...p, modes };
      })
      .filter((p) => {
        if (selectedMode !== "Összes" && p.modes.length === 0) return false;
        if (!q) return true;
        return p.username.toLowerCase().includes(q);
      });
  }, [players, selectedMode, query]);

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <div className="logoDot" />
          <div className="brandTitle">NeonTiers</div>
        </div>

        <div className="rightSide">
          <div className="searchWrap">
            <div className="searchIcon">🔎</div>
            <input
              className="search"
              placeholder="Játékos keresése"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <a className="btn btnPrimary" href="/" title="Főoldal">
            Főoldal
          </a>

          <a className="btn" href={DISCORD_INVITE} target="_blank" rel="noreferrer">
            Discord
          </a>
        </div>
      </div>

      <div className="panel">
        <div className="filtersRow">
          {MODE_LIST.map((m) => (
            <button
              key={m}
              className={`pill ${selectedMode === m ? "pillActive" : ""}`}
              onClick={() => setSelectedMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="sectionTitleRow">
        <div className="sectionTitle">Ranglista</div>
        <div className="sectionMeta">{filtered.length} játékos</div>
      </div>

      <div className="listCard">
        {filtered.length === 0 ? (
          <div className="empty">Nincs adat.</div>
        ) : (
          filtered.map((p, idx) => (
            <div className="playerRow" key={p.username}>
              <div className="rankNum">{idx + 1}.</div>

              <div>
                <div className="playerName">{p.username}</div>
                <div className="tags">
                  {p.modes
                    .slice()
                    .sort((a, b) => (a.gamemode > b.gamemode ? 1 : -1))
                    .map((m) => (
                      <div className="tag" key={`${p.username}-${m.gamemode}`}>
                        {m.gamemode} {m.rank}
                      </div>
                    ))}
                </div>
              </div>

              <div className="pointsBox">
                <div className="pointsNum">{p.total}</div>
                <div className="pointsLabel">PONT</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
