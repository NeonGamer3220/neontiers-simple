import { cookies } from "next/headers";
import { getSupabaseAdmin, readSession, setFullSession } from "../../_lib/session";
import { verifyPasskey } from "../../_lib/passkeyHash";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ error: "Szerver konfigurációs hiba" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const session = readSession(cookieStore);
  if (!session || !session.admin_name) {
    return Response.json({ error: "Nincs bejelentkezve" }, { status: 401 });
  }

  const { passkey } = await req.json();
  if (typeof passkey !== "string" || !passkey.trim()) {
    return Response.json({ error: "Add meg a passkey-t" }, { status: 400 });
  }

  const { data: row, error } = await supabase
    .from("admin_passkeys")
    .select("id, admin_passkey")
    .eq("admin_name", session.admin_name)
    .maybeSingle();

  if (error || !row) {
    return Response.json({ error: "Nincs beállítva passkey ehhez a fiókhoz" }, { status: 400 });
  }

  const ok = verifyPasskey(passkey.trim(), row.admin_passkey);
  if (!ok) {
    // Best-effort audit of failed attempts, without leaking anything to the client.
    try {
      await supabase.from("audit_logs").insert({
        admin_name: session.admin_name,
        action: "admin_passkey_failed",
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to write admin_passkey_failed audit:", e?.message || e);
    }
    return Response.json({ error: "Helytelen passkey" }, { status: 401 });
  }

  await supabase
    .from("admin_passkeys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id);

  await setFullSession(cookieStore, { admin_name: session.admin_name, role: session.role });

  try {
    await supabase.from("audit_logs").insert({
      admin_name: session.admin_name,
      action: "admin_login_passkey_step",
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to write admin_login_passkey_step audit:", e?.message || e);
  }

  return Response.json({ verified: true });
}
