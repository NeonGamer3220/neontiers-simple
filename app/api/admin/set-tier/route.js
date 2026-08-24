// app/api/admin/set-tier/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { rateLimit, rateLimitResponse } from "../../../_lib/rateLimit";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TIER_CHANGE_CHANNEL_ID = process.env.TIER_CHANGE_DISCORD_CHANNEL_ID || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

const TIER_TO_POINTS = {
  LT5: 1, HT5: 2, LT4: 3, HT4: 4,
  LT3: 6, HT3: 10, LT2: 16, HT2: 22,
  LT1: 40, HT1: 60,
};
const KNOWN_TIERS = new Set(Object.keys(TIER_TO_POINTS));

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || !session.value) return null;
  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}

// POST: manually set/overwrite a player's tier for a gamemode from the
// admin panel (used by the "Magas Eredmény Kezelő" tier-editor). Writes to
// the same "tests" table + rank_history + discord_notifications outbox
// that the public /api/tests endpoint uses, so profile charts and the
// Discord tier-change post stay consistent regardless of which path a
// tier update came through.
export async function POST(req) {
  const limited = rateLimit(req, "admin-set-tier", { limit: 30, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  if (!supabase) {
    return json({ error: "Supabase nincs konfigurálva" }, 500);
  }

  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);
  const role = String(admin.role || "").toLowerCase();
  if (role !== "owner" && role !== "regulator") {
    return json({ error: "Nincs jogosultságod ehhez" }, 403);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Érvénytelen JSON" }, 400);
  }

  const username = String(body.username || "").trim();
  const gamemode = String(body.gamemode || "").trim();
  const rank = String(body.rank || "").trim().toUpperCase();
  const retired = body.retired === true;

  if (!username) return json({ error: "Hiányzó felhasználónév" }, 400);
  if (!gamemode) return json({ error: "Hiányzó gamemode" }, 400);
  if (!KNOWN_TIERS.has(rank)) return json({ error: "Érvénytelen tier" }, 400);

  if (
    role === "regulator" &&
    String(admin.admin_name || "").trim().toLowerCase() === username.toLowerCase()
  ) {
    return json({ error: "Regulátorként nem állíthatsz be tiert saját magadnak" }, 403);
  }

  const points = TIER_TO_POINTS[rank];

  const { data: previousRow } = await supabase
    .from("tests")
    .select("rank,points")
    .ilike("username", username)
    .ilike("gamemode", gamemode)
    .maybeSingle();

  const createdAt = new Date().toISOString();
  const { data: saved, error: saveErr } = await supabase
    .from("tests")
    .upsert(
      { username, gamemode, rank, points, retired, created_at: createdAt },
      { onConflict: "username,gamemode" }
    )
    .select("id,username,gamemode,rank,points,retired,created_at")
    .maybeSingle();

  if (saveErr) return json({ error: saveErr.message }, 500);

  try {
    await supabase.from("rank_history").insert({
      username, gamemode, rank, points, retired, created_at: createdAt,
    });
  } catch (e) {
    console.error("rank_history insert failed:", e?.message || e);
  }

  const oldRank = previousRow?.rank ? String(previousRow.rank).toUpperCase() : null;
  if (oldRank !== rank && TIER_CHANGE_CHANNEL_ID) {
    try {
      const headerLine = oldRank
        ? `**${username}** tierje frissült ${gamemode} módban: \`${oldRank}\` → \`${rank}\` (${admin.admin_name || "admin"} által)`
        : `**${username}** új tesztet kapott ${gamemode} módban: \`${rank}\` (${admin.admin_name || "admin"} által)`;
      await supabase.from("discord_notifications").insert({
        username, gamemode, result: rank,
        old_rank: oldRank, new_rank: rank,
        event_type: "tier_change",
        channel_id: TIER_CHANGE_CHANNEL_ID,
        message: headerLine,
        processed: false,
      });
    } catch (e) {
      console.error("tier-change discord notification failed:", e?.message || e);
    }
  }

  try {
    await supabase.from("audit_logs").insert({
      admin_name: admin.admin_name || "unknown",
      action: "tier_manual_set",
      target_username: username,
      gamemode,
      old_rank: oldRank,
      new_rank: rank,
      old_points: previousRow?.points ?? null,
      new_points: points,
      details: { retired },
      created_at: createdAt,
    });
  } catch (e) {
    console.error("Failed to write tier_manual_set audit log:", e?.message || e);
  }

  return json({ ok: true, saved });
}
