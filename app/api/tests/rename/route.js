// app/api/tests/rename/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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

async function checkAdminSession() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    if (session && session.value) {
      try {
        const parsed = JSON.parse(session.value);
        return parsed?.admin_name || null;
      } catch (e) {
        // ignore parse errors
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function requireAdmin(authHeader) {
  if (!ADMIN_API_KEY) return null;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Missing API key" }, 401);
  }
  const token = authHeader.slice(7);
  if (token !== ADMIN_API_KEY) {
    return json({ error: "Invalid API key" }, 403);
  }
  return null;
}

function normalizeTestsRow(r) {
  if (!r || typeof r !== "object") return r;
  return {
    ...r,
    elo: r.rank,
  };
}

// POST: /api/tests/rename - Change player name on tierlist (admin only)
export async function POST(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const authError = requireAdmin(authHeader);
  if (authError) {
    const sessionAdmin = await checkAdminSession();
    if (!sessionAdmin) return authError;
  } else {
    const sessionAdmin = await checkAdminSession();
    if (!sessionAdmin && ADMIN_API_KEY) {
      return json({ error: "Not authenticated" }, 401);
    }
  }

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

  const { data: updated, error: updateErr } = await supabase
    .from("tests")
    .update({ username: newName })
    .ilike("username", oldName)
    .select("id, username, gamemode, rank, points, created_at");

  if (updateErr) return json({ error: updateErr.message }, 500);

  const admin_name = await checkAdminSession();
  if (admin_name) {
    try {
      await supabase.from("audit_logs").insert({
        admin_name,
        action: "player_rename",
        target_username: newName,
        gamemode: null,
        old_rank: null,
        new_rank: null,
        details: { old_name: oldName, new_name: newName },
      });
    } catch (e) {
      console.error("Audit log error:", e?.message || e);
    }
  }

  const normalizedUpdated = Array.isArray(updated)
    ? updated.map((item) => normalizeTestsRow(item))
    : [];

  return json(
    {
      ok: true,
      message: `Successfully renamed "${oldName}" to "${newName}"`,
      updatedCount: Array.isArray(existing) ? existing.length : 0,
      updatedRecords: normalizedUpdated,
    },
    200
  );
}

export async function PUT(req) {
  return POST(req);
}
