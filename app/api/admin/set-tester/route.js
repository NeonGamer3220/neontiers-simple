// app/api/admin/set-tester/route.js
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

// POST: toggle the "Tester" checkbox for one player/gamemode row (Owner
// only). The bot's tester_role_sync cog polls the "tests" table for any
// is_tester=true row per player and grants/removes the Discord Tester
// role accordingly — no Discord ID needed here, the bot resolves it via
// linked_accounts.
export async function POST(req) {
  const limited = rateLimit(req, "admin-set-tester", { limit: 30, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  if (!supabase) {
    return json({ error: "Supabase nincs konfigurálva" }, 500);
  }

  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);
  const role = String(admin.role || "").toLowerCase();
  if (role !== "owner") {
    return json({ error: "Csak Owner állíthatja a Tester jelölőt" }, 403);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Érvénytelen JSON" }, 400);
  }

  const username = String(body.username || "").trim();
  const gamemode = String(body.gamemode || "").trim();
  const isTester = body.is_tester === true;

  if (!username) return json({ error: "Hiányzó felhasználónév" }, 400);
  if (!gamemode) return json({ error: "Hiányzó gamemode" }, 400);

  const { data: existingRow } = await supabase
    .from("tests")
    .select("id,is_tester")
    .ilike("username", username)
    .ilike("gamemode", gamemode)
    .maybeSingle();

  if (!existingRow) {
    // No test row for this gamemode yet — nothing to flag. The checkbox is
    // disabled client-side for untested entries, but guard here too.
    return json({ error: "Ehhez a játékmódhoz még nincs mentett teszt" }, 400);
  }

  const { error: updateErr } = await supabase
    .from("tests")
    .update({ is_tester: isTester })
    .eq("id", existingRow.id);

  if (updateErr) return json({ error: updateErr.message }, 500);

  try {
    await supabase.from("audit_logs").insert({
      admin_name: admin.admin_name || "unknown",
      action: isTester ? "tester_role_granted" : "tester_role_revoked",
      target_username: username,
      gamemode,
      details: { is_tester: isTester },
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to write tester_role audit log:", e?.message || e);
  }

  return json({ ok: true, username, gamemode, is_tester: isTester });
}
