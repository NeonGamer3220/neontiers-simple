// app/_lib/rateLimit.js
//
// Lightweight in-memory rate limiter for API routes.
//
// Caveat: this state lives in the Node process, so on serverless platforms
// (Vercel etc.) with multiple concurrent instances or frequent cold starts
// it's a *best-effort* limiter, not a hard guarantee — each instance has
// its own counters. It's still effective at stopping a single client from
// hammering an endpoint, and costs nothing to run. If you move to a
// long-running Node server (or add Redis/Upstash later) this becomes exact.

const buckets = new Map(); // key -> { count, resetAt }

// Periodically sweep expired buckets so this Map can't grow unbounded.
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

function getClientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * @param {Request} req
 * @param {string} scope - namespace so different endpoints don't share a bucket
 * @param {{limit?: number, windowMs?: number}} opts
 * @returns {{ok: true} | {ok: false, retryAfterSec: number}}
 */
export function rateLimit(req, scope, opts = {}) {
  sweep();
  const limit = opts.limit ?? 20;
  const windowMs = opts.windowMs ?? 60_000;
  const key = `${scope}:${getClientIp(req)}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true };
}

export function rateLimitResponse(retryAfterSec) {
  return new Response(
    JSON.stringify({ error: "Túl sok kérés, próbáld újra később.", retry_after_seconds: retryAfterSec }),
    {
      status: 429,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "retry-after": String(retryAfterSec),
      },
    }
  );
}
