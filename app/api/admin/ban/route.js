// app/api/admin/ban/route.js
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

// A ban naplózás Discord csatornája.
const BAN_CHANNEL_ID = "1469803060976160822";

// value -> { label, days } (days: null == végleges)
const DURATIONS = {
  "1d": { label: "1 nap", days: 1 },
  "3d": { label: "3 nap", days: 3 },
  "1w": { label: "1 hét", days: 7 },
  "2w": { label: "2 hét", days: 14 },
  "1m": { label: "1 hónap", days: 30 },
  "3m": { label: "3 hónap", days: 90 },
  "6m": { label: "6 hónap", days: 180 },
  "1y": { label: "1 év", days: 365 },
  perm: { label: "Végleges", days: null },
};

export async function POST(req) {
  if (!supabase) {
    return json({ error: "Supabase nincs konfigurálva", need_env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] }, 500);
  }

  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);
  const role = String(admin.role || "").toLowerCase();
  if (role !== "owner") {
    return json({ error: "Csak az Owner rang jogosult banolni" }, 403);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Érvénytelen JSON" }, 400);
  }

  const player = body.player || {};
  const minecraftName = String(player.minecraftName || "").trim();
  const discordId = String(player.discordId || "").trim();
  const uuid = String(body.uuid || "").trim();
  const reason = String(body.reason || "").trim();
  const durationKey = String(body.duration || "").trim();

  if (!minecraftName || !discordId) {
    return json({ error: "Válassz ki egy játékost a linkelt fiókok közül" }, 400);
  }
  if (!reason) {
    return json({ error: "Az indoklás megadása kötelező" }, 400);
  }
  const durationInfo = DURATIONS[durationKey];
  if (!durationInfo) {
    return json({ error: "Érvénytelen időtartam" }, 400);
  }

  const now = new Date();
  const expiresAt = durationInfo.days ? new Date(now.getTime() + durationInfo.days * 86400000) : null;
  const lejaratText = durationInfo.days ? `${durationInfo.label} múlva` : "Sosem (végleges)";

  const headerLine = `<@${discordId}> - \`${minecraftName}\`${uuid ? ` (\`${uuid}\`)` : ""}`;
  const reasonBlock = reason
    .split("\n")
    .map((line) => `> ${line.trim()}`)
    .join("\n");
  const message = [headerLine, reasonBlock, `**Lejárat:** ${lejaratText}`].join("\n\n");

  const { error: insertError } = await supabase.from("discord_notifications").insert({
    username: minecraftName,
    gamemode: "ban",
    result: "Ban",
    channel_id: BAN_CHANNEL_ID,
    player_discord_id: discordId,
    message,
    processed: false,
  });

  if (insertError) {
    return json({ error: insertError.message }, 500);
  }

  try {
    await supabase.from("audit_logs").insert({
      admin_name: admin.admin_name || "unknown",
      action: "ban_issued",
      target_username: minecraftName,
      details: { discordId, uuid, reason, duration: durationKey, expiresAt },
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to write ban_issued audit log:", e?.message || e);
  }

  return json({ ok: true, message, channel_id: BAN_CHANNEL_ID, expiresAt });
}
