// app/api/audit-log/route.js
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

// GET: Retrieve audit logs with filtering
export async function GET(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  const { searchParams } = new URL(req.url);
  const action = (searchParams.get("action") || "").trim();
  const username = (searchParams.get("username") || "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);

  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action) {
    query = query.eq("action", action);
  }

  if (username) {
    query = query.ilike("target_username", username);
  }

  const { data, error } = await query;

  if (error) return json({ error: error.message }, 500);
  return json({ logs: data || [] });
}

// POST: Log an audit event (called by admin actions)
export async function POST(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  let body = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const {
    admin_name,
    action, // "tier_save", "tier_delete", "player_remove", "admin_login"
    target_username,
    gamemode,
    old_rank,
    new_rank,
    old_points,
    new_points,
    details, // JSON string with extra details
  } = body;

  if (!admin_name || !action) {
    return json(
      { error: "Missing admin_name or action" },
      400
    );
  }

  const logEntry = {
    admin_name,
    action,
    target_username: target_username || null,
    gamemode: gamemode || null,
    old_rank: old_rank || null,
    new_rank: new_rank || null,
    old_points: old_points !== undefined ? parseInt(old_points) : null,
    new_points: new_points !== undefined ? parseInt(new_points) : null,
    details: details || null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("audit_logs")
    .insert([logEntry])
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, log: data }, 201);
}
