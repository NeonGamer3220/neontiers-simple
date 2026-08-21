// app/api/admin/discord-debug/route.js
// TEMPORARY debug endpoint — delete after diagnosing the discord_username
// resolution issue. Bypasses the silent try/catch in _lib/discord.js so we
// can see the actual HTTP status/body Discord returns.
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
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

export async function GET(req) {
  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);

  const { searchParams } = new URL(req.url);
  const discordId = (searchParams.get("id") || "").trim();

  if (!DISCORD_BOT_TOKEN) {
    return json({ error: "DISCORD_BOT_TOKEN missing at runtime" }, 500);
  }

  // 1. Verify the token itself works (bot identity check)
  const meRes = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    cache: "no-store",
  });
  const meBody = await meRes.json().catch(() => ({}));

  let userCheck = null;
  if (discordId) {
    const userRes = await fetch(`https://discord.com/api/v10/users/${encodeURIComponent(discordId)}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      cache: "no-store",
    });
    const userBody = await userRes.json().catch(() => ({}));
    userCheck = { status: userRes.status, body: userBody };
  }

  return json({
    tokenPresent: true,
    tokenLength: DISCORD_BOT_TOKEN.length,
    botIdentity: { status: meRes.status, body: meBody },
    userLookup: userCheck,
  });
}
