// app/api/applications/route.js
// Public endpoint: list currently open application forms (id/slug/title only)
// so the /jelentkezes overview page can show which positions can be applied to.

import { createClient } from "@supabase/supabase-js";
import { rateLimit, rateLimitResponse } from "../../_lib/rateLimit";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

function json(data, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

export async function GET(req) {
  const limited = rateLimit(req, "applications-public-list", { limit: 60, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  if (!supabase) return json({ forms: [] }, 200, "public, s-maxage=30, stale-while-revalidate=30");

  const { data, error } = await supabase
    .from("application_forms")
    .select("slug, title, created_at")
    .eq("is_open", true)
    .order("created_at", { ascending: false });

  if (error) return json({ forms: [] }, 200, "no-store");

  return json({ forms: data || [] }, 200, "public, s-maxage=30, stale-while-revalidate=30");
}
