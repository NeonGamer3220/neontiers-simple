// app/api/admin/linked-accounts/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { resolveDiscordUsernames } from "../../../_lib/discord";

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
  let normalized = rows.map(normalizeRow);

  // discord_username isn't always cached yet (e.g. never resolved before, or
  // the account was linked before we started storing it). Backfill a chunk
  // of the missing ones on the fly so search-by-Discord-name keeps working
  // and gradually catches up — a full backfill can also be triggered from
  // the admin panel via /api/admin/linked-accounts/refresh-discord-names.
  const missing = normalized.filter((r) => r.discordId && !r.discordUsername).slice(0, 60);
  if (missing.length > 0) {
    const resolved = await resolveDiscordUsernames(missing.map((r) => r.discordId));
    if (resolved.size > 0) {
      normalized = normalized.map((r) =>
        resolved.has(r.discordId) ? { ...r, discordUsername: resolved.get(r.discordId) } : r
      );
      // Persist so we don't have to re-resolve these on the next search.
      await Promise.all(
        missing
          .filter((r) => resolved.has(r.discordId))
          .map((r) =>
            supabase.from("linked_accounts").update({ discord_username: resolved.get(r.discordId) }).eq("id", r.id)
          )
      );
    }
  }

  const matches = normalized
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
