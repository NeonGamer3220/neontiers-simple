// app/api/tests/remove/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_API_KEY = process.env.BOT_API_KEY || process.env.ADMIN_API_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

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

function requireAdmin(authHeader) {
  if (!ADMIN_API_KEY) {
    return json(
      {
        error: "Admin authentication is not configured",
        need_env: ["ADMIN_API_KEY"],
      },
      500
    );
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Missing or invalid authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  if (token !== ADMIN_API_KEY) {
    return json({ error: "Invalid API key" }, 403);
  }

  return null;
}

// POST: /api/tests/remove - Remove player from tierlist (admin only)
export async function POST(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const authError = requireAdmin(authHeader);
  if (authError) return authError;

  let body = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const username = pick(body, ["username", "name", "player", "minecraft_name"]);
  const gamemode = pick(body, ["gamemode", "game_mode", "mode"]);

  if (!username) {
    return json({ error: "Missing username" }, 400);
  }

  if (gamemode) {
    // Delete only specific gamemode entry
    const { data: existing, error: findErr } = await supabase
      .from("tests")
      .select("id, username, gamemode, rank, points")
      .ilike("username", username)
      .ilike("gamemode", gamemode);

    if (findErr) return json({ error: findErr.message }, 500);

    if (!existing || existing.length === 0) {
      return json(
        {
          error: `Player "${username}" not found in gamemode "${gamemode}"`,
        },
        404
      );
    }

    const { error: delErr } = await supabase
      .from("tests")
      .delete()
      .ilike("username", username)
      .ilike("gamemode", gamemode);

    if (delErr) return json({ error: delErr.message }, 500);

    const details = existing
      .map((r) => `${r.gamemode}: ${r.rank} (${r.points}pt)`)
      .join(", ");

    return json({
      ok: true,
      removedCount: existing.length,
      modes: gamemode,
      details,
    });
  }

  // Delete ALL entries for this username
  const { data: existing, error: findErr } = await supabase
    .from("tests")
    .select("id, username, gamemode, rank, points")
    .ilike("username", username);

  if (findErr) return json({ error: findErr.message }, 500);

  if (!existing || existing.length === 0) {
    return json(
      {
        error: `Player "${username}" not found on tierlist`,
      },
      404
    );
  }

  const { error: delErr } = await supabase
    .from("tests")
    .delete()
    .ilike("username", username);

  if (delErr) return json({ error: delErr.message }, 500);

  const modesList = [...new Set(existing.map((r) => r.gamemode))].join(", ");
  const details = existing
    .map((r) => `${r.gamemode}: ${r.rank} (${r.points}pt)`)
    .join(", ");

  return json({
    ok: true,
    removedCount: existing.length,
    modes: modesList,
    details,
  });
}
