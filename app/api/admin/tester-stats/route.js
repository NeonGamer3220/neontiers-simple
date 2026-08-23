// app/api/admin/tester-stats/route.js
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

async function requireOwner() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || !session.value) return null;
  try {
    const parsed = JSON.parse(session.value);
    if (String(parsed?.role || "").toLowerCase() !== "owner") return null;
    return parsed;
  } catch {
    return null;
  }
}

// "Teszterek és tesztek" stats for the admin dashboard.
//
// A "teszter" here is a PLAYER flagged with is_tester=true on a tests row
// (the checkbox in the player kezelő) — not a staff member. That flag is
// per username+gamemode, so the same player can be a tester in several
// modes independently.
//
// GET /api/admin/tester-stats
// Response:
// {
//   testerCount,      // distinct usernames with at least one is_tester=true row
//   gamemodeCount,     // distinct gamemodes that have at least one tester
//   testsLast7Days,   // audit_logs "tier_save" rows in the last 7 days (all players)
//   testsTotal,       // audit_logs "tier_save" rows all-time (all players)
//   gamemodes: [{ gamemode, testerCount }],       // one entry per gamemode with testers
//   testers: [{ username, gamemode, last7, total }],  // one row per tester+gamemode
// }
export async function GET() {
  if (!supabase) {
    return json({ error: "Supabase nincs konfigurálva" }, 500);
  }
  const admin = await requireOwner();
  if (!admin) return json({ error: "Csak Owner férhet hozzá" }, 403);

  // 1) Every is_tester=true row — this is a small set (dozens, not thousands).
  const { data: testerRows, error: testerErr } = await supabase
    .from("tests")
    .select("username,gamemode")
    .eq("is_tester", true);

  if (testerErr) return json({ error: testerErr.message }, 500);

  const rows = Array.isArray(testerRows) ? testerRows : [];

  const usernameSet = new Set();
  const gamemodeCounts = new Map(); // gamemode -> count
  const gamemodeOrder = []; // preserves first-seen order
  for (const r of rows) {
    if (!r?.username || !r?.gamemode) continue;
    usernameSet.add(r.username.toLowerCase());
    if (!gamemodeCounts.has(r.gamemode)) {
      gamemodeCounts.set(r.gamemode, 0);
      gamemodeOrder.push(r.gamemode);
    }
    gamemodeCounts.set(r.gamemode, gamemodeCounts.get(r.gamemode) + 1);
  }

  const gamemodes = gamemodeOrder.map((gamemode) => ({
    gamemode,
    testerCount: gamemodeCounts.get(gamemode),
  }));

  // 2) Overall test volume — real all-time counts, not capped by any list
  // fetch limit, using head:true so Supabase only returns the count.
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: testsTotal, error: totalErr }, { count: testsLast7Days, error: last7Err }] =
    await Promise.all([
      supabase.from("audit_logs").select("*", { count: "exact", head: true }).eq("action", "tier_save"),
      supabase
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .eq("action", "tier_save")
        .gte("created_at", sevenDaysAgoIso),
    ]);

  if (totalErr) return json({ error: totalErr.message }, 500);
  if (last7Err) return json({ error: last7Err.message }, 500);

  // 3) Per-tester test counts. Only fetch audit_logs rows belonging to
  // testers (a small username set) instead of the whole table.
  const testerUsernames = [...new Set(rows.map((r) => r.username).filter(Boolean))];
  let testerAuditRows = [];
  if (testerUsernames.length > 0) {
    const { data: auditRows, error: auditErr } = await supabase
      .from("audit_logs")
      .select("target_username,gamemode,created_at")
      .eq("action", "tier_save")
      .in("target_username", testerUsernames)
      .limit(20000);
    if (auditErr) return json({ error: auditErr.message }, 500);
    testerAuditRows = Array.isArray(auditRows) ? auditRows : [];
  }

  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const testers = rows
    .filter((r) => r?.username && r?.gamemode)
    .map((r) => {
      let total = 0;
      let last7 = 0;
      for (const a of testerAuditRows) {
        if (
          a.target_username &&
          a.gamemode &&
          a.target_username.toLowerCase() === r.username.toLowerCase() &&
          a.gamemode === r.gamemode
        ) {
          total += 1;
          if (new Date(a.created_at).getTime() >= sevenDaysAgoMs) last7 += 1;
        }
      }
      return { username: r.username, gamemode: r.gamemode, last7, total };
    });

  return json({
    testerCount: usernameSet.size,
    gamemodeCount: gamemodeOrder.length,
    testsLast7Days: testsLast7Days || 0,
    testsTotal: testsTotal || 0,
    gamemodes,
    testers,
  });
}
