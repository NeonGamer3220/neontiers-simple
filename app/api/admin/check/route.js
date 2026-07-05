import { cookies } from "next/headers";
import { getSupabaseAdmin, readSession, clearSession } from "../_lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = readSession(cookieStore);

    if (!session) {
      // Either missing, malformed, or expired (readSession handles all 3 the same way).
      await clearSession(cookieStore);
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // A "pending" session means the password step succeeded but the passkey
    // step has not been completed yet — this does NOT count as authenticated
    // for the purposes of accessing the admin panel.
    if (session.pending || !session.passkey_verified) {
      const supabase = getSupabaseAdmin();
      let hasPasskey = false;
      if (supabase && session.admin_name) {
        const { data } = await supabase
          .from("admin_passkeys")
          .select("id")
          .eq("admin_name", session.admin_name)
          .limit(1);
        hasPasskey = Array.isArray(data) && data.length > 0;
      }
      return Response.json(
        { error: "Passkey verification required", pending: true, hasPasskey },
        { status: 401 }
      );
    }

    let role = session.role ? String(session.role).toLowerCase() : "owner";

    const supabase = getSupabaseAdmin();
    if (supabase && session.admin_name) {
      const { data } = await supabase
        .from("admins")
        .select("role")
        .eq("admin_name", session.admin_name)
        .maybeSingle();
      if (data?.role) role = String(data.role).toLowerCase();
    }

    return Response.json({
      authenticated: true,
      admin_name: session.admin_name || null,
      role,
    });
  } catch (err) {
    return Response.json({ error: "Auth check failed" }, { status: 401 });
  }
}
