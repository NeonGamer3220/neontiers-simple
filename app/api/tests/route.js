// app/api/tests/route.js
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { MODE_LIST, RANK_LIST, rankPoints } from "@/lib/ranks";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const redis = Redis.fromEnv();

// Egyetlen kulcs alatt tároljuk a teljes listát
const STORE_KEY = "neontiers:tests:v1";

function json(res, status = 200) {
  return NextResponse.json(res, { status });
}

function getAuthToken(req) {
  const h = req.headers.get("authorization") || "";
  // elfogadjuk: "Bearer xxx" és sima "xxx" formában is
  if (h.toLowerCase().startsWith("bearer ")) return h.slice(7).trim();
  return h.trim();
}

async function loadTests() {
  const data = await redis.get(STORE_KEY);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [];
}

async function saveTests(tests) {
  await redis.set(STORE_KEY, tests);
}

export async function GET() {
  const tests = await loadTests();
  return json({ tests });
}

export async function POST(req) {
  try {
    const requiredKey = process.env.BOT_API_KEY || "";
    const gotKey = getAuthToken(req);

    if (!requiredKey || gotKey !== requiredKey) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));

    const username = (body.username || "").trim();
    const gamemode = (body.gamemode || "").trim();
    const rank = (body.rank || "").trim();
    const testerId = String(body.testerId || "").trim();
    const testerName = String(body.testerName || "").trim();

    if (!username || !gamemode || !rank) {
      return json({ error: "Missing username/gamemode/rank" }, 400);
    }
    if (!MODE_LIST.includes(gamemode)) {
      return json({ error: "Invalid gamemode" }, 400);
    }
    if (!RANK_LIST.includes(rank)) {
      return json({ error: "Invalid rank" }, 400);
    }

    const tests = await loadTests();

    // 1 user + 1 gamemode => csak a legutóbbi maradhat
    const filtered = tests.filter(
      (t) =>
        !(
          String(t.username).toLowerCase() === username.toLowerCase() &&
          String(t.gamemode) === gamemode
        )
    );

    const now = Date.now();
    const newRow = {
      username,
      gamemode,
      rank,
      points: rankPoints(rank), // <-- ITT a fixelt pontozás
      testerId,
      testerName,
      updatedAt: now,
    };

    filtered.push(newRow);
    await saveTests(filtered);

    return json({ ok: true, saved: newRow });
  } catch (e) {
    return json({ error: "Server error", details: String(e?.message || e) }, 500);
  }
}
