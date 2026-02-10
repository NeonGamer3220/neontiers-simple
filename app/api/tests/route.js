// app/api/tests/route.js
import { NextResponse } from "next/server";

const API_KEY = process.env.BOT_API_KEY || "";

// egyszerű in-memory store (serverlessen nem örök életű)
function getStore() {
  if (!globalThis.__NEONTIERS_STORE__) {
    globalThis.__NEONTIERS_STORE__ = {
      // tests: [{ username, mode, rank, points, testerId, testerTag, timestamp, previousRank }]
      tests: []
    };
  }
  return globalThis.__NEONTIERS_STORE__;
}

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function normalizeMode(s) {
  return String(s || "").trim();
}

function normalizeUsername(s) {
  return String(s || "").trim();
}

export async function GET(req) {
  const store = getStore();
  const { searchParams } = new URL(req.url);

  const username = normalizeUsername(searchParams.get("username"));
  if (!username) {
    return json({ tests: store.tests });
  }

  const filtered = store.tests.filter(
    (t) => String(t.username).toLowerCase() === username.toLowerCase()
  );

  return json({ tests: filtered });
}

export async function POST(req) {
  // API key ellenőrzés
  const key = req.headers.get("x-api-key") || "";
  if (API_KEY && key !== API_KEY) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const username = normalizeUsername(body.username);
  const mode = normalizeMode(body.mode);
  const rank = String(body.rank || "Unranked").trim();
  const points = Number(body.points || 0);

  if (!username || !mode) {
    return json({ error: "Missing username/mode" }, 400);
  }

  const store = getStore();

  // UPSERT: username + mode alapján felülírunk
  const idx = store.tests.findIndex(
    (t) =>
      String(t.username).toLowerCase() === username.toLowerCase() &&
      String(t.mode).toLowerCase() === mode.toLowerCase()
  );

  const record = {
    username,
    mode,
    rank,
    points,
    testerId: String(body.testerId || ""),
    testerTag: String(body.testerTag || ""),
    timestamp: Number(body.timestamp || Date.now()),
    previousRank: String(body.previousRank || "Unranked")
  };

  if (idx >= 0) {
    store.tests[idx] = record;
  } else {
    store.tests.push(record);
  }

  return json({ ok: true, record, tests: store.tests });
}
