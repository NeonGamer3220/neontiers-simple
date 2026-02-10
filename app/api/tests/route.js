import { NextResponse } from "next/server";

const MODE_LIST = [
  "Vanilla","UHC","Pot","NethPot","SMP","Sword","Axe","Mace","Cart","Creeper","DiaSMP","OGVanilla","ShieldlessUHC",
  "SpearMace","SpearElytra",
];

const RANK_LIST = ["Unranked","LT5","HT5","LT4","HT4","LT3","HT3","LT2","HT2","LT1","HT1"];

const RANK_POINTS = {
  Unranked: 0,
  LT5: 1, HT5: 2,
  LT4: 3, HT4: 4,
  LT3: 5, HT3: 6,
  LT2: 7, HT2: 8,
  LT1: 9, HT1: 10,
};

function getStore() {
  // Vercel serverless: ez “best effort” memória.
  // Ha akarsz 100% perzisztenciát, később KV/DB kell.
  if (!globalThis.__NEONTIERS_STORE) {
    globalThis.__NEONTIERS_STORE = {
      // key: usernameLower -> { usernameOriginal, modes: { mode: { rank, tester, updatedAt } } }
      players: {},
    };
  }
  return globalThis.__NEONTIERS_STORE;
}

function buildResponsePlayers(store) {
  const arr = [];

  for (const key of Object.keys(store.players)) {
    const p = store.players[key];

    const tests = [];
    let points = 0;

    for (const mode of Object.keys(p.modes)) {
      const entry = p.modes[mode];
      tests.push({
        username: p.username,
        gamemode: mode,
        rank: entry.rank,
        tester: entry.tester,
        updatedAt: entry.updatedAt,
      });
      points += (RANK_POINTS[entry.rank] ?? 0);
    }

    // rendezzük a tageket updatedAt szerint, hogy “szép” legyen
    tests.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));

    arr.push({
      username: p.username,
      points,
      tests,
    });
  }

  // leaderboard: pont szerint csökkenő
  arr.sort((a, b) => b.points - a.points);

  return arr;
}

export async function GET() {
  const store = getStore();

  // a frontend eddig {tests:[...]}-t várt, ezért visszaadunk
  // 1) tests: egy flatten lista (UNIQUE gamemode már)
  // 2) players: leaderboard-hoz
  const players = buildResponsePlayers(store);

  const flatTests = [];
  for (const p of players) {
    for (const t of p.tests) flatTests.push(t);
  }

  return NextResponse.json({ tests: flatTests, players });
}

export async function POST(req) {
  const auth = req.headers.get("authorization") || "";
  const expected = process.env.BOT_API_KEY || ""; // Vercel env
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = String(body.username || "").trim();
  const gamemode = String(body.gamemode || "").trim();
  const rank = String(body.rank || "").trim();
  const tester = String(body.tester || "").trim();

  if (!username) return NextResponse.json({ error: "Missing username" }, { status: 400 });
  if (!MODE_LIST.includes(gamemode)) return NextResponse.json({ error: "Invalid gamemode" }, { status: 400 });
  if (!RANK_LIST.includes(rank)) return NextResponse.json({ error: "Invalid rank" }, { status: 400 });

  const store = getStore();
  const key = username.toLowerCase();

  if (!store.players[key]) {
    store.players[key] = { username, modes: {} };
  } else {
    // tartjuk a legutóbbi “szép” nevet
    store.players[key].username = username;
  }

  // ✅ UPSERT: ugyanannál a gamemode-nál FELÜLÍRUNK
  store.players[key].modes[gamemode] = {
    rank,
    tester,
    updatedAt: Date.now(),
  };

  return NextResponse.json({ ok: true });
}
