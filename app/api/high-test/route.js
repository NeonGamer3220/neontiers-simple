// app/api/high-test/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ADMIN_API_KEY = process.env.BOT_API_KEY || process.env.ADMIN_API_KEY || "";

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

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function requireAdmin(authHeader) {
  if (!ADMIN_API_KEY) {
    return json({ error: "Admin API key is not configured", need_env: ["BOT_API_KEY", "ADMIN_API_KEY"] }, 500);
  }
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Missing or invalid authorization header" }, 401);
  }
  const token = authHeader.slice(7);
  if (token !== ADMIN_API_KEY) {
    return json({ error: "Invalid API key" }, 403);
  }
  return null;
}

function formatLine(label, text) {
  return `**__${label}:__**\n> ${text}`;
}

function tidyTier(tier) {
  if (!tier) return null;
  const trimmed = String(tier).trim();
  // Try to parse as ELO number
  const num = Number(trimmed);
  if (!Number.isNaN(num)) return num;
  // Legacy tier strings - convert to ELO
  const LEGACY_TIER_TO_ELO = {
    LT5: 500, HT5: 750, LT4: 1000, HT4: 1250,
    LT3: 1500, HT3: 1750, LT2: 2000, HT2: 2250,
    LT1: 2500, HT1: 2750,
  };
  const upper = trimmed.toUpperCase();
  return LEGACY_TIER_TO_ELO[upper] ?? null;
}

function validFightText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(req) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const authError = requireAdmin(authHeader);
  if (authError) return authError;

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const discordName = body.discord_name || body.discordName || body.discord || "";
  const minecraftName = body.minecraft_name || body.minecraftName || body.minecraft || "";
  const success = body.success === true || body.success === "true";
  const tier = tidyTier(body.tier || body.rank || body.testedTier || "");
  const gamemode = body.gamemode || body.mode || body.gameMode || "";
  const fightNotes = body.fightNotes || body.fights || {};

  if (!discordName || !minecraftName || !tier || !gamemode) {
    return json(
      {
        error: "Missing required fields",
        required: ["discord_name", "minecraft_name", "tier", "gamemode"],
      },
      400
    );
  }

  const resultText = success ? "Sikeres" : "Sikertelen";
  const modeIcon = MODE_ICONS[gamemode] || "🎮";

  const header = `${discordName} - ${minecraftName} - **${resultText} volt ${tier} teszten.**`;
  const modeLine = `**__Gamemode__** ${modeIcon} ${gamemode}`;

  const orderedTiers = [1500, 1750, 2000, 2250, 2500, 2750];
  const fightSections = orderedTiers
    .filter((elo) => validFightText(fightNotes[elo]))
    .map((elo) => formatLine(`${elo} ELO Fightok`, fightNotes[elo].trim()));

  if (fightSections.length === 0) {
    return json({ error: "At least one fight note must be provided", required: ["fightNotes.1500", "fightNotes.1750", "fightNotes.2000", "fightNotes.2250", "fightNotes.2500", "fightNotes.2750"] }, 400);
  }

  const message = [header, "", modeLine, "", ...fightSections].join("\n\n");

  return json({
    ok: true,
    discord_channel: "high-test",
    message,
  });
}
