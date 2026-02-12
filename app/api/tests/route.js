// app/api/tests/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

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
  return String(s || "").trim();
}

function normRank(s) {
  const r = String(s || "").trim();
  if (!r) return "";
  const up = r.toUpperCase();
  if (up === "UNRANKED") return "Unranked";
  return up;
}

function requireSupabase() {
  if (!supabase) {
    return json(
      {
        error: "Supabase is not configured",
        need_env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      },
      500
    );
  }
  return null;
}

// GET:
// - /api/tests                 -> lista (DB-ből)
// - /api/tests?username=...&gamemode=... -> 1 darab (az adott user + mode aktuális)
export async function GET(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") || "").trim();
  const gamemode = (searchParams.get("gamemode") || "").trim();

  if (username && gamemode) {
    const { data, error } = await supabase
      .from("tests")
      .select("username,gamemode,rank,points,created_at")
      .ilike("username", username)
      .ilike("gamemode", gamemode)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    return json({ test: data || null });
  }

  const { data, error } = await supabase
    .from("tests")
    .select("username,gamemode,rank,points,created_at")
    .order("points", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);

  return json({ tests: data || [] });
}

export async function POST(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  let body = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // Fogadjuk el többféle kulcsnévvel (bot/web régi verziók)
  const username = pick(body, [
    "username",
    "minecraft_name",
    "minecraftName",
    "mc_name",
    "mcName",
    "player",
    "testedplayer",
  ]);

  const gamemodeRaw = pick(body, ["gamemode", "game_mode", "mode", "gameMode", "testmode"]);
  const rankRaw = pick(body, ["rank", "tier", "earned_rank", "earnedRank", "result"]);

  const gamemode = normMode(gamemodeRaw);
  const rank = normRank(rankRaw);

  if (!username || !gamemode || !rank) {
    return json(
      {
        error: "Missing username/gamemode/rank",
        received: { username, gamemode, rank },
      },
      400
    );
  }

  const points =
    body?.points !== undefined && body?.points !== null && String(body.points).trim() !== ""
      ? Number(body.points)
      : RANK_POINTS[rank] ?? 0;

  // 1) Előző rekord lekérése (ez kell a botnak!)
  const { data: prev, error: prevErr } = await supabase
    .from("tests")
    .select("username,gamemode,rank,points,created_at")
    .ilike("username", username)
    .ilike("gamemode", gamemode)
    .maybeSingle();

  if (prevErr) return json({ error: prevErr.message }, 500);

  // 2) Upsert: csak 1 sor legyen user+mode-ra (különben duplikál)
  // FONTOS: Supabase-ben legyen UNIQUE constraint a (username, gamemode)-ra.
  const row = {
    username,
    gamemode,
    rank,
    points,
    created_at: new Date().toISOString(),
  };

  const { data: saved, error: saveErr } = await supabase
    .from("tests")
    .upsert(row, { onConflict: "username,gamemode" })
    .select("username,gamemode,rank,points,created_at")
    .single();

  if (saveErr) return json({ error: saveErr.message }, 500);

  return json(
    {
      ok: true,
      previous: prev
        ? { rank: prev.rank, points: prev.points, created_at: prev.created_at }
        : { rank: "Unranked", points: 0, created_at: null },
      saved,
    },
    200
  );
}
