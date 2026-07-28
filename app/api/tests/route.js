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

// Tier -> points mapping (no ELO/rating intermediate — rank is a tier string).
const TIER_TO_POINTS = {
  LT5: 1, HT5: 2, LT4: 3, HT4: 4,
  LT3: 6, HT3: 10, LT2: 16, HT2: 22,
  LT1: 40, HT1: 60,
};

function json(data, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

function getPointsForRank(rank) {
  if (typeof rank !== "string") return 0;
  return TIER_TO_POINTS[rank.trim().toUpperCase()] || 0;
}

function normalizeTestsRow(r) {
  if (!r || typeof r !== "object") return r;
  const rawRank = r.rank != null ? r.rank : null;
  return {
    ...r,
    rank: rawRank != null ? String(rawRank) : null,
  };
}

function normalizeTestsList(data) {
  return Array.isArray(data) ? data.map(normalizeTestsRow) : [];
}

// Generate a deterministic surrogate numeric id for a username+gamemode pair.
function surrogateIdFor(username, gamemode) {
  const digest = username.toLowerCase() + "|" + gamemode.toLowerCase();
  let hash = 0x811c9dc9;
  for (let i = 0; i < digest.length; i++) {
    hash ^= digest.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const positive = Math.abs(hash | 0) >>> 0;
  return positive + 2_000_000_000;
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

const KNOWN_TIERS_SET = new Set([
  "LT5", "HT5", "LT4", "HT4", "LT3", "HT3", "LT2", "HT2", "LT1", "HT1",
]);

function normRank(s) {
  if (s === null || s === undefined || String(s).trim() === "") return null;
  const r = String(s).trim().toUpperCase();
  if (r === "UNRANKED") return null;
  // Only accept known tier strings — rank is stored (and always was meant to
  // be stored) as a tier string like "HT3", never a raw ELO number.
  if (KNOWN_TIERS_SET.has(r)) return r;
  return null;
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
    return json({ test: normalizeTestsRow(data) });
  }

  if (username) {
    const { data, error } = await supabase
      .from("tests")
      .select("id,username,gamemode,rank,points,created_at")
      .ilike("username", username)
      .order("points", { ascending: false });

    if (error) return json({ error: error.message }, 500);
    return json({ tests: normalizeTestsList(data) });
  }

  // Get random player for a specific mode and tier
  const mode = (searchParams.get("mode") || "").trim();
  const tier = (searchParams.get("tier") || "").trim();

  if (mode && tier) {
    const tierKey = tier.trim().toUpperCase();
    const { data, error } = await supabase
      .from("tests")
      .select("id,username,gamemode,rank,points,created_at,retired")
      .ilike("gamemode", mode)
      .eq("rank", tierKey)
      .limit(100);

    if (error) return json({ error: error.message }, 500);

    // Filter out retired players
    const activePlayers = (data || []).filter(p => !p.retired);

    if (activePlayers.length === 0) {
      return json({ player: null, message: "No players found for this mode and tier" }, 200, "public, s-maxage=30, stale-while-revalidate=30");
    }

    const randomPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    return json({ player: normalizeTestsRow(randomPlayer) }, 200, "public, s-maxage=30, stale-while-revalidate=30");
  }

  // Get all tests — supabase query limited rows from DB (avoid over-fetch).
  const limit = Math.min(parseInt(searchParams.get("limit") || "500", 10) || 500, 2000);

  let { data, error } = await supabase
    .from("tests")
    .select("id,username,gamemode,rank,points,created_at,retired")
    .order("points", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return json({ error: error.message }, 500);

  return json({ tests: normalizeTestsList(data) }, 200, "public, s-maxage=30, stale-while-revalidate=30");
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
  const rankRaw = pick(body, ["elo", "rank", "tier", "earned_rank", "earnedRank", "earned_tier", "result", "earned_elo"]);
  const retiredRaw = body?.retired === true || body?.retired === "true";
  const uuidRaw = pick(body, ["uuid", "player_uuid", "playerUuid", "minecraft_uuid", "minecraftUuid"]);

  const gamemode = normMode(gamemodeRaw);
  const rank = normRank(rankRaw);

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
      : getPointsForRank(rank);

  const row = {
    username,
    gamemode,
    rank,
    points,
    retired: retiredRaw,
    created_at: new Date().toISOString(),
  };

  let saved = null;
  let saveErr = null;

  if (id) {
    const { data, error } = await supabase
      .from("tests")
      .update(row)
      .eq("id", Number(id))
      .select("id,username,gamemode,rank,points,created_at,retired")
      .maybeSingle();
    saved = data;
    saveErr = error;
    if (!saved && !saveErr) {
      const ups = await supabase
        .from("tests")
        .upsert(row, { onConflict: "username,gamemode" })
        .select("id,username,gamemode,rank,points,created_at,retired")
        .maybeSingle();
      saved = ups.data;
      saveErr = ups.error;
    }
  } else {
    const surrogateId = surrogateIdFor(username, gamemode);
    const insertRow = { ...row, id: surrogateId };
    const res = await supabase
      .from("tests")
      .upsert(insertRow, { onConflict: "id" })
      .select("id,username,gamemode,rank,points,created_at,retired")
      .maybeSingle();
    saved = res.data;
    saveErr = res.error;
    if (!saved && !saveErr) {
      const ups2 = await supabase
        .from("tests")
        .upsert(insertRow, { onConflict: "username,gamemode" })
        .select("id,username,gamemode,rank,points,created_at,retired")
        .maybeSingle();
      saved = ups2.data;
      saveErr = ups2.error;
    }
  }

  if (saveErr) return json({ error: saveErr.message }, 500);

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
        old_rank: null,
        new_rank: rank,
        old_points: null,
        new_points: points,
        details: null,
        created_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("Audit log insert failed:", e?.message || e);
  }

  return json(
    {
      ok: true,
      previous: saved
        ? { rank: saved.rank, points: saved.points, created_at: saved.created_at }
        : { rank: "Unranked", points: 0, created_at: null },
      saved: normalizeTestsRow(saved),
    },
    200
  );
}
