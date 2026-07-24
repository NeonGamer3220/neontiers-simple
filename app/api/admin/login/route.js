import { cookies } from "next/headers";
import {
  getSupabaseAdmin,
  setPendingSession,
} from "../_lib/session";

// Minimum time (ms) a real human needs to see the page, read the labels, and
// type into two fields. Bots that submit immediately after loading the page
// get flagged. Set generously low to avoid annoying fast typers/password
// managers, but high enough to catch instant scripted submissions.
const MIN_SUBMIT_MS = 1200;

// Anything older than this is treated as suspicious too (e.g. a stale/replayed
// form_started_at timestamp), rather than trusting an arbitrarily large gap.
const MAX_SUBMIT_MS = 30 * 60 * 1000; // 30 minutes

// Custom bot check — no third-party service involved.
// 1) Honeypot: a field hidden from real users via CSS. Bots that blindly fill
//    every input on the page will populate it; any value here means "not human".
// 2) Timing: real users take at least MIN_SUBMIT_MS to fill the form. Scripted
//    submissions that fire immediately after page load are rejected.
function verifyHuman({ hp_field, form_started_at }) {
  if (hp_field) {
    return { success: false, error: "Kérlek igazold, hogy nem vagy robot" };
  }

  const startedAt = Number(form_started_at);
  if (!Number.isFinite(startedAt)) {
    return { success: false, error: "Kérlek igazold, hogy nem vagy robot" };
  }

  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_SUBMIT_MS || elapsed > MAX_SUBMIT_MS) {
    return { success: false, error: "Kérlek igazold, hogy nem vagy robot" };
  }

  return { success: true };
}

export async function POST(req) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: "Szerver konfigurációs hiba" }, { status: 500 });
    }

    const { admin_name, admin_password, hp_field, form_started_at } = await req.json();

    if (!admin_name || !admin_password) {
      return Response.json({ error: "Admin név és jelszó szükséges" }, { status: 400 });
    }

    // --- Robot check (custom, honeypot + timing) ---
    const humanResult = verifyHuman({ hp_field, form_started_at });
    if (!humanResult.success) {
      return Response.json({ error: humanResult.error }, { status: 400 });
    }

    // --- Credential check ---
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("admin_name", admin_name)
      .single();

    if (error || !data) {
      return Response.json({ error: "Helytelen admin név vagy jelszó" }, { status: 401 });
    }

    if (data.admin_password !== admin_password) {
      return Response.json({ error: "Helytelen admin név vagy jelszó" }, { status: 401 });
    }

    // --- Does this admin already have a passkey registered? ---
    const { data: passkeys } = await supabase
      .from("admin_passkeys")
      .select("id")
      .eq("admin_name", data.admin_name)
      .limit(1);

    const hasPasskey = Array.isArray(passkeys) && passkeys.length > 0;

    // Identity confirmed, but access is NOT granted yet — the passkey step still has to happen.
    const cookieStore = await cookies();
    await setPendingSession(cookieStore, {
      admin_name: data.admin_name,
      role: data.role,
    });

    // Best-effort audit log
    try {
      await supabase.from("audit_logs").insert({
        admin_name: data.admin_name,
        action: "admin_login_password_step",
        target_username: null,
        gamemode: null,
        old_rank: null,
        new_rank: null,
        old_points: null,
        new_points: null,
        details: { hasPasskey },
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to write admin_login_password_step audit:", e?.message || e);
    }

    return Response.json({ success: true, hasPasskey });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Szerver hiba" }, { status: 500 });
  }
}
