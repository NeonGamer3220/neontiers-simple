import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * In-memory store (Vercel serverless: redeploy / cold start után ürülhet).
 * Ha tartós kell: Vercel KV / Supabase / DB.
 */
function getStore() {
  if (!globalThis.__NEONTIERS_STORE__) {
    globalThis.__NEONTIERS_STORE__ = {
      // key: `${username.toLowerCase()}::${gamemode.toLowerCase()}`  -> record
      byUserMode: {},
    };
  }
  return globalThis.__NEONTIERS_STORE__;
}

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function normalizeString(v) {
  return String(v ?? "").trim();
}

function pickFirst(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
  }
  return undefined;
}

function normalizeMode(modeRaw) {
  const mode = normalizeString(modeRaw);
  if (!mode) return "";
  // egységesítés: SpearMace / SpearMace -> SpearMace
  // hagyjuk úgy, ahogy jön, csak trim
  return mode;
}

function normalizeRank(rankRaw) {
  const rank = normalizeString(rankRaw).toUpperCase();
  // engedjük: UNRANKED, LT5..LT1, HT5..HT1, stb. (te úgyis LT/HT-t használsz)
  return rank;
}

// Pontozás példa (ha nálad más kell, szólj és átírjuk)
// Unranked: 0
// LT5..LT1: 1..5
// HT5..HT1: 6..10 (csak példa)
function rankPoints(rank) {
  const r = (rank || "").toUpperCase();
  if (!r || r === "UNRANKED") return 0;

  // LT<number>
  const lt = r.match(/^LT(\d+)$/);
  if (lt) {
    const n = Number(lt[1]);
    if (!Number.isFinite(n)) return 0;
    // LT5 -> 1, LT4 -> 2, LT3 -> 3, LT2 -> 4, LT1 -> 5
    // (ha fordítva akarod, átírjuk)
    return Math.max(0, Math.min(5, 6 - n));
  }

  const ht = r.match(/^HT(\d+)$/);
  if (ht) {
    const n = Number(ht[1]);
    if (!Number.isFinite(n)) return 0;
    // HT5 -> 6, HT4 -> 7, HT3 -> 8, HT2 -> 9, HT1 -> 10
    return 5 + Math.max(0, Math.min(5, 6 - n));
  }

  return 0;
}

function requireAuth(req) {
  const apiKey = process.env.BOT_API_KEY || "";
  // Ha nincs API key beállítva, NE engedjük át véletlenül
  if (!apiKey) return { ok: false, status: 500, error: "Server misconfigured: BOT_API_KEY missing" };

  const auth =
    req.headers.get("authorization") ||
    req.headers.get("Authorization") ||
    req.headers.get("x-api-key") ||
    req.headers.get("X-Api-Key") ||
    "";

  // Elfogadjuk: "Bearer KEY" vagy simán "KEY"
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : auth.trim();

  if (!token || token !== apiKey) return { ok: false, status: 401, error: "Unauthorized" };
  return { ok: true };
}

export async function GET() {
  const store = getStore();
  const list = Object.values(store.byUserMode);

  // visszaadjuk idő szerint (legfrissebb elöl)
  list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return json({ tests: list });
}

export async function POST(req) {
  const auth = requireAuth(req);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // A BOT többféle néven is küldheti -> itt toleránsak vagyunk
  const username = normalizeString(pickFirst(body, ["username", "mcName", "minecraft", "player", "ign"]));
  const gamemode = normalizeMode(pickFirst(body, ["gamemode", "mode", "gameMode", "gamemode_name"]));
  const rank = normalizeRank(pickFirst(body, ["rank", "tier", "rank_earned", "earned_rank", "earnedRank"]));
  const testerId = normalizeString(pickFirst(body, ["testerId", "tester_id", "testerDiscordId", "tester"]));
  const testerName = normalizeString(pickFirst(body, ["testerName", "tester_name"]));

  if (!username || !gamemode || !rank) {
    return json(
      {
        error: "Missing username/gamemode/rank",
        received: {
          username,
          gamemode,
          rank,
          keys: Object.keys(body || {}),
        },
      },
      400
    );
  }

  const store = getStore();
  const key = `${username.toLowerCase()}::${gamemode.toLowerCase()}`;

  const now = Date.now();

  const record = {
    username,
    gamemode,
    rank,
    points: rankPoints(rank),
    testerId: testerId || null,
    testerName: testerName || null,
    updatedAt: now,
  };

  // LÉNYEG: ugyanarra a user+gamemode-ra csak a legutolsó marad meg
  store.byUserMode[key] = record;

  return json({ ok: true, saved: record });
}
