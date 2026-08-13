// app/api/admin/bans/unban/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { rateLimit, rateLimitResponse } from "../../../../_lib/rateLimit";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
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

// POST { username } — deactivates every currently-active ban row for that
// username (sets active=false). Owner-only, mirrors the ban route's rules.
export async function POST(req) {
  const limited = rateLimit(req, "admin-unban", { limit: 20, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  if (!supabase) return json({ error: "Supabase nincs konfigurálva" }, 500);

  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);
  const role = String(admin.role || "").toLowerCase();
  if (role !== "owner") return json({ error: "Csak az Owner rang jogosult feloldani a bant" }, 403);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Érvénytelen JSON" }, 400);
  }

  const username = String(body.username || "").trim();
  if (!username) return json({ error: "Hiányzó felhasználónév" }, 400);

  const { error } = await supabase
    .from("bans")
    .update({ active: false })
    .ilike("username", username)
    .eq("active", true);

  if (error) return json({ error: error.message }, 500);

  try {
    await supabase.from("audit_logs").insert({
      admin_name: admin.admin_name || "unknown",
      action: "ban_lifted",
      target_username: username,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to write ban_lifted audit log:", e?.message || e);
  }

  return json({ ok: true });
}
