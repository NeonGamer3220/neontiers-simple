// app/api/tests/retire/route.js
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
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

// POST: Retire/Unretire a player in a specific gamemode
export async function POST(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  let body = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const username = body?.username;
  const gamemode = body?.gamemode;
  const retired = body?.retired; // boolean

  if (!username || !gamemode) {
    return json(
      {
        error: "Missing username or gamemode",
        received: { username, gamemode },
      },
      400
    );
  }

  // Check if record exists
  const { data: existing, error: fetchErr } = await supabase
    .from("tests")
    .select("username,gamemode,retired")
    .ilike("username", username)
    .ilike("gamemode", gamemode)
    .maybeSingle();

  if (fetchErr) return json({ error: fetchErr.message }, 500);

  if (!existing) {
    return json(
      {
        error: "Player not found in this gamemode",
      },
      404
    );
  }

  // Update retired status
  const { data: updated, error: updateErr } = await supabase
    .from("tests")
    .update({ retired: retired === true })
    .ilike("username", username)
    .ilike("gamemode", gamemode)
    .select("username,gamemode,retired")
    .single();

  if (updateErr) return json({ error: updateErr.message }, 500);

  return json({
    ok: true,
    player: updated,
    message: retired ? "Player retired successfully" : "Player unretired successfully"
  });
}
