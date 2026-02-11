"use client";

import { useEffect, useMemo, useState } from "react";

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

function fmtPoints(n) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? v : 0;
}

export default function Page() {
  const [tests, setTests] = useState([]);
  const [mode, setMode] = useState("Összes");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/tests", { cache: "no-store" });
      const data = await res.json();
      setTests(Array.isArray(data?.tests) ? data.tests : []);
    } catch {
      setTests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // 5mp-enként frissít
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tests.filter((r) => {
      if (mode !== "Összes" && r.gamemode !== mode) return false;
      if (!query) return true;
      return String(r.username || "").toLowerCase().includes(query);
    });
  }, [tests, mode, q]);

  // Leaderboard: username alapján összeadjuk a pontokat a különböző gamemode-ok legutolsó rekordjaiból
  const leaderboard = useMemo(() => {
    const byUser = new Map();

    for (const r of tests) {
      const name = r.username;
      if (!name) continue;

      if (!byUser.has(name)) byUser.set(name, { username: name, rows: [], points: 0 });

      const u = byUser.get(name);
      u.rows.push(r);
    }

    // userenként: a rows már eleve "user+mode egyedi" az API miatt, szóval sima sum
    const list = [];
    for (const u of byUser.values()) {
      const pts = u.rows.reduce((acc, x) => acc + fmtPoints(x.points), 0);
      list.push({
        username: u.username,
        rows: u.rows.sort((a, b) => String(a.gamemode).localeCompare(String(b.gamemode))),
        points: pts,
      });
    }

    list.sort((a, b) => b.points - a.points || a.username.localeCompare(b.username));
    return list;
  }, [tests]);

  return (
    <main className="min-h-screen w-full">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between gap-6">
          <h1 className="text-4xl font-extrabold tracking-tight">NeonTiers</h1>

          <div className="flex items-center gap-3">
            <input
              className="search"
              placeholder="Játékos keresése"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <a className="pillLink" href="https://discord.com" target="_blank" rel="noreferrer">
              Discord
            </a>
            <button className="pillLink" type="button">
              Mod
            </button>
          </div>
        </div>

        <div className="panel mt-8">
          <div className="modes">
            {MODE_LIST.map((m) => (
              <button
                key={m}
                className={`modeBtn ${mode === m ? "active" : ""}`}
                onClick={() => setMode(m)}
                type="button"
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-4xl font-extrabold tracking-tight">Ranglista</h2>
          <div className="opacity-75">{leaderboard.length} játékos</div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="emptyCard">Betöltés...</div>
          ) : mode !== "Összes" ? (
            // Mode nézet: csak a kiválasztott gamemode rekordjai
            filtered.length === 0 ? (
              <div className="emptyCard">Nincs találat.</div>
            ) : (
              filtered.map((r, idx) => (
                <div key={`${r.username}-${r.gamemode}`} className="rowCard">
                  <div className="rankNo">{idx + 1}.</div>
                  <div className="rowMain">
                    <div className="rowName">{r.username}</div>
                    <div className="badges">
                      <span className="badge">
                        {r.gamemode} {r.rank}
                      </span>
                    </div>
                  </div>
                  <div className="points">
                    <div className="pointsBig">{fmtPoints(r.points)}</div>
                    <div className="pointsSmall">PONT</div>
                  </div>
                </div>
              ))
            )
          ) : (
            // Összes nézet: leaderboard
            leaderboard.length === 0 ? (
              <div className="emptyCard">Még nincs adat.</div>
            ) : (
              leaderboard.map((u, idx) => (
                <div key={u.username} className="rowCard">
                  <div className="rankNo">{idx + 1}.</div>
                  <div className="rowMain">
                    <div className="rowName">{u.username}</div>
                    <div className="badges">
                      {u.rows.map((r) => (
                        <span key={`${u.username}-${r.gamemode}`} className="badge">
                          {r.gamemode} {r.rank}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="points">
                    <div className="pointsBig">{fmtPoints(u.points)}</div>
                    <div className="pointsSmall">PONT</div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </main>
  );
}
