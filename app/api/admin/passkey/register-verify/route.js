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
      // authenticatorSelection above only requests "preferred" user
      // verification, so the verify step must not require it either —
      // otherwise authenticators that only provide presence (not a PIN/
      // fingerprint/face check) get rejected even though our own policy
      // said verification was optional.
      requireUserVerification: false,
    });
  } catch (e) {
    console.error("Passkey registration verify error:", e?.message || e, { rpID, origin });
    return Response.json(
      { error: "A passkey regisztráció nem sikerült", debug: e?.message || String(e), rpID, origin },
      { status: 400 }
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return Response.json(
      { error: "A passkey regisztráció nem sikerült", debug: "verification.verified is false", rpID, origin },
      { status: 400 }
    );
  }

  const info = verification.registrationInfo;

  // Different @simplewebauthn/server versions expose the credential data
  // differently: older/some builds put it flat on registrationInfo
  // (credentialID, credentialPublicKey, counter), newer builds nest it under
  // registrationInfo.credential ({ id, publicKey, counter, transports }).
  // Support both so a version bump can never silently store an empty ID.
  const rawCredentialID = info.credential?.id ?? info.credentialID;
  const rawCredentialPublicKey = info.credential?.publicKey ?? info.credentialPublicKey;
  const rawCounter = info.credential?.counter ?? info.counter;
  const credentialDeviceType = info.credentialDeviceType;
  const credentialBackedUp = info.credentialBackedUp;

  const credentialIdStr =
    typeof rawCredentialID === "string"
      ? rawCredentialID
      : rawCredentialID
      ? Buffer.from(rawCredentialID).toString("base64url")
      : "";

  if (!credentialIdStr || !rawCredentialPublicKey) {
    console.error(
      "Passkey registration produced an empty credential ID or public key — refusing to save.",
      { hasCredentialID: !!rawCredentialID, hasPublicKey: !!rawCredentialPublicKey }
    );
    return Response.json(
      { error: "A passkey regisztráció nem sikerült (üres hitelesítő adat érkezett a szervertől)" },
      { status: 500 }
    );
  }

  const publicKeyStr = Buffer.from(rawCredentialPublicKey).toString("base64url");
  const counter = rawCounter;
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
