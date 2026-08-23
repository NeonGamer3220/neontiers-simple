// app/api/admin/tester-stats/route.js
// Owner-only leaderboard: how many tests each staff member has logged
// (all-time + last 7 days), split into "owner" and "regulator" boards
// based on their current role. Source of truth is the `tests` table's
// `tester_id` column, which the Discord bot fills in with the staff
// member's admin_name when it records a test.
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

  const [testsRes, adminsRes] = await Promise.all([
    supabase.from("tests").select("tester_id, gamemode, created_at").not("tester_id", "is", null),
    supabase.from("admins").select("admin_name, role"),
  ]);

  if (testsRes.error) return json({ error: testsRes.error.message }, 500);
  if (adminsRes.error) return json({ error: adminsRes.error.message }, 500);

  const roleByName = new Map();
  for (const a of adminsRes.data || []) {
    const name = String(a.admin_name || "").trim().toLowerCase();
    if (!name) continue;
    roleByName.set(name, String(a.role || "").toLowerCase());
  }

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const byTester = new Map();
  for (const row of testsRes.data || []) {
    const rawId = String(row.tester_id || "").trim();
    if (!rawId) continue;
    const key = rawId.toLowerCase();
    if (!byTester.has(key)) {
      byTester.set(key, { name: rawId, total: 0, week: 0, modes: new Set() });
    }
    const entry = byTester.get(key);
    entry.total += 1;
    if (row.gamemode) entry.modes.add(row.gamemode);
    const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0;
    if (createdAt >= sevenDaysAgo) entry.week += 1;
  }

  const owners = [];
  const regulators = [];

  for (const [key, entry] of byTester.entries()) {
    const role = roleByName.get(key);
    const out = {
      name: entry.name,
      total: entry.total,
      week: entry.week,
      modes: Array.from(entry.modes),
    };
    if (role === "owner") owners.push(out);
    else if (role === "regulator") regulators.push(out);
    // Testers not matched to a current staff account are skipped —
    // most likely former staff whose account was deleted.
  }

  const sortDesc = (a, b) => b.week - a.week || b.total - a.total || a.name.localeCompare(b.name);
  owners.sort(sortDesc);
  regulators.sort(sortDesc);

  return json({
    owners: owners.slice(0, 10),
    regulators: regulators.slice(0, 10),
  });
}
