// app/api/rank-history/route.js
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

function json(data, status = 200, cacheControl = "public, s-maxage=60, stale-while-revalidate=120") {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

// GET /api/rank-history?username=...[&gamemode=...]
// Returns every historical tier entry for a player, oldest first, so the
// profile page can plot a progress line per gamemode.
export async function GET(req) {
  if (!supabase) {
    return json({ error: "Supabase is not configured" }, 500, "no-store");
  }

  const { searchParams } = new URL(req.url);
  const username = (searchParams.get("username") || "").trim();
  const gamemode = (searchParams.get("gamemode") || "").trim();

  if (!username) {
    return json({ error: "Missing username" }, 400, "no-store");
  }

  let query = supabase
    .from("rank_history")
    .select("id,username,gamemode,rank,points,retired,created_at")
    .ilike("username", username)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (gamemode) query = query.ilike("gamemode", gamemode);

  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500, "no-store");

  return json({ history: Array.isArray(data) ? data : [] });
}
