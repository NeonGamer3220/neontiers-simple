import { cookies } from "next/headers";
import { getSupabaseAdmin, readSession, setFullSession } from "../../_lib/session";
import { hashPasskey } from "../../_lib/passkeyHash";

export const dynamic = "force-dynamic";

const MIN_LEN = 6;
const MAX_LEN = 64;

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
  const trimmed = typeof passkey === "string" ? passkey.trim() : "";

  if (trimmed.length < MIN_LEN || trimmed.length > MAX_LEN) {
    return Response.json(
      { error: `A passkey-nek ${MIN_LEN}-${MAX_LEN} karakter hosszúnak kell lennie` },
      { status: 400 }
    );
  }

  // Refuse to overwrite an existing passkey through this endpoint — that's
  // what /api/admin/passkey/verify is for. Setup only ever applies once.
  const { data: existing } = await supabase
    .from("admin_passkeys")
    .select("id")
    .eq("admin_name", session.admin_name)
    .limit(1);

  if (Array.isArray(existing) && existing.length > 0) {
    return Response.json(
      { error: "Már van beállítva passkey ehhez a fiókhoz — add meg a meglévőt" },
      { status: 409 }
    );
  }

  const hashed = hashPasskey(trimmed);

  const { error: insertError } = await supabase.from("admin_passkeys").insert({
    admin_name: session.admin_name,
    admin_passkey: hashed,
    last_used_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Failed to store passkey:", insertError.message);
    return Response.json({ error: "Nem sikerült elmenteni a passkey-t" }, { status: 500 });
  }

  // Setup step completes the login just like a successful verify would.
  await setFullSession(cookieStore, { admin_name: session.admin_name, role: session.role });

  try {
    await supabase.from("audit_logs").insert({
      admin_name: session.admin_name,
      action: "passkey_registered",
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to write passkey_registered audit:", e?.message || e);
  }

  return Response.json({ success: true });
}
