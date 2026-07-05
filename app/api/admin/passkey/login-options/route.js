import { cookies } from "next/headers";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getSupabaseAdmin, readSession, getRpInfo } from "../../_lib/session";

export const dynamic = "force-dynamic";

const CHALLENGE_COOKIE = "webauthn_challenge";

export async function GET(req) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json({ error: "Szerver konfigurációs hiba" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const session = readSession(cookieStore);
  if (!session || !session.admin_name) {
    return Response.json({ error: "Nincs bejelentkezve" }, { status: 401 });
  }

  const { rpID } = getRpInfo(req);

  const { data: credentials } = await supabase
    .from("admin_passkeys")
    .select("credential_id, transports")
    .eq("admin_name", session.admin_name);

  if (!credentials || credentials.length === 0) {
    return Response.json({ error: "Nincs regisztrált passkey ehhez a fiókhoz" }, { status: 400 });
  }

  const allowCredentials = credentials.map((c) => ({
    id: c.credential_id,
    type: "public-key",
    transports: c.transports ? c.transports.split(",") : undefined,
  }));

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: "preferred",
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
