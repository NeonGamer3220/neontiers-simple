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

function normRank(s) {
  const r = String(s || "").trim();
  if (!r) return "";
  const up = r.toUpperCase();
  if (up === "UNRANKED") return "Unranked";
  return up;
}

function getAdminName() {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get("admin_session");
    if (session?.value) {
      const parsed = JSON.parse(session.value);
      return parsed?.admin_name || null;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function POST(req) {
  if (!supabase) {
    return json({ error: "Supabase not configured" }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const {
    username,
    gamemode,
    tested_tier,
    result,
    fight_notes,
  } = body;

  if (!username || !gamemode || !tested_tier) {
    return json({ error: "Missing required fields: username, gamemode, tested_tier" }, 400);
  }

  const rank = normRank(tested_tier);
  const tierPoints = RANK_POINTS[rank] ?? 0;

  // Get previous record for audit
  const { data: prev } = await supabase
    .from("tests")
    .select("id,username,gamemode,rank,points,created_at")
    .ilike("username", username)
    .ilike("gamemode", gamemode)
    .maybeSingle();

  // Save to main tests table
  const row = {
    username,
    gamemode,
    rank,
    points: tierPoints,
  };

  let saved = null;
  let saveErr = null;

  if (prev?.id) {
    const { data, error } = await supabase
      .from("tests")
      .update(row)
      .eq("id", prev.id)
      .select("id,username,gamemode,rank,points,created_at")
      .maybeSingle();
    saved = data;
    saveErr = error;
  }

  if (!saved && !saveErr) {
    const { data, error } = await supabase
      .from("tests")
      .upsert(row, { onConflict: "username,gamemode" })
      .select("id,username,gamemode,rank,points,created_at")
      .maybeSingle();
    saved = data;
    saveErr = error;
  }

if (saveErr) {
    return json({ error: saveErr.message }, 500);
  }

  // Audit log
  const admin_name = getAdminName();
  if (admin_name) {
    try {
      await supabase.from("audit_logs").insert({
        admin_name,
        action: "high_score_save",
        target_username: username,
        gamemode,
        old_rank: prev?.rank || null,
        new_rank: rank,
        old_points: prev?.points || null,
        new_points: tierPoints,
        details: { result, fight_notes },
      });
    } catch (e) {
      console.error("Audit log error:", e?.message || e);
    }
  }

  // Insert into discord_notifications table for the bot to pick up
  let notificationCreated = false;
  try {
    const { error: notifyErr } = await supabase.from("discord_notifications").insert({
      username,
      gamemode,
      tested_tier: rank,
      result: result || "Sikeres",
      fight_notes,
      processed: false,
    });
    if (notifyErr) {
      console.error("Failed to create notification:", notifyErr.message);
    } else {
      notificationCreated = true;
    }
  } catch (e) {
    console.error("Notification error:", e?.message || e);
  }

  return json({
    ok: true,
    saved,
    notification_created: notificationCreated,
  });
}