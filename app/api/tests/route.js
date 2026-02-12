// app/api/tests/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

let memory = {
  tests: [], // { username, gamemode, rank, points, created_at }
};

// Rang -> pont (a te map-ed)
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
  HT1: 10,
  Unranked: 0,
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
      return String(obj[k]).trim();
    }
  }
  return "";
}

function normMode(s) {
  // egységesítés: Mace/SpearMace stb maradjon így, csak trim
  return String(s || "").trim();
}

function normRank(s) {
  const r = String(s || "").trim();
  if (!r) return "";
  // engedjük a kisbetűs beírást is: lt3 -> LT3
  const up = r.toUpperCase();
  if (up === "UNRANKED") return "Unranked";
  return up;
}

export async function GET() {
  return json({ tests: memory.tests });
}

export async function POST(req) {
  let body = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // ✅ fogadjuk el több néven is (bot vs web vs régi verziók)
  const username = pick(body, [
    "username",
    "minecraft_name",
    "minecraftName",
    "mc_name",
    "mcName",
    "player",
    "testedplayer",
  ]);

  const gamemodeRaw = pick(body, [
    "gamemode",
    "game_mode",
    "mode",
    "gameMode",
    "testmode",
  ]);

  const rankRaw = pick(body, [
    "rank",
    "tier",
    "earned_rank",
    "earnedRank",
    "result",
  ]);

  const gamemode = normMode(gamemodeRaw);
  const rank = normRank(rankRaw);

  if (!username || !gamemode || !rank) {
    return json(
      {
        error: "Missing username/gamemode/rank",
        received: { username, gamemode, rank },
        hint: "Send one of: username|minecraft_name + gamemode|mode + rank|tier",
      },
      400
    );
  }

  const points =
    body?.points !== undefined && body?.points !== null && String(body.points).trim() !== ""
      ? Number(body.points)
      : (RANK_POINTS[rank] ?? 0);

  const created_at = new Date().toISOString();

  // ✅ csak az UTOLSÓ maradjon meg gamemode-onként ugyanannál a játékosnál
  memory.tests = memory.tests.filter(
    (t) => !(t.username.toLowerCase() === username.toLowerCase() && t.gamemode.toLowerCase() === gamemode.toLowerCase())
  );

  memory.tests.push({ username, gamemode, rank, points, created_at });

  return json({ ok: true, saved: { username, gamemode, rank, points, created_at } }, 200);
}
