// app/api/tests/route.js
import { NextResponse } from "next/server";

// =========================
// AUTH (BOT -> WEBSITE)
// =========================
// A bot ezt küldi:
// Authorization: Bearer <BOT_API_KEY>
function isAuthorized(req) {
  const expected = process.env.BOT_API_KEY;
  if (!expected) return false;

  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${expected}`;
}

// =========================
// CONSTANTS
// =========================
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

const RANK_POINTS = {
  Unranked: 0,

  LT5: 1,
  HT5: 2,

  LT4: 3,
  HT4: 4,

  LT3: 5,
  HT3: 8,

  LT2: 12,
  HT2: 15,

  LT1: 20,
  HT1: 25,
};

function normalizeMode(mode) {
  if (!mode) return null;
  const m = String(mode).trim();

  // allow lowercase input too
  const found = MODE_LIST.find((x) => x.toLowerCase() === m.toLowerCase());
  return found || null;
}

function normalizeRank(rank) {
  if (!rank) return null;
  const r = String(rank).trim();

  // allow "unranked" / "Unranked"
  const key = Object.keys(RANK_POINTS).find(
    (x) => x.toLowerCase() === r.toLowerCase()
  );
  return key || null;
}

function toInt(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

// =========================
// IN-MEMORY STORE (Vercel instance memory)
// NOTE: This is not a real database. If Vercel restarts the instance, data can reset.
// =========================
function getStore() {
  if (!globalThis.__NEONTIERS_STORE__) {
    globalThis.__NEONTIERS_STORE__ = {
      // username -> player object
      players: {},
    };
  }
  return globalThis.__NEONTIERS_STORE__;
}

function computeTotalPoints(player) {
  // Only latest test per mode counts
  let total = 0;
  for (const mode of Object.keys(player.tests)) {
    total += player.tests[mode].points || 0;
  }
  player.totalPoints = total;
}

function serializePlayers(modeFilter = null) {
  const store = getStore();
  const list = Object.values(store.players).map((p) => {
    const testsArray = Object.values(p.tests);

    // if filtering by mode, only include that mode in response
    let filteredTests = testsArray;
    if (modeFilter) {
      filteredTests = testsArray.filter((t) => t.mode === modeFilter);
    }

    // sort tests by updatedAt desc (latest first)
    filteredTests.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    return {
      username: p.username,
      totalPoints: p.totalPoints || 0,
      tests: filteredTests,
    };
  });

  // If filtering by mode, points should be only that mode's points for sorting
  if (modeFilter) {
    for (const p of list) {
      const t = p.tests[0];
      p.totalPoints = t ? t.points : 0;
    }
  }

  // sort by points desc, then username asc
  list.sort((a, b) => {
    if ((b.totalPoints || 0) !== (a.totalPoints || 0)) {
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    }
    return a.username.localeCompare(b.username);
  });

  return list;
}

// =========================
// GET /api/tests
// Optional: /api/tests?mode=Mace
// =========================
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const modeParam = searchParams.get("mode");
  const mode = modeParam ? normalizeMode(modeParam) : null;

  if (modeParam && !mode) {
    return NextResponse.json(
      { error: "Invalid mode", allowed: MODE_LIST },
      { status: 400 }
    );
  }

  const tests = serializePlayers(mode);
  return NextResponse.json({ tests }, { status: 200 });
}

// =========================
// POST /api/tests
// Body JSON:
// {
//   "username": "NeonGamer322",
//   "mode": "Mace",        // or "gamemode": "Mace"
//   "rank": "HT3",         // or "tier": "HT3"
//   "tester": "NeoTiers"   // optional
// }
//
// RULE: only ONE latest result per (username + mode) exists.
// It overwrites the previous result, and points are recalculated.
// =========================
export async function POST(req) {
  // AUTH CHECK
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username = body?.username ? String(body.username).trim() : "";
  const modeRaw = body?.mode ?? body?.gamemode ?? "";
  const rankRaw = body?.rank ?? body?.tier ?? "";

  const tester =
    body?.tester !== undefined && body?.tester !== null
      ? String(body.tester).trim()
      : null;

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const mode = normalizeMode(modeRaw);
  if (!mode) {
    return NextResponse.json(
      { error: "Missing/invalid mode", allowed: MODE_LIST },
      { status: 400 }
    );
  }

  const rank = normalizeRank(rankRaw);
  if (!rank) {
    return NextResponse.json(
      { error: "Missing/invalid rank", allowed: Object.keys(RANK_POINTS) },
      { status: 400 }
    );
  }

  const points = RANK_POINTS[rank];
  const updatedAt = Date.now();

  // upsert player
  const store = getStore();
  if (!store.players[username]) {
    store.players[username] = {
      username,
      tests: {}, // mode -> test
      totalPoints: 0,
    };
  }

  const player = store.players[username];

  // overwrite ONLY this mode (so you can't have 3x Mace)
  player.tests[mode] = {
    mode,
    rank,
    points,
    tester,
    updatedAt,
  };

  // recompute totals (only latest per mode counts)
  computeTotalPoints(player);

  return NextResponse.json(
    {
      ok: true,
      saved: {
        username,
        mode,
        rank,
        points,
        tester,
        updatedAt,
      },
      totalPoints: player.totalPoints,
    },
    { status: 201 }
  );
}
