export const dynamic = "force-dynamic";
export const revalidate = 0;

type Rank = "Unranked" | "LT5" | "HT5" | "LT4" | "HT4" | "LT3" | "HT3";

type TestRow = {
  username: string;
  testerId: string;
  testerTag?: string;
  mode: string;
  rank: Rank;
  timestamp: number;
};

type PlayerRecord = {
  username: string;
  testsByMode: Record<string, TestRow | undefined>;
  points: number;
  updatedAt: number;
};

async function getData(): Promise<{ tests: PlayerRecord[]; storage?: string }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/tests`, {
    cache: "no-store",
  });
  return res.json();
}

function modeOrder(m: string) {
  const ORDER = [
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
  const idx = ORDER.indexOf(m);
  return idx === -1 ? 999 : idx;
}

export default async function Page() {
  const data = await getData();
  const players = data.tests ?? [];

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(900px_500px_at_20%_10%,rgba(140,72,255,0.35),transparent_60%),radial-gradient(900px_600px_at_70%_30%,rgba(0,180,255,0.22),transparent_60%),radial-gradient(900px_700px_at_40%_90%,rgba(0,255,170,0.15),transparent_60%),linear-gradient(180deg,#070A12,#050712)] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight">NeonTiers</h1>
          <div className="w-full max-w-md">
            <input
              placeholder="Játékos keresése"
              className="w-full rounded-full bg-white/5 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-xs text-white/60">
            API storage: {data.storage ?? "unknown"}
          </div>
        </div>

        <h2 className="mt-10 text-4xl font-extrabold">Ranglista</h2>

        <div className="mt-6 space-y-6">
          {players.length === 0 ? (
            <div className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 text-white/70">
              0 játékos
            </div>
          ) : (
            players.map((p, i) => {
              const tests = Object.values(p.testsByMode || {})
                .filter(Boolean) as TestRow[];

              tests.sort((a, b) => modeOrder(a.mode) - modeOrder(b.mode));

              return (
                <div
                  key={p.username}
                  className="rounded-[28px] bg-white/6 p-6 ring-1 ring-white/10 backdrop-blur"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-extrabold text-white/70">
                        {i + 1}.
                      </div>
                      <div>
                        <div className="text-2xl font-extrabold">
                          {p.username}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tests.map((t) => (
                            <span
                              key={`${t.mode}-${t.timestamp}`}
                              className="rounded-full bg-black/25 px-3 py-1 text-sm ring-1 ring-white/10"
                            >
                              {t.mode} {t.rank}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-4xl font-extrabold text-cyan-300">
                        {p.points}
                      </div>
                      <div className="text-sm font-semibold text-cyan-200/80">
                        PONT
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
