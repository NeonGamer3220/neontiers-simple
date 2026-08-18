// app/api/admin/applications/route.js
// Owner-only management of application forms ("Jelentkezések").
// GET  -> list all forms with their response counts
// POST -> create a new form

import { cookies } from "next/headers";
import { getSupabaseAdmin, readSession } from "../_lib/session";

export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function requireOwner() {
  const cookieStore = await cookies();
  const session = readSession(cookieStore);
  if (!session || session.pending || !session.passkey_verified) {
    return { error: json({ error: "Not authenticated" }, 401) };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: json({ error: "Missing Supabase env" }, 500) };

  let role = session.role ? String(session.role).toLowerCase() : "owner";
  const { data } = await supabase
    .from("admins")
    .select("role")
    .eq("admin_name", session.admin_name)
    .maybeSingle();
  if (data?.role) role = String(data.role).toLowerCase();

  if (role !== "owner") {
    return { error: json({ error: "Owner hozzáférés szükséges" }, 403) };
  }

  return { supabase, adminName: session.admin_name };
}

const SLUG_RE = /^[a-z0-9-]+$/;

function sanitizeQuestions(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((q, idx) => {
      const type = ["text", "select", "checkbox", "section"].includes(q?.type) ? q.type : "text";
      const label = String(q?.label || "").trim();
      if (!label) return null;
      const base = { id: q?.id || `q_${Date.now()}_${idx}`, type, label };
      if (type === "section") {
        base.description = String(q?.description || "").trim();
        return base;
      }
      base.required = q?.required !== false; // default true
      if (type === "select" || type === "checkbox") {
        base.options = Array.isArray(q?.options)
          ? q.options.map((o) => String(o || "").trim()).filter(Boolean)
          : [];
      }
      return base;
    })
    .filter(Boolean);
}

export async function GET() {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data: forms, error } = await supabase
    .from("application_forms")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);

  const { data: counts } = await supabase
    .from("application_responses")
    .select("form_id");

  const countMap = {};
  for (const row of counts || []) {
    countMap[row.form_id] = (countMap[row.form_id] || 0) + 1;
  }

  const result = (forms || []).map((f) => ({ ...f, response_count: countMap[f.id] || 0 }));
  return json({ forms: result });
}

export async function POST(req) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { supabase, adminName } = auth;

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Érvénytelen kérés" }, 400);
  }

  const slug = String(body?.slug || "").trim().toLowerCase();
  const title = String(body?.title || "").trim();

  if (!slug || !SLUG_RE.test(slug)) {
    return json({ error: "A slug csak kisbetűket, számokat és kötőjelet tartalmazhat" }, 400);
  }
  if (!title) {
    return json({ error: "A pozíció neve kötelező" }, 400);
  }

  const questions = sanitizeQuestions(body?.questions);

  const { data: existing } = await supabase
    .from("application_forms")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    return json({ error: "Már létezik jelentkezési űrlap ezzel a linkkel" }, 409);
  }

  const { data, error } = await supabase
    .from("application_forms")
    .insert({
      slug,
      title,
      is_open: body?.is_open !== false,
      questions,
      created_by: adminName || null,
    })
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ form: data }, 201);
}
