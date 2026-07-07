import { cookies } from "next/headers";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { getSupabaseAdmin, readSession, setFullSession, getRpInfo } from "../../_lib/session";

export const dynamic = "force-dynamic";

const CHALLENGE_COOKIE = "webauthn_challenge";

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

  const expectedChallenge = cookieStore.get(CHALLENGE_COOKIE)?.value;
  if (!expectedChallenge) {
    return Response.json({ error: "Lejárt a bejelentkezési kérés, próbáld újra" }, { status: 400 });
  }

  const body = await req.json();
  const credentialId = body?.id;
  if (!credentialId) {
    return Response.json({ error: "Érvénytelen passkey válasz" }, { status: 400 });
  }

  const { data: credential } = await supabase
    .from("admin_passkeys")
    .select("*")
    .eq("admin_name", session.admin_name)
    .eq("credential_id", credentialId)
    .maybeSingle();

  if (!credential) {
    return Response.json({ error: "Ismeretlen passkey" }, { status: 400 });
  }

  const { rpID, origin } = getRpInfo(req);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(credential.credential_id, "base64url"),
        credentialPublicKey: Buffer.from(credential.public_key, "base64url"),
        counter: Number(credential.counter) || 0,
      },
      // login-options requests userVerification: "preferred", so don't
      // require it here either — same reasoning as register-verify.
      requireUserVerification: false,
    });
  } catch (e) {
    console.error("Passkey login verify error:", e?.message || e);
    return Response.json({ error: "A passkey ellenőrzés nem sikerült" }, { status: 400 });
  }

  if (!verification.verified) {
    return Response.json({ error: "A passkey ellenőrzés nem sikerült" }, { status: 400 });
  }

  await supabase
    .from("admin_passkeys")
    .update({
      counter: verification.authenticationInfo?.newCounter ?? credential.counter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", credential.id);

  await setFullSession(cookieStore, { admin_name: session.admin_name, role: session.role });
  cookieStore.set(CHALLENGE_COOKIE, "", { maxAge: 0, path: "/" });

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
