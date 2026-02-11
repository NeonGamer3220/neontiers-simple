"use client";

import { useEffect, useMemo, useState } from "react";

const MODE_LIST = [
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

function pointsFromRank(rank) {
  const map = {
    Unranked: 0,
    LT5: 1,
    HT5: 2,
    LT4: 3,
    HT4: 4,
    LT3: 5,
    HT3: 8,
    LT2: 6,
    HT2: 7,
    LT1: 8,
    HT1: 9,
    HT4: 10,
  };
  return map[rank] ?? 0;
}

function shortRank(rank) {
  // már rövidet kérsz (LT3, HT3 stb), itt csak biztosítjuk:
  return String(rank || "").trim();
}

export default function Page() {
  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("Összes");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/tests", { cache: "no-store" });
      const data = await res.json();
      setTests(Array.isArray(data?.tests) ? data.tests : []);
    } catch (e) {
      setTests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // frissítés 8 mp-enként
    return () => clearInterval(t);
  }, []);

  // Leaderboard: username szerint, gamemode-onként csak 1 (legutolsó) legyen
  const leaderboard = useMemo(() => {
    // backend már törli a duplikált gamemode-okat, de itt is biztosítjuk
    const byUser = new Map();

    for (const row of tests) {
      const username = String(row?.username || "").trim();
      const gamemode = String(row?.gamemode || "").trim();
      const rank = String(row?.rank || "").trim();
      const tester = row?.tester;

      if (!username || !gamemode || !rank) continue;

      if (!byUser.has(username)) {
        byUser.set(username, new Map()); // gamemode -> row
      }
      const userModes = byUser.get(username);

      // ha jön új azonos gamemode, felülírjuk (csak a legutóbbi marad)
      userModes.set(gamemode, {
        username,
        gamemode,
        rank,
        tester,
        points: typeof row?.points === "number" ? row.points : pointsFromRank(rank),
      });
    }

    // map -> list
    const players = [];
    for (const [username, modesMap] of byUser.entries()) {
      const modes = Array.from(modesMap.values());

      // szűrés gamemode szerint
      const filteredModes =
        modeFilter === "Összes"
          ? modes
          : modes.filter((m) => m.gamemode === modeFilter);

      if (filteredModes.length === 0) continue;

      // keresés username alapján
      if (search.trim()) {
        const s = search.trim().toLowerCase();
        if (!username.toLowerCase().includes(s)) continue;
      }

      const totalPoints = filteredModes.reduce((sum, m) => sum + (m.points || 0), 0);

      // tag-ek sorbarendezése MODE_LIST szerint
      filteredModes.sort((a, b) => {
        const ia = MODE_LIST.indexOf(a.gamemode);
        const ib = MODE_LIST.indexOf(b.gamemode);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      });

      players.push({
        username,
        modes: filteredModes,
        points: totalPoints,
      });
    }

    // pont szerint csökkenő
    players.sort((a, b) => b.points - a.points);

    return players;
  }, [tests, search, modeFilter]);

  return (
    <div className="min-h-screen w-full bg-[#070A12] text-white">
      {/* háttér */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700/30 via-cyan-500/20 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_70%_65%,rgba(34,211,238,0.10),transparent_35%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Top bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-3xl font-extrabold tracking-tight">NeonTiers</div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="w-full sm:w-[420px] rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
              placeholder="Játékos keresése"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex gap-2">
              <a
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                Discord
              </a>
              <a
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                Mod
              </a>
            </div>
          </div>
        </div>

        {/* Mode pills */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap gap-3">
            {["Összes", ...MODE_LIST].map((m) => {
              const active = modeFilter === m;
              return (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "border border-white/25 bg-white/15"
                      : "border border-white/10 bg-white/5 hover:bg-white/10",
                  ].join(" ")}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title row */}
        <div className="mt-8 flex items-end justify-between">
          <div className="text-4xl font-extrabold">Ranglista</div>
          <div className="text-sm text-white/60">
            {loading ? "Betöltés..." : `${leaderboard.length} játékos`}
          </div>
        </div>

        {/* List */}
        <div className="mt-5 space-y-5">
          {!loading && leaderboard.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/70">
              Nincs adat. Nyisd meg ezt: <span className="font-mono">/api/tests</span> és nézd meg jön-e teszt.
            </div>
          )}

          {leaderboard.map((p, idx) => (
            <div
              key={p.username}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-white/70 text-2xl font-extrabold w-10">
                    {idx + 1}.
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold">{p.username}</div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.modes.map((m) => (
                        <span
                          key={`${p.username}-${m.gamemode}`}
                          className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm"
                          title={`Tesztelő: ${m.tester ? "@" + String(m.tester).replace(/[<@>]/g, "") : "N/A"}`}
                        >
                          {m.gamemode} {shortRank(m.rank)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-5xl font-extrabold text-cyan-300">
                    {p.points}
                  </div>
                  <div className="text-sm font-semibold text-white/70">PONT</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer help */}
        <div className="mt-10 text-sm text-white/50">
          Tipp: ha a weboldal nem frissül, nyisd meg a{" "}
          <span className="font-mono">/api/tests</span> oldalt és nézd meg, hogy a{" "}
          <span className="font-mono">tests</span> tömb tényleg kap-e adatot.
        </div>
      </div>
    </div>
  );
}
