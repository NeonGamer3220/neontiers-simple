"use client";

import { useMemo, useState } from "react";

const MODES = [
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

const RANK_POINTS = {
  Unranked: 0,
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

function calcTotalPoints(ranks) {
  return ranks.reduce((sum, r) => sum + (RANK_POINTS[r.rank] ?? 0), 0);
}

function PlayerCard({ index, player, selectedMode }) {
  const shown =
    selectedMode === "Összes"
      ? player.ranks
      : player.ranks.filter((r) => r.mode === selectedMode);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-extrabold opacity-80">{index + 1}.</div>
          <div>
            <div className="text-2xl font-extrabold">{player.name}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {shown.length === 0 ? (
                <span className="rounded-full bg-white/5 px-3 py-1 text-sm opacity-70">
                  Nincs rang ebben a módban
                </span>
              ) : (
                shown.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-sm font-semibold"
                  >
                    {r.mode} {r.rank}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-extrabold text-cyan-300">
            {player.points}
          </div>
          <div className="text-xs font-bold opacity-70">PONT</div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [players] = useState([
    {
      name: "NeonGamer322",
      ranks: [
        { mode: "Sword", rank: "HT4" },
        { mode: "Mace", rank: "LT3" },
        { mode: "DiaSMP", rank: "HT3" },
      ],
    },
    {
      name: "antidoe",
      ranks: [
        { mode: "Vanilla", rank: "HT2" },
        { mode: "UHC", rank: "HT2" },
        { mode: "Pot", rank: "LT1" },
      ],
    },
  ]);

  const [selectedMode, setSelectedMode] = useState("Összes");
  const [query, setQuery] = useState("");

  const computed = useMemo(() => {
    const q = query.toLowerCase().trim();

    const withPoints = players.map((p) => ({
      ...p,
      points: calcTotalPoints(p.ranks),
    }));

    return withPoints
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .filter((p) =>
        selectedMode === "Összes"
          ? true
          : p.ranks.some((r) => r.mode === selectedMode)
      )
      .sort((a, b) => b.points - a.points);
  }, [players, query, selectedMode]);

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-extrabold">NeonTiers</h1>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Játékos keresése"
            className="w-full md:w-[420px] rounded-full border border-white/10 bg-white/5 px-4 py-2"
          />
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMode(m)}
                className={`rounded-full px-4 py-2 text-sm font-semibold border ${
                  selectedMode === m
                    ? "border-white/20 bg-white/15"
                    : "border-white/10 bg-black/25"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <h2 className="text-4xl font-extrabold">Ranglista</h2>

        <div className="space-y-4">
          {computed.map((p, i) => (
            <PlayerCard
              key={p.name}
              index={i}
              player={p}
              selectedMode={selectedMode}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
