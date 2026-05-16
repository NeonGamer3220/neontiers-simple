// app/api/audit-log/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const ADMIN_API_KEY = process.env.BOT_API_KEY || process.env.ADMIN_API_KEY || "";

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

  // Require admin session cookie for access
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    if (!session || !session.value) {
      return json({ error: "Not authenticated" }, 401);
    }
  } catch (e) {
    return json({ error: "Auth check failed" }, 401);
  }

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
  // Determine admin identity: prefer secure cookie, fallback to service API key
  let admin_name = null;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    if (session && session.value) {
      try {
        const parsed = JSON.parse(session.value);
        admin_name = parsed?.admin_name || null;
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore
  }

  // If no cookie, accept Authorization Bearer <ADMIN_API_KEY>
  if (!admin_name) {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      if (token === ADMIN_API_KEY && ADMIN_API_KEY) {
        admin_name = "service";
      }
    }
  }

  if (!admin_name) {
    return json({ error: "Not authenticated to write audit logs" }, 401);
  }

  const {
    action, // "tier_save", "tier_delete", "player_remove", "admin_login"
    target_username,
    gamemode,
    old_rank,
    new_rank,
    old_points,
    new_points,
    details, // JSON string with extra details
  } = body;

  if (!action) return json({ error: "Missing action" }, 400);

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
