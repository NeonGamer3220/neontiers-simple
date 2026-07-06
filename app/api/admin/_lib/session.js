// app/api/admin/_lib/session.js
// Shared helpers for the admin session cookie (password step + passkey step)
// and for building a Supabase service-role client.

import { createClient } from "@supabase/supabase-js";

export const SESSION_COOKIE = "admin_session";
export const FULL_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours — re-login required after this
export const PENDING_SESSION_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes to complete the passkey step

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// "pending" = identity confirmed (password + captcha) but passkey step not completed yet.
export function buildPendingSessionValue({ admin_name, role }) {
  return JSON.stringify({
    admin_name,
    role: String(role || "owner").toLowerCase(),
    issued_at: Date.now(),
    pending: true,
    passkey_verified: false,
  });
}

// "full" = passkey step completed, admin has real access for the next 24h.
export function buildFullSessionValue({ admin_name, role }) {
  return JSON.stringify({
    admin_name,
    role: String(role || "owner").toLowerCase(),
    issued_at: Date.now(),
    pending: false,
    passkey_verified: true,
  });
}

export async function setPendingSession(cookieStore, payload) {
  cookieStore.set(SESSION_COOKIE, buildPendingSessionValue(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PENDING_SESSION_MAX_AGE_MS / 1000,
    path: "/",
  });
}

export async function setFullSession(cookieStore, payload) {
  cookieStore.set(SESSION_COOKIE, buildFullSessionValue(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: FULL_SESSION_MAX_AGE_MS / 1000,
    path: "/",
  });
}

export function clearSession(cookieStore) {
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

// Parses the session cookie and returns null if missing, malformed, or expired.
// Does NOT distinguish pending vs full — callers check `.pending`/`.passkey_verified`.
export function readSession(cookieStore) {
  const raw = cookieStore.get(SESSION_COOKIE);
  if (!raw || !raw.value) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw.value);
  } catch {
    return null;
  }
  if (!parsed || !parsed.admin_name || !parsed.issued_at) return null;

  const maxAge = parsed.pending ? PENDING_SESSION_MAX_AGE_MS : FULL_SESSION_MAX_AGE_MS;
  if (Date.now() - parsed.issued_at > maxAge) {
    return null; // expired — treat exactly like "not logged in"
  }
  return parsed;
}

// Derives the WebAuthn RP ID + origin.
// IMPORTANT: rpID must be IDENTICAL between passkey registration and passkey
// login, or the browser will silently fail to find the credential (this is
// the #1 cause of "A passkey ellenőrzés megszakadt vagy nem sikerült ezen az
// eszközön"). Deriving it from the request's Host header is fragile — behind
// Cloudflare/a proxy, or if the site is ever reached via www vs apex vs a
// preview URL, the header can differ between the two calls. So we prefer an
// explicit env var and only fall back to the header for local dev.
export function getRpInfo(req) {
  const host = req.headers.get("host") || "localhost:3000";
  const envRpID = process.env.WEBAUTHN_RP_ID || process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || "";
  const rpID = envRpID || host.split(":")[0];
  const proto = rpID === "localhost" ? "http" : "https";
  const origin = process.env.WEBAUTHN_ORIGIN || `${proto}://${host}`;
  return { rpID, origin };
}
