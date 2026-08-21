// app/api/admin/linked-accounts/refresh-discord-names/route.js
// One-off/manual bulk backfill: resolves discord_username for every
// linked_accounts row that's missing it, via the Discord API. The main
// search route also does this lazily in small chunks, but this lets an
// admin force a full catch-up in one go (e.g. right after adding the
// discord_username column, or after many new links piled up).
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { discordConfigured, resolveDiscordUsernames } from "../../../../_lib/discord";

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

export async function POST() {
  if (!supabase) {
    return json({ error: "Supabase nincs konfigurálva", need_env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] }, 500);
  }
  if (!discordConfigured()) {
    return json({ error: "DISCORD_BOT_TOKEN nincs beállítva" }, 500);
  }

  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);

  const { data, error } = await supabase
    .from("linked_accounts")
    .select("id, discord_id, discord_username")
    .limit(2000);
  if (error) return json({ error: error.message }, 500);

  const rows = Array.isArray(data) ? data : [];
  const missing = rows.filter((r) => r.discord_id && !r.discord_username);

  if (missing.length === 0) {
    return json({ ok: true, resolved: 0, total: rows.length, remaining: 0 });
  }

  const resolved = await resolveDiscordUsernames(missing.map((r) => r.discord_id));

  let updated = 0;
  for (const row of missing) {
    const name = resolved.get(row.discord_id);
    if (!name) continue;
    const { error: updateErr } = await supabase
      .from("linked_accounts")
      .update({ discord_username: name })
      .eq("id", row.id);
    if (!updateErr) updated += 1;
  }

  return json({
    ok: true,
    resolved: updated,
    total: rows.length,
    remaining: missing.length - updated,
  });
}
