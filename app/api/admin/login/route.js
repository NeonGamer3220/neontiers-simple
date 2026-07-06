import { cookies } from "next/headers";
import {
  getSupabaseAdmin,
  setPendingSession,
} from "../_lib/session";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

async function verifyTurnstile(token, remoteIp) {
  if (!TURNSTILE_SECRET_KEY) {
    // Fail closed: if the site isn't configured yet, don't silently allow logins through.
    return { success: false, error: "Turnstile nincs konfigurálva a szerveren" };
  }
  if (!token) {
    return { success: false, error: "Kérlek igazold, hogy nem vagy robot" };
  }
  try {
    const params = new URLSearchParams();
    params.append("secret", TURNSTILE_SECRET_KEY);
    params.append("response", token);
    if (remoteIp) params.append("remoteip", remoteIp);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    if (!data.success) {
      const codes = Array.isArray(data["error-codes"]) ? data["error-codes"].join(", ") : "ismeretlen";
      console.error("Turnstile siteverify failed:", data);
      return {
        success: false,
        error: `A robot-ellenőrzés sikertelen volt (${codes}). Ellenőrizd a TURNSTILE_SECRET_KEY értékét.`,
      };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: "Nem sikerült ellenőrizni a robot-védelmet" };
  }
}

export async function POST(req) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ error: "Szerver konfigurációs hiba" }, { status: 500 });
    }

    const { admin_name, admin_password, turnstile_token } = await req.json();

    if (!admin_name || !admin_password) {
      return Response.json({ error: "Admin név és jelszó szükséges" }, { status: 400 });
    }

    // --- Robot check (Cloudflare Turnstile) ---
    const remoteIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const turnstileResult = await verifyTurnstile(turnstile_token, remoteIp);
    if (!turnstileResult.success) {
      return Response.json({ error: turnstileResult.error }, { status: 400 });
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
