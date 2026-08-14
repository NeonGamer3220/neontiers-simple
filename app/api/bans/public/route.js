// app/api/bans/public/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { rateLimit, rateLimitResponse } from "../../../_lib/rateLimit";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

function json(data, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

// GET /api/bans/public — public, unauthenticated. Returns ONLY the
// usernames of players whose ban is currently active (active=true and not
// expired). No reason/discord_id/banned_by leak here — those stay behind
// the admin-only /api/admin/bans route. Used by the public leaderboard to
// flag banned players.
export async function GET(req) {
  const limited = rateLimit(req, "bans-public-get", { limit: 120, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  if (!supabase) return json({ usernames: [] }, 200, "public, s-maxage=30, stale-while-revalidate=30");

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("bans")
    .select("username")
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  if (error) return json({ usernames: [] }, 200, "no-store");

  const usernames = Array.from(
    new Set((data || []).map((r) => String(r?.username || "").trim().toLowerCase()).filter(Boolean))
  );

  return json({ usernames }, 200, "public, s-maxage=30, stale-while-revalidate=30");
}
