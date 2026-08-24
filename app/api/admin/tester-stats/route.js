// app/api/admin/tester-stats/route.js
// Owner-only stats for the "Teszterek és tesztek" panel on the dashboard:
// how many players are marked as testers (tests.is_tester = true) per
// gamemode, plus overall test-record counts (all rows in `tests`,
// all-time and last 7 days by created_at).
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
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

async function getAdminFromSession() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    if (!session || !session.value) return null;
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}

export async function GET() {
  if (!supabase) {
    return json({ error: "Supabase nincs konfigurálva" }, 500);
  }

  const adminSession = await getAdminFromSession();
  if (!adminSession) return json({ error: "Not authenticated" }, 401);

  const sessionRole = String(adminSession.role || "").toLowerCase();
  if (sessionRole !== "owner") {
    return json({ error: "Hozzáférés megtagadva: csak Owner érhető ehhez" }, 403);
  }

  const { data: rows, error } = await supabase
    .from("tests")
    .select("username, gamemode, is_tester, created_at, retired")
    .eq("retired", false);

  if (error) return json({ error: error.message }, 500);

  const all = rows || [];
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const isRecent = (createdAt) => {
    const t = createdAt ? new Date(createdAt).getTime() : 0;
    return t >= sevenDaysAgo;
  };

  const testsTotal = all.length;
  const testsLast7Days = all.filter((r) => isRecent(r.created_at)).length;

  const testerRows = all.filter((r) => r.is_tester);

  const testerUsernames = new Set(testerRows.map((r) => r.username));
  const gamemodeCounts = new Map(); // gamemode -> Set(usernames)
  for (const r of testerRows) {
    if (!r.gamemode) continue;
    if (!gamemodeCounts.has(r.gamemode)) gamemodeCounts.set(r.gamemode, new Set());
    gamemodeCounts.get(r.gamemode).add(r.username);
  }

  const gamemodes = Array.from(gamemodeCounts.entries())
    .map(([gamemode, usernames]) => ({ gamemode, testerCount: usernames.size }))
    .sort((a, b) => b.testerCount - a.testerCount);

  const testers = testerRows.map((r) => ({
    username: r.username,
    gamemode: r.gamemode,
    last7: isRecent(r.created_at) ? 1 : 0,
    total: 1,
  }));

  return json({
    testerCount: testerUsernames.size,
    gamemodeCount: gamemodeCounts.size,
    testsLast7Days,
    testsTotal,
    gamemodes,
    testers,
  });
}

