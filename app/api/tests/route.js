// app/api/tests/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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
  LT3: 6,
  HT3: 10,
  LT2: 16,
  HT2: 28,
  LT1: 40,
  HT1: 60,
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
      .select("id,username,gamemode,rank,points,created_at")
      .ilike("username", username)
      .ilike("gamemode", gamemode)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    return json({ test: data || null });
  }

  // New: Get all tests for a specific username
  if (username) {
    const { data, error } = await supabase
      .from("tests")
      .select("id,username,gamemode,rank,points,created_at")
      .ilike("username", username)
      .order("points", { ascending: false });

    if (error) return json({ error: error.message }, 500);
    return json({ tests: data || [] });
  }

  // Get random player for a specific mode and tier
  const mode = (searchParams.get("mode") || "").trim();
  const tier = (searchParams.get("tier") || "").trim();

  if (mode && tier) {
    const { data, error } = await supabase
      .from("tests")
      .select("id,username,gamemode,rank,points,created_at")
      .ilike("gamemode", mode)
      .ilike("rank", tier)
      .limit(100); // Fetch a batch to pick from

    if (error) return json({ error: error.message }, 500);

    // Filter out retired players manually (ranks starting with R)
    const activePlayers = (data || []).filter(p => !p.rank.startsWith("R"));

    if (activePlayers.length === 0) {
      return json({ player: null, message: "No players found for this mode and tier" });
    }

    // Pick random
    const randomPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    return json({ player: randomPlayer });
  }

  const { data, error } = await supabase
    .from("tests")
    .select("id,username,gamemode,rank,points,created_at")
    .order("points", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);

  return json({ tests: data || [] });
}

// POST: Save test result
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

  // Accept optional id from admin client to perform safe updates
  const id = pick(body, ["id", "test_id", "row_id"]);

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
    .select("id,username,gamemode,rank,points,created_at")
    .ilike("username", username)
    .ilike("gamemode", gamemode)
    .maybeSingle();

  if (prevErr) return json({ error: prevErr.message }, 500);

  // 2) If admin provided an `id`, perform an UPDATE to avoid upsert id/null issues
  const row = {
    username,
    gamemode,
    rank,
    points,
    created_at: new Date().toISOString(),
  };

  let saved = null;
  let saveErr = null;

  if (id) {
    // Update by id (safer for admin edits)
    const { data, error } = await supabase
      .from("tests")
      .update(row)
      .eq("id", id)
      .select("id,username,gamemode,rank,points,created_at")
      .maybeSingle();
    saved = data;
    saveErr = error;
    // If update did not find a row, fall back to upsert to create one
    if (!saved && !saveErr) {
      const ups = await supabase
        .from("tests")
        .upsert(row, { onConflict: "username,gamemode" })
        .select("id,username,gamemode,rank,points,created_at")
        .maybeSingle();
      saved = ups.data;
      saveErr = ups.error;
    }
  } else {
    const res = await supabase
      .from("tests")
      .upsert(row, { onConflict: "username,gamemode" })
      .select("id,username,gamemode,rank,points,created_at")
      .maybeSingle();
    saved = res.data;
    saveErr = res.error;
  }

  if (saveErr) return json({ error: saveErr.message }, 500);

  // Server-side audit logging when admin session is present
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    let admin_name = null;
    if (session && session.value) {
      try {
        const parsed = JSON.parse(session.value);
        admin_name = parsed?.admin_name || null;
      } catch (e) {
        // ignore parse errors
      }
    }

    if (admin_name) {
      await supabase.from("audit_logs").insert({
        admin_name,
        action: "tier_save",
        target_username: username,
        gamemode,
        old_rank: prev ? prev.rank : null,
        new_rank: rank,
        old_points: prev ? prev.points : null,
        new_points: points,
        details: null,
        created_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    // non-fatal: don't block main flow if audit insert fails
    console.error("Audit log insert failed:", e?.message || e);
  }

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
