export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BOT_API_KEY = process.env.BOT_API_KEY || process.env.ADMIN_API_KEY || "";

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

function requireBotAuth(authHeader) {
  if (!BOT_API_KEY) {
    return json({ error: "Bot API key is not configured" }, 500);
  }
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Missing or invalid authorization header" }, 401);
  }
  const token = authHeader.slice(7);
  if (token !== BOT_API_KEY) {
    return json({ error: "Invalid API key" }, 403);
  }
  return null;
}

const MODE_ICONS = {
  Vanilla: "🌾",
  UHC: "💀",
  Pot: "🧪",
  NethPot: "🕷️",
  SMP: "🌍",
  Sword: "⚔️",
  Axe: "🪓",
  Mace: "🔨",
  Cart: "🛒",
  Creeper: "💣",
  DiaSMP: "💎",
  OGVanilla: "🌿",
  ShieldlessUHC: "🛡️",
  SpearMace: "🗡️",
  SpearElytra: "🪶",
  "Stick Fight": "🪵",
  Trident: "🔱",
};

// GET: Bot lekérheti a feldolgozatlan értesítéseket
export async function GET(req) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const authError = requireBotAuth(authHeader);
  if (authError) return authError;

  if (!supabase) return json({ error: "Supabase not configured" }, 500);

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  const { data, error } = await supabase
    .from("discord_notifications")
    .select("*")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) return json({ error: error.message }, 500);

  return json({ notifications: data || [] });
}

// POST: Bot jelzi, hogy feldolgozta az értesítéseket
export async function POST(req) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const authError = requireBotAuth(authHeader);
  if (authError) return authError;

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { ids } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return json({ error: "ids array is required" }, 400);
  }

  const { error } = await supabase
    .from("discord_notifications")
    .update({ processed: true })
    .in("id", ids);

  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, updated: ids.length });
}
