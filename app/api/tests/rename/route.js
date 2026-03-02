// app/api/tests/rename/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
// Admin API key - uses BOT_API_KEY from Discord bot for authentication
const ADMIN_API_KEY = process.env.BOT_API_KEY || process.env.ADMIN_API_KEY || "neontiers-admin-2024-secure";

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

// POST: /api/tests/rename - Change player name on tierlist (admin only)
export async function POST(req) {
  const missing = requireSupabase();
  if (missing) return missing;
  
  // Check admin authentication
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const authError = requireAdmin(authHeader);
  if (authError) return authError;
  
  let body = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  
  const oldName = pick(body, ["oldName", "old_name", "currentName", "current_name", "old", "previous", "from"]);
  const newName = pick(body, ["newName", "new_name", "name", "new"]);
  
  if (!oldName || !newName) {
    return json(
      {
        error: "Missing oldName or newName",
        received: { oldName, newName },
      },
      400
    );
  }
  
  // Check if old name exists
  const { data: existing, error: findErr } = await supabase
    .from("tests")
    .select("id, username, gamemode, rank, points, created_at")
    .ilike("username", oldName);
  
  if (findErr) return json({ error: findErr.message }, 500);
  
  if (!existing || existing.length === 0) {
    return json(
      {
        error: "Player not found",
        details: `No player found with name "${oldName}"`,
      },
      404
    );
  }
  
  // Update all records with old name to new name
  const { data: updated, error: updateErr } = await supabase
    .from("tests")
    .update({ username: newName })
    .ilike("username", oldName)
    .select("id, username, gamemode, rank, points, created_at");
  
  if (updateErr) return json({ error: updateErr.message }, 500);
  
  return json(
    {
      ok: true,
      message: `Successfully renamed "${oldName}" to "${newName}"`,
      updatedCount: updated ? updated.length : 0,
      updatedRecords: updated,
    },
    200
  );
}

// PUT: Also support PUT for compatibility
export async function PUT(req) {
  return POST(req);
}
