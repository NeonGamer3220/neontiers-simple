import { cookies } from "next/headers";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getSupabaseAdmin, readSession, getRpInfo } from "../../_lib/session";

export const dynamic = "force-dynamic";

const CHALLENGE_COOKIE = "webauthn_challenge";

function toBase64Url(buf) {
  return Buffer.from(buf).toString("base64url");
}

export async function GET(req) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ error: "Szerver konfigurációs hiba" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const session = readSession(cookieStore);
  // Registration is allowed right after the password step (pending session)
  // or by an already fully-authenticated admin adding an extra device.
  if (!session || !session.admin_name) {
    return Response.json({ error: "Nincs bejelentkezve" }, { status: 401 });
  }

  const { rpID } = getRpInfo(req);

  const { data: existing } = await supabase
    .from("admin_passkeys")
    .select("credential_id, transports")
    .eq("admin_name", session.admin_name);

  const excludeCredentials = (existing || []).map((c) => ({
    // Same fix as login-options: this library version needs raw bytes here,
    // not the stored base64url string.
    id: Buffer.from(c.credential_id, "base64url"),
    type: "public-key",
    transports: c.transports ? c.transports.split(",") : undefined,
  }));

  const userID = new TextEncoder().encode(session.admin_name);

  const options = await generateRegistrationOptions({
    rpName: "NeonTiers Admin",
    rpID,
    userID,
    userName: session.admin_name,
    userDisplayName: session.admin_name,
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  cookieStore.set(CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60,
    path: "/",
  });

  return Response.json(options);
}
