// app/api/admin/_lib/passkeyHash.js
// Custom passkey (secret code) hashing — no WebAuthn/browser passkeys, no
// third-party library. Uses Node's built-in crypto.scrypt so no extra
// dependency is needed.

import crypto from "crypto";

const KEY_LEN = 64;

export function hashPasskey(rawPasskey) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(rawPasskey), salt, KEY_LEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPasskey(rawPasskey, stored) {
  if (!stored || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;

  let candidate;
  try {
    candidate = crypto.scryptSync(String(rawPasskey), salt, KEY_LEN);
  } catch {
    return false;
  }

  const expected = Buffer.from(hashHex, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}
