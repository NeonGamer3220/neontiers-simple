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

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(req) {
  if (!supabase) return json({ error: "Supabase not configured" }, 500);

  const sp = new URL(req.url).searchParams;
  const username = (sp.get("username") || "").trim();

  if (!username) return json({ error: "username required" }, 400);

  const { data, error } = await supabase
    .from("bans")
    .select("id,username,banned,reason,banned_at,expires_at")
    .ilike("username", username)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  return json(
    data || { username, banned: false, reason: null, banned_at: null, expires_at: null }
  );
}

export async function POST(req) {
  if (!supabase) return json({ error: "Supabase not configured" }, 500);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { username, reason, expires_at } = body;

  if (!username || !String(username).trim()) {
    return json({ error: "username required" }, 400);
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("bans")
    .upsert(
      {
        username: String(username).trim(),
        banned: true,
        reason: reason || null,
        banned_at: nowIso,
        expires_at: expires_at || null,
      },
      { onConflict: "username" }
    )
    .select("id,username,banned,reason,banned_at,expires_at")
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function DELETE(req) {
  if (!supabase) return json({ error: "Supabase not configured" }, 500);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { username } = body;
  if (!username || !String(username).trim()) {
    return json({ error: "username required" }, 400);
  }

  const { error } = await supabase
    .from("bans")
    .update({ banned: false, expires_at: null })
    .ilike("username", String(username).trim());

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

export const dynamic = "force-dynamic";
