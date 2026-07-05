import { cookies } from "next/headers";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
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
    return Response.json({ error: "Lejárt a regisztrációs kérés, próbáld újra" }, { status: 400 });
  }

  const body = await req.json();
  const { rpID, origin } = getRpInfo(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (e) {
    console.error("Passkey registration verify error:", e?.message || e);
    return Response.json({ error: "A passkey regisztráció nem sikerült" }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return Response.json({ error: "A passkey regisztráció nem sikerült" }, { status: 400 });
  }

  const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  const credentialIdStr =
    typeof credentialID === "string" ? credentialID : Buffer.from(credentialID).toString("base64url");
  const publicKeyStr = Buffer.from(credentialPublicKey).toString("base64url");
  const transports = Array.isArray(body?.response?.transports) ? body.response.transports.join(",") : null;

  const { error: insertError } = await supabase.from("admin_passkeys").insert({
    admin_name: session.admin_name,
    credential_id: credentialIdStr,
    public_key: publicKeyStr,
    counter: counter || 0,
    device_type: credentialDeviceType || null,
    backed_up: !!credentialBackedUp,
    transports,
  });

  if (insertError) {
    console.error("Failed to store passkey:", insertError.message);
    return Response.json({ error: "Nem sikerült elmenteni a passkey-t" }, { status: 500 });
  }

  // Registration complete — this device just proved presence, so we can
  // upgrade the pending session straight to a full one.
  await setFullSession(cookieStore, { admin_name: session.admin_name, role: session.role });
  cookieStore.set(CHALLENGE_COOKIE, "", { maxAge: 0, path: "/" });

  try {
    await supabase.from("audit_logs").insert({
      admin_name: session.admin_name,
      action: "passkey_registered",
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Failed to write passkey_registered audit:", e?.message || e);
  }

  return Response.json({ verified: true });
}
