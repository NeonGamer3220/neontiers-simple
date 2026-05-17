export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

const MODE_ICONS = {
  Vanilla: "<:Vanilla:1489191023308574730>",
  UHC: "<:UHC:1489191005902209134>",
  Pot: "<:Pot:1489190923333013597>",
  NethPot: "<:NethPot:1489190890550464543>",
  SMP: "<:SMP:1489190957306871938>",
  Sword: "<:Sword:1489190989150163034>",
  Axe: "<:Axe:1489190775085338817>",
  Mace: "<:Mace:1489190873777438791>",
  Cart: "<:Cart:1489190821390581860>",
  Creeper: "<:Creeper:1489190838763393104>",
  DiaSMP: "<:DiaSMP:1489190856903757884>",
  OGVanilla: "<:OGVanilla:1489190908477046804>",
  ShieldlessUHC: "<:ShieldlessUHC:1489190941872095292>",
  SpearMace: "<:SpearMace:1489190973400416359>",
  SpearElytra: "<:SpearElytra:1489190973400416359>",
  "Stick Fight": "<:StickFight:1502574877536948334>",
  Trident: "🔱",
};

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

const RANK_POINTS = {
  LT5: 1,
  HT5: 2,
  LT4: 3,
  HT4: 4,
  LT3: 6,
  HT3: 10,
  LT2: 16,
  HT2: 28,
  LT1: 40,
  HT1: 60,
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

// Generate a deterministic surrogate numeric id for a username+gamemode pair.
function surrogateIdFor(username, gamemode) {
  const digest = username.toLowerCase() + "|" + gamemode.toLowerCase();
  let hash = 0x811c9dc5;
  for (let i = 0; i < digest.length; i++) {
    hash ^= digest.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const positive = Math.abs(hash | 0) >>> 0;
  return positive + 2_000_000_000;
}

function normRank(s) {
  const r = String(s || "").trim();
  if (!r) return "";
  const up = r.toUpperCase();
  if (up === "UNRANKED") return "Unranked";
  return up;
}

function getAdminName() {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get("admin_session");
    if (session?.value) {
      const parsed = JSON.parse(session.value);
      return parsed?.admin_name || null;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function POST(req) {
  if (!supabase) {
    return json({ error: "Supabase not configured" }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const {
    username,
    gamemode,
    tested_tier,
    result,
    fight_notes,
  } = body;

  if (!username || !gamemode || !tested_tier) {
    return json({ error: "Missing required fields: username, gamemode, tested_tier" }, 400);
  }

  const rank = normRank(tested_tier);
  const tierPoints = RANK_POINTS[rank] ?? 0;

  // Build the row object for database operations — must be defined before any update/insert
  const row = {
    username,
    gamemode,
    rank,
    points: tierPoints,
    created_at: new Date().toISOString(),
  };

  // Get Discord ID from linked_accounts for ping
  const { data: linkedAccount } = await supabase
    .from("linked_accounts")
    .select("discord_id")
    .ilike("minecraft_name", username)
    .maybeSingle();

  const discordPing = linkedAccount?.discord_id ? `<@${linkedAccount.discord_id}>` : "";

  // Get previous record for audit
  const { data: prev } = await supabase
    .from("tests")
    .select("id,username,gamemode,rank,points,created_at")
    .ilike("username", username)
    .ilike("gamemode", gamemode)
    .maybeSingle();

  // Save to main tests table — update if prev exists, insert otherwise
  let saved = null;
  let saveErr = null;

  if (prev?.id) {
    // Existing entry → update
    const { data: upd, error: updErr } = await supabase
      .from("tests")
      .update(row)
      .eq("id", prev.id)
      .select("id,username,gamemode,rank,points,created_at")
      .maybeSingle();
    saved = upd;
    saveErr = updErr;
  } else if (!saved && !saveErr) {
    // First-time entry → insert with a deterministic surrogate id
    const surrogateId = surrogateIdFor(username, gamemode);
    const { data: ins, error: insErr } = await supabase
      .from("tests")
      .insert({ ...row, id: surrogateId })
      .select("id,username,gamemode,rank,points,created_at")
      .maybeSingle();
    saved = ins;
    saveErr = insErr;
  }

  if (saveErr) {
    return json({ error: saveErr.message }, 500);
  }

  // Audit log
  const admin_name = getAdminName();
  if (admin_name) {
    try {
      await supabase.from("audit_logs").insert({
        admin_name,
        action: "high_score_save",
        target_username: username,
        gamemode,
        old_rank: prev?.rank || null,
        new_rank: rank,
        old_points: prev?.points || null,
        new_points: tierPoints,
        details: { result, fight_notes },
      });
    } catch (e) {
      console.error("Audit log error:", e?.message || e);
    }
  }

  // Insert into discord_notifications table for the bot to pick up
  let notificationCreated = false;
  try {
    const { error: notifyErr } = await supabase.from("discord_notifications").insert({
      username,
      gamemode,
      tested_tier: rank,
      result: result || "Sikeres",
      fight_notes,
      processed: false,
    });
    if (notifyErr) {
      console.error("Failed to create notification:", notifyErr.message);
    } else {
      notificationCreated = true;
    }
  } catch (e) {
    console.error("Notification error:", e?.message || e);
  }

  // Send immediate webhook to Discord if configured
  if (DISCORD_WEBHOOK_URL) {
    try {
      const modeIcon = MODE_ICONS[gamemode] || "🎮";
      const resultText = result || "Sikeres";
       
       const header = discordPing 
         ? `${discordPing} **${resultText} volt ${rank} teszten.**`
         : `**${resultText} volt ${rank} teszten.**`;

       const modeLine = `**${gamemode}** ${modeIcon}`;
      
       const orderedTiers = ["LT3", "HT3", "LT2", "HT2", "LT1", "HT1"];
       const fightSections = orderedTiers
         .filter((label) => fight_notes?.[label] && String(fight_notes[label]).trim().length > 0)
         .map((label) => `**__${label} Fightok__**\n> ${String(fight_notes[label]).trim()}`)
         .join("\n");
       
       const message = [header, "", modeLine, "", fightSections].join("\n");
      
      await fetch(DISCORD_WEBHOOK_URL, {
       method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: message,
        }),
       });
     } catch (e) {
       console.error("Webhook error:", e?.message || e);
    }
  }

  return json({
    ok: true,
    saved,
    notification_created: notificationCreated,
  });
}