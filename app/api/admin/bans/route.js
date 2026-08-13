// app/api/admin/bans/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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

// GET /api/admin/bans — returns every ban row flagged active=true whose
// expiry (if any) hasn't passed yet. The dashboard uses the usernames from
// this list to show "Kitiltva" instead of "Aktív" in Globális Állapot.
export async function GET() {
  if (!supabase) return json({ error: "Supabase nincs konfigurálva" }, 500);

  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("bans")
    .select("id,username,discord_id,reason,duration_key,expires_at,banned_by,created_at")
    .eq("active", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);

  return json({ bans: Array.isArray(data) ? data : [] });
}
