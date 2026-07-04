// app/api/admin/high-test/route.js
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

// Discord channel per category.
const CHANNEL_IDS = {
  legacy: "1521949875279761538",
  modern: "1521949934679756950",
};

// Gamemode -> Discord custom emoji. Fill in your real emoji ids/names here;
// anything left blank falls back to a generic controller emoji.
const GAMEMODE_EMOJIS = {
  Cart: "<:cart:1433825435568836679>",
};
const DEFAULT_MODE_EMOJI = "🎮";

const TIER_ORDER = ["LT3", "HT3", "LT2", "HT2", "LT1", "HT1"];
const HIGH_TIER_THRESHOLD_INDEX = TIER_ORDER.indexOf("HT3"); // "HT3 vagy afeletti"

const TIER_TO_ELO = { LT3: 1500, HT3: 1750, LT2: 2000, HT2: 2250, LT1: 2500, HT1: 2750 };

export async function POST(req) {
  if (!supabase) {
    return json({ error: "Supabase nincs konfigurálva", need_env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] }, 500);
  }

  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);
  const role = String(admin.role || "").toLowerCase();
  if (role !== "owner" && role !== "regulator") {
    return json({ error: "Nincs jogosultságod ehhez" }, 403);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Érvénytelen JSON" }, 400);
  }

  const category = String(body.category || "").toLowerCase(); // legacy | modern
  const success = body.success === true;
  const testedTier = String(body.testedTier || "").toUpperCase();
  const gamemode = String(body.gamemode || "").trim();
  const fights = body.fights && typeof body.fights === "object" ? body.fights : {};
  const player = body.player || {};
  const minecraftName = String(player.minecraftName || "").trim();
  const discordId = String(player.discordId || "").trim();

  if (category !== "legacy" && category !== "modern") {
    return json({ error: "Érvénytelen kategória (legacy vagy modern szükséges)" }, 400);
  }
  if (!minecraftName || !discordId) {
    return json({ error: "Válassz ki egy játékost a linkelt fiókok közül" }, 400);
  }
  if (!TIER_ORDER.includes(testedTier)) {
    return json({ error: "Érvénytelen tesztelt tier" }, 400);
  }
  if (!gamemode) {
    return json({ error: "Válassz gamemode-ot" }, 400);
  }

  const filledFights = TIER_ORDER.filter((t) => String(fights[t] || "").trim().length > 0);

  if (filledFights.length === 0) {
    return json({ error: "Legalább egy Fightok mezőt ki kell tölteni" }, 400);
  }

  const testedTierIndex = TIER_ORDER.indexOf(testedTier);
  if (testedTierIndex >= HIGH_TIER_THRESHOLD_INDEX && filledFights.length === 0) {
    return json({ error: "HT3 vagy afeletti tierhez legalább egy magas eredmény mezőt ki kell tölteni" }, 400);
  }

  const resultText = success ? "Sikeres" : "Sikertelen";
  const modeEmoji = GAMEMODE_EMOJIS[gamemode] || DEFAULT_MODE_EMOJI;

  const headerLine = `<@${discordId}> (\`${minecraftName}\`) - **${resultText} volt a ${testedTier} teszten** ${modeEmoji} **${gamemode}**`;

  const fightBlocks = TIER_ORDER.filter((t) => filledFights.includes(t)).map((t) => {
    const text = String(fights[t]).trim();
    return `**__${t} Fightok:__**\n${text
      .split("\n")
      .map((line) => `> ${line.trim()}`)
      .join("\n")}`;
  });

  const message = [headerLine, "", ...fightBlocks].join("\n\n");

  const { error: insertError } = await supabase.from("discord_notifications").insert({
    username: minecraftName,
    gamemode,
    tested_tier_start: TIER_TO_ELO[testedTier] || null,
    result: resultText,
    fight_notes: fights,
    channel_id: CHANNEL_IDS[category],
    category,
    tested_tier: testedTier,
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
      action: "high_score_save",
      target_username: minecraftName,
      gamemode,
      old_rank: null,
      new_rank: testedTier,
      old_points: null,
      new_points: null,
      details: { category, success, discordId, fights },
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to write high_score_save audit log:", e?.message || e);
  }

  return json({ ok: true, message, channel_id: CHANNEL_IDS[category] });
}
