// app/api/admin/high-test/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { rateLimit, rateLimitResponse } from "../../../_lib/rateLimit";

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
// Gamemode -> Discord custom emoji. Fill in your real emoji ids/names here;
// anything left blank falls back to a generic controller emoji.
const GAMEMODE_EMOJIS = {
  Vanilla: "<:vanilla:1489191023308574730>",
  UHC: "<:uhc:1489191005902209134>",
  Pot: "<:pot:1489190923333013597>",
  NethPot: "<:nethpot:1489190890550464543>",
  SMP: "<:smp:1489190957306871938>",
  Sword: "<:sword:1489190989150163034>",
  Axe: "<:axe:1489190775085338817>",
  Mace: "<:mace:1489190873777438791>",
  Cart: "<:cart:1489190821390581860>",
  Creeper: "<:creeper:1489190838763393104>",
  DiaSMP: "<:diasmp:1489190856903757884>",
  OGVanilla: "<:ogvanilla:1489190908477046804>",
  ShieldlessUHC: "<:shieldlessuhc:1489190941872095292>",
  SpearMace: "<:spearmace:1489190973400416359>",
  SpearElytra: "<:spearelytra:1489190973400416359>",
  Trident: "<:trident:1505194733629210664>",

  Boxing: "<:Boxing:1520465463358783639>",
  Combo: "<:Combo:1520465407474008147>",
  Bridge: "<:Bridge:1520465430957916331>",
  "No Debuff": "<:NoDebuff:1520465050974814319>",
  OP: "<:OP:1520465323680075937>",
  Soup: "<:Soup:1520465218096857280>",
  "Fireball Fight": "<:FireballFight:1520465183884181636>",
};
const DEFAULT_MODE_EMOJI = "🎮";

const TIER_ORDER = ["LT3", "HT3", "LT2", "HT2", "LT1", "HT1"];
const TIER_TO_ELO = { LT3: 1500, HT3: 1750, LT2: 2000, HT2: 2250, LT1: 2500, HT1: 2750 };

// FT (first-to) counts per gamemode — mirrors the client-side score-option
// generator so a tampered/forged score can't be saved.
const FT_MODERN = {
  Vanilla: 4, SMP: 4, Cart: 4, DiaSMP: 4, OGVanilla: 4, NethPot: 4,
  Mace: 4, SpearMace: 4, SpearElytra: 4, Trident: 4,
  Sword: 10, UHC: 10, Pot: 10, Creeper: 10, ShieldlessUHC: 10,
  Axe: 20,
};
const FT_LEGACY = {
  Boxing: 4, Combo: 4, "Fireball Fight": 4, Soup: 4, OP: 4, "No Debuff": 4,
  Bridge: 10,
};

function getFT(category, gamemode) {
  const map = category === "legacy" ? FT_LEGACY : FT_MODERN;
  return map[gamemode] || null;
}

function isValidScore(category, gamemode, won, score) {
  const ft = getFT(category, gamemode);
  if (!ft) return false;
  const m = /^(\d+)-(\d+)$/.exec(String(score || "").trim());
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (won) return a === ft && b >= 0 && b < ft;
  return b === ft && a >= 0 && a < ft;
}

export async function POST(req) {
  const limited = rateLimit(req, "admin-high-test", { limit: 20, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

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
  const testedTier = String(body.testedTier || "").toUpperCase();
  const gamemode = String(body.gamemode || "").trim();
  const fights = Array.isArray(body.fights) ? body.fights : [];
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
  if (!gamemode || !getFT(category, gamemode)) {
    return json({ error: "Válassz érvényes gamemode-ot" }, 400);
  }
  if (fights.length === 0) {
    return json({ error: "Legalább egy fightot hozzá kell adni" }, 400);
  }

  const cleanFights = [];
  for (const f of fights) {
    const tier = String(f?.tier || "").toUpperCase();
    const won = f?.won === true;
    const score = String(f?.score || "").trim();
    const opponent = String(f?.opponent || "").trim();
    const comment = String(f?.comment || "").trim();

    if (!TIER_ORDER.includes(tier)) {
      return json({ error: "Minden fighthoz érvényes tiert kell választani" }, 400);
    }
    if (!opponent) {
      return json({ error: "Minden fighthoz meg kell adni az ellenfelet" }, 400);
    }
    if (!isValidScore(category, gamemode, won, score)) {
      return json({ error: `Érvénytelen eredmény (${score || "?"}) ehhez a gamemode-hoz` }, 400);
    }
    cleanFights.push({ tier, won, score, opponent, comment });
  }

  const overallWon = cleanFights[cleanFights.length - 1].won;
  const resultText = overallWon ? "Sikeres" : "Sikertelen";
  const modeEmoji = GAMEMODE_EMOJIS[gamemode] || DEFAULT_MODE_EMOJI;

  const headerLine = `<@${discordId}> (\`${minecraftName}\`) - **${resultText} volt a ${testedTier} teszten**`;
  const modeLine = `${modeEmoji} **${gamemode}**`;

  const fightBlocks = TIER_ORDER.filter((t) => cleanFights.some((f) => f.tier === t)).map((t) => {
    const lines = cleanFights
      .filter((f) => f.tier === t)
      .map((f) => {
        const verb = f.won ? "nyert" : "vesztett";
        const commentPart = f.comment ? ` (${f.comment})` : "";
        return `> ${verb} ${f.score} ${f.opponent}${commentPart}`;
      });
    return `**__${t} Fightok:__**\n${lines.join("\n")}`;
  });

  const message = [headerLine, modeLine, ...fightBlocks].join("\n\n");

  const { error: insertError } = await supabase.from("discord_notifications").insert({
    username: minecraftName,
    gamemode,
    tested_tier_start: TIER_TO_ELO[testedTier] || null,
    result: resultText,
    fight_notes: cleanFights,
    channel_id: CHANNEL_IDS[category],
    category,
    tested_tier: testedTier,
    player_discord_id: discordId,
    message,
    event_type: "high_test",
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
      details: { category, success: overallWon, discordId, fights: cleanFights },
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to write high_score_save audit log:", e?.message || e);
  }

  return json({ ok: true, message, channel_id: CHANNEL_IDS[category] });
}
