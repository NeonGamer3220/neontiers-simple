// app/page.tsx
"use client";

import React, { useMemo, useState } from "react";

type RankEntry = { mode: string; rank: string };
type Player = { name: string; ranks: RankEntry[] };

// Gamemode lista (ikonok nélkül)
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
] as const;

// Rang → pont (ha nálad más a rendszer, itt állítsd)
const RANK_POINTS: Record<string, number> = {
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

function rankPoints(rank: string): number {
  return RANK_POINTS[rank] ?? 0;
}

function shortRank(rank: string): string {
  // Itt tudod formázni, ha akarod (pl "Unranked" marad)
  return rank;
}

function calcTotalPoints(ranks: RankEntry[]): number {
  return ranks.reduce((sum, r) => sum + rankPoints(r.rank), 0);
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function modeBadge(mode: string) {
  // csak UI-hoz (hogy szebb legyen a badge)
  return mode;
}

function PlayerCard({
  index,
  player,
  selectedMode,
}: {
  index: number;
  player: Player & { points: number };
  selectedMode: string;
}) {
  const shownRanks =
    selectedMode === "Összes"
      ? player.ranks
      : player.ranks.filter((r) => r.mode === selectedMode);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-extrabold opacity-80">{index + 1}.</div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight">{player.name}</div>

            <div className="mt-3 flex flex-wrap gap-2">
              {shownRanks.length === 0 ? (
                <span className="rounded-full bg-white/5 px-3 py-1 text-sm opacity-70">
                  Nincs rang ebben a módban
                </span>
              ) : (
                shownRanks.map((r, i) => (
                  <span
                    key={`${r.mode}-${r.rank}-${i}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-sm font-semibold"
                  >
                    <span className="opacity-80">{modeBadge(r.mode)}</span>
                    <span className="opacity-90">{shortRank(r.rank)}</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl font-extrabold text-cyan-300">{player.points}</div>
          <div className="text-xs font-bold tracking-widest opacity-70">PONT</div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  // DEMO adatok – később ezt API-ból fogjuk tölteni
  const [players] = useState<Player[]>([
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
        { mode: "Mace", rank: "LT2" },
      ],
    },
  ]);

  const [selectedMode, setSelectedMode] = useState<string>("Összes");
  const [query, setQuery] = useState<string>("");

  const computed = useMemo(() => {
    const q = normalize(query);

    // pont számolás
    const withPoints = players.map((p) => ({
      ...p,
      points: calcTotalPoints(p.ranks),
    }));

    // szűrés név alapján
    const filteredByName = q
      ? withPoints.filter((p) => normalize(p.name).includes(q))
      : withPoints;

    // szűrés mode alapján (ha nem Összes)
    const filteredByMode =
      selectedMode === "Összes"
        ? filteredByName
        : filteredByName.filter((p) => p.ranks.some((r) => r.mode === selectedMode));

    // rendezés pont szerint
    filteredByMode.sort((a, b) => b.points - a.points);

    return filteredByMode;
  }, [players, query, selectedMode]);

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500" />
            <h1 className="text-3xl font-extrabold tracking-tight">NeonTiers</h1>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Játékos keresése (szűrés)"
              className="w-full md:w-[420px] rounded-full border border-white/10 bg-white/5 px-4 py-2 outline-none placeholder:text-white/40"
            />
            <div className="flex gap-2">
              <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Discord
              </button>
              <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Mod
              </button>
            </div>
          </div>
        </header>

        {/* Mode filter */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => {
              const active = selectedMode === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMode(m)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold border transition",
                    active
                      ? "border-white/20 bg-white/15"
                      : "border-white/10 bg-black/25 hover:bg-white/10",
                  ].join(" ")}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </section>

        {/* List header */}
        <div className="flex items-end justify-between">
          <h2 className="text-4xl font-extrabold tracking-tight">Ranglista</h2>
          <div className="text-sm opacity-70">{computed.length} játékos</div>
        </div>

        {/* Cards */}
        <section className="space-y-4">
          {computed.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 opacity-80">
              Nincs találat.
            </div>
          ) : (
            computed.map((p, i) => (
              <PlayerCard key={p.name} index={i} player={p} selectedMode={selectedMode} />
            ))
          )}
        </section>
      </div>
    </main>
  );
}
