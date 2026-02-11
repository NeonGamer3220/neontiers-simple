export const dynamic = "force-dynamic";
export const revalidate = 0;

import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data.json");

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
  HT1: 10
};

export default function Home() {
  let data = { tests: [] };

  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath));
  }

  const players = {};

  data.tests.forEach((t) => {
    if (!players[t.username]) {
      players[t.username] = {
        username: t.username,
        totalPoints: 0,
        modes: {}
      };
    }

    players[t.username].modes[t.gamemode] = t.rank;
  });

  Object.values(players).forEach((p) => {
    p.totalPoints = Object.values(p.modes).reduce(
      (sum, rank) => sum + (RANK_POINTS[rank] || 0),
      0
    );
  });

  const sorted = Object.values(players).sort(
    (a, b) => b.totalPoints - a.totalPoints
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#0b1020] to-[#0f2a2f] text-white p-10">
      <h1 className="text-4xl font-bold mb-10">NeonTiers</h1>

      <h2 className="text-3xl font-semibold mb-6">Ranglista</h2>

      <div className="space-y-6">
        {sorted.map((player, index) => (
          <div
            key={player.username}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center backdrop-blur"
          >
            <div>
              <div className="text-2xl font-bold">
                {index + 1}. {player.username}
              </div>

              <div className="flex gap-3 mt-3 flex-wrap">
                {Object.entries(player.modes).map(([mode, rank]) => (
                  <span
                    key={mode}
                    className="bg-white/10 px-3 py-1 rounded-full text-sm"
                  >
                    {mode} {rank}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-cyan-400">
                {player.totalPoints}
              </div>
              <div className="text-xs text-gray-400">PONT</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
