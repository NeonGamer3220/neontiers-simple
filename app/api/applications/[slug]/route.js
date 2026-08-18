// app/api/applications/[slug]/route.js
// Public endpoints for filling out a rank application at
// neontiers.hu/jelentkezes/<slug>.
// GET  -> returns the form definition (only if it's open)
// POST -> submits a filled-in response

import { createClient } from "@supabase/supabase-js";
import { rateLimit, rateLimitResponse } from "../../../_lib/rateLimit";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function getClientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function GET(req, { params }) {
  const limited = rateLimit(req, "applications-public-get", { limit: 60, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  if (!supabase) return json({ error: "Missing Supabase env" }, 500);

  const slug = String(params?.slug || "").trim().toLowerCase();
  const { data: form, error } = await supabase
    .from("application_forms")
    .select("id, slug, title, is_open, questions")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!form) return json({ error: "Nem található ilyen jelentkezés" }, 404);
  if (!form.is_open) return json({ error: "Ez a jelentkezés jelenleg zárva van" }, 403);

  return json({ form });
}

export async function POST(req, { params }) {
  const limited = rateLimit(req, "applications-public-post", { limit: 5, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  if (!supabase) return json({ error: "Missing Supabase env" }, 500);

  const slug = String(params?.slug || "").trim().toLowerCase();
  const { data: form, error } = await supabase
    .from("application_forms")
    .select("id, questions, is_open")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!form) return json({ error: "Nem található ilyen jelentkezés" }, 404);
  if (!form.is_open) return json({ error: "Ez a jelentkezés jelenleg zárva van" }, 403);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Érvénytelen kérés" }, 400);
  }

  // Honeypot: bots that fill every field will trip this hidden one.
  if (body?.website) return json({ success: true });

  const discordName = String(body?.discord_name || "").trim();
  const availability = String(body?.availability || "").trim();

  if (!discordName) return json({ error: "A Discord felhasználóneved megadása kötelező" }, 400);
  if (!availability) return json({ error: "Add meg, mikor tudunk beszélni" }, 400);

  const questions = Array.isArray(form.questions) ? form.questions : [];
  const rawAnswers = body?.answers && typeof body.answers === "object" ? body.answers : {};
  const answers = {};

  for (const q of questions) {
    const val = rawAnswers[q.id];
    if (q.type === "checkbox") {
      const arr = Array.isArray(val) ? val.map((v) => String(v)).filter(Boolean) : [];
      if (q.required && arr.length === 0) {
        return json({ error: `"${q.label}" kitöltése kötelező` }, 400);
      }
      answers[q.id] = arr;
    } else if (q.type === "select") {
      const strVal = String(val || "").trim();
      if (q.required && !strVal) {
        return json({ error: `"${q.label}" kiválasztása kötelező` }, 400);
      }
      if (strVal && Array.isArray(q.options) && !q.options.includes(strVal)) {
        return json({ error: `Érvénytelen válasz ehhez: "${q.label}"` }, 400);
      }
      answers[q.id] = strVal;
    } else {
      const strVal = String(val || "").trim();
      if (q.required && !strVal) {
        return json({ error: `"${q.label}" kitöltése kötelező` }, 400);
      }
      answers[q.id] = strVal;
    }
  }

  const { data, error: insErr } = await supabase
    .from("application_responses")
    .insert({
      form_id: form.id,
      discord_name: discordName,
      availability,
      answers,
      ip_address: getClientIp(req),
    })
    .select("id")
    .single();

  if (insErr) return json({ error: insErr.message }, 500);
  return json({ success: true, id: data.id }, 201);
}
