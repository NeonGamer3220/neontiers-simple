type RankEntry = { mode: string; rank: string };

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

function calcPoints(ranks: RankEntry[]) {
  return ranks.reduce((sum, r) => sum + (RANK_POINTS[r.rank] ?? 0), 0);
}

export default function Page() {
  const players = [
    {
      name: "NeonGamer322",
      ranks: [
        { mode: "Sword", rank: "HT4" },
        { mode: "Mace", rank: "LT3" },
        { mode: "DiaSMP", rank: "HT3" },
      ],
    },
  ];

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold">NeonTiers</h1>
          <input
            placeholder="Játékos keresése (szűrés)"
            className="w-full max-w-xl rounded-full bg-white/5 border border-white/10 px-4 py-2 outline-none"
          />
          <div className="flex gap-2">
            <button className="rounded-full bg-white/10 px-4 py-2">Discord</button>
            <button className="rounded-full bg-white/10 px-4 py-2">Mod</button>
          </div>
        </header>

        <div className="rounded-3xl bg-white/5 border border-white/10 p-4">
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button key={m} className="rounded-full bg-black/30 px-4 py-2 text-sm">
                {m}
              </button>
            ))}
          </div>
        </div>

        <h2 className="text-3xl font-extrabold">Ranglista</h2>

        {players.map((p) => (
          <div
            key={p.name}
            className="rounded-2xl bg-white/5 border border-white/10 p-5 flex justify-between"
          >
            <div>
              <div className="text-xl font-bold">{p.name}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.ranks.map((r, i) => (
                  <span key={i} className="rounded-full bg-white/10 px-3 py-1 text-sm">
                    {r.mode} {r.rank}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-cyan-300">
                {calcPoints(p.ranks)}
              </div>
              <div className="text-xs opacity-70">PONT</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
