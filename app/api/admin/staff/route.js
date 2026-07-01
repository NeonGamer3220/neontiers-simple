import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

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

async function getAdminFromSession() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    if (!session || !session.value) return null;
    const parsed = JSON.parse(session.value);
    return parsed;
  } catch {
    return null;
  }
}

async function resolveAdminName(adminSession) {
  if (!adminSession) return null;
  if (adminSession.admin_name) return adminSession.admin_name;
  if (adminSession.adminId && supabase) {
    const { data } = await supabase
      .from("admins")
      .select("admin_name")
      .eq("id", adminSession.adminId)
      .single();
    return data?.admin_name || null;
  }
  return null;
}

export async function GET(req) {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) return json({ error: "Missing env", need_env: missing }, 500);

  const adminSession = await getAdminFromSession();
  if (!adminSession) return json({ error: "Not authenticated" }, 401);

  const sessionRole = String(adminSession.role || "").toLowerCase();
  if (sessionRole !== "owner") {
    return json({ error: "Hozzáférés megtagadva: csak Owner f érhető ehhez" }, 403);
  }

  const resolvedName = await resolveAdminName(adminSession);
  if (!resolvedName) return json({ error: "Invalid session" }, 401);

  const { searchParams } = new URL(req.url);
  const action = (searchParams.get("action") || "list").trim();

  if (action === "list") {
    const { data, error } = await supabase
      .from("admins")
      .select("id, admin_name, role, created_at")
      .order("created_at", { ascending: true });

    if (error) return json({ error: error.message }, 500);
    return json({ staff: data || [] });
  }

  return json({ error: "Invalid action" }, 400);
}

export async function POST(req) {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) return json({ error: "Missing env", need_env: missing }, 500);

  const adminSession = await getAdminFromSession();
  if (!adminSession) return json({ error: "Not authenticated" }, 401);

  const sessionRole = String(adminSession.role || "").toLowerCase();
  if (sessionRole !== "owner") {
    return json({ error: "Hozzáférés megtagadva: csak Owner f érhető ehhez" }, 403);
  }

  const resolvedName = await resolveAdminName(adminSession);
  if (!resolvedName) return json({ error: "Invalid session" }, 401);

  let body = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { action } = body;

  if (!action) return json({ error: "Missing action" }, 400);

  if (action === "create") {
    const { admin_name, admin_password, role } = body;

    if (!admin_name || !admin_password || !role) {
      return json({ error: "Missing fields: admin_name, admin_password, role" }, 400);
    }

    const { data: existing } = await supabase
      .from("admins")
      .select("id")
      .eq("admin_name", admin_name)
      .maybeSingle();

    if (existing) {
      return json({ error: `Admin "${admin_name}" már létezik` }, 409);
    }

    const { data, error } = await supabase
      .from("admins")
      .insert({
        admin_name,
        admin_password,
        role,
      })
      .select("id, admin_name, role, created_at")
      .single();

    if (error) return json({ error: error.message }, 500);

    await supabase.from("audit_logs").insert({
      admin_name: resolvedName,
      action: "staff_create",
      target_username: admin_name,
      gamemode: null,
      old_rank: null,
      new_rank: null,
      old_points: null,
      new_points: null,
      details: { role },
      created_at: new Date().toISOString(),
    });

    return json({ ok: true, staff: data }, 201);
  }

  if (action === "update") {
    const { id, admin_name, admin_password, role } = body;

    if (!id) return json({ error: "Missing id" }, 400);

    const updateData = {};
    if (admin_name) updateData.admin_name = admin_name;
    if (admin_password) updateData.admin_password = admin_password;
    if (role) updateData.role = role;

    if (Object.keys(updateData).length === 0) {
      return json({ error: "No fields to update" }, 400);
    }

    const { data, error } = await supabase
      .from("admins")
      .update(updateData)
      .eq("id", id)
      .select("id, admin_name, role, created_at")
      .single();

    if (error) return json({ error: error.message }, 500);

    await supabase.from("audit_logs").insert({
      admin_name: resolvedName,
      action: "staff_update",
      target_username: data.admin_name,
      gamemode: null,
      old_rank: null,
      new_rank: null,
      old_points: null,
      new_points: null,
      details: { updated_fields: Object.keys(updateData) },
      created_at: new Date().toISOString(),
    });

    return json({ ok: true, staff: data });
  }

  if (action === "delete") {
    const { id } = body;

    if (!id) return json({ error: "Missing id" }, 400);

    const { data: target } = await supabase
      .from("admins")
      .select("admin_name")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("admins")
      .delete()
      .eq("id", id);

    if (error) return json({ error: error.message }, 500);

    await supabase.from("audit_logs").insert({
      admin_name: resolvedName,
      action: "staff_delete",
      target_username: target?.admin_name || "unknown",
      gamemode: null,
      old_rank: null,
      new_rank: null,
      old_points: null,
      new_points: null,
      details: null,
      created_at: new Date().toISOString(),
    });

    return json({ ok: true });
  }

  return json({ error: "Invalid action" }, 400);
}
