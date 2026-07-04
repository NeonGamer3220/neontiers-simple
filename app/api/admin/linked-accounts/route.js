// app/api/admin/linked-accounts/route.js
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

// Field-name candidates, in priority order, for each logical value we need.
const MC_NAME_KEYS = ["minecraft_name", "minecraft_username", "mc_name", "ign", "username", "minecraft"];
const DISCORD_ID_KEYS = ["discord_id", "discord_user_id", "discordid", "user_id"];
const DISCORD_NAME_KEYS = ["discord_username", "discord_name", "discord_tag", "discord"];

function pickKey(row, candidates) {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return "";
}

function normalizeRow(row) {
  return {
    id: row.id ?? null,
    minecraftName: pickKey(row, MC_NAME_KEYS),
    discordId: pickKey(row, DISCORD_ID_KEYS),
    discordUsername: pickKey(row, DISCORD_NAME_KEYS),
  };
}

export async function GET(req) {
  if (!supabase) {
    return json({ error: "Supabase nincs konfigurálva", need_env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] }, 500);
  }

  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || searchParams.get("search") || "").trim().toLowerCase();

  if (!q) return json({ results: [] });

  const { data, error } = await supabase.from("linked_accounts").select("*").limit(1000);
  if (error) return json({ error: error.message }, 500);

  const rows = Array.isArray(data) ? data : [];
  const matches = rows
    .map(normalizeRow)
    .filter((r) => {
      if (!r.minecraftName && !r.discordUsername && !r.discordId) return false;
      return (
        r.minecraftName.toLowerCase().includes(q) ||
        r.discordUsername.toLowerCase().includes(q) ||
        r.discordId.toLowerCase().includes(q)
      );
    })
    .slice(0, 15);

  return json({ results: matches });
}
