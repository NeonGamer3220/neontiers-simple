// app/api/admin/applications/[id]/route.js
// Owner-only: view a single form together with all its submitted responses,
// update the form, or delete it (cascades to its responses).

import { cookies } from "next/headers";
import { getSupabaseAdmin, readSession } from "../../_lib/session";

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

  return { supabase };
}

const SLUG_RE = /^[a-z0-9-]+$/;

function sanitizeQuestions(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((q, idx) => {
      const type = ["text", "select", "checkbox"].includes(q?.type) ? q.type : "text";
      const label = String(q?.label || "").trim();
      if (!label) return null;
      const required = q?.required !== false;
      const base = { id: q?.id || `q_${Date.now()}_${idx}`, type, label, required };
      if (type === "select" || type === "checkbox") {
        base.options = Array.isArray(q?.options)
          ? q.options.map((o) => String(o || "").trim()).filter(Boolean)
          : [];
      }
      return base;
    })
    .filter(Boolean);
}

export async function GET(req, { params }) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const id = params?.id;
  const { data: form, error } = await supabase
    .from("application_forms")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!form) return json({ error: "Nem található" }, 404);

  const { data: responses, error: respErr } = await supabase
    .from("application_responses")
    .select("*")
    .eq("form_id", id)
    .order("created_at", { ascending: false });

  if (respErr) return json({ error: respErr.message }, 500);

  return json({ form, responses: responses || [] });
}

export async function PUT(req, { params }) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const id = params?.id;

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Érvénytelen kérés" }, 400);
  }

  const update = {};

  if (body?.slug !== undefined) {
    const slug = String(body.slug || "").trim().toLowerCase();
    if (!slug || !SLUG_RE.test(slug)) {
      return json({ error: "A slug csak kisbetűket, számokat és kötőjelet tartalmazhat" }, 400);
    }
    const { data: existing } = await supabase
      .from("application_forms")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) return json({ error: "Már létezik jelentkezési űrlap ezzel a linkkel" }, 409);
    update.slug = slug;
  }

  if (body?.title !== undefined) {
    const title = String(body.title || "").trim();
    if (!title) return json({ error: "A pozíció neve kötelező" }, 400);
    update.title = title;
  }

  if (body?.is_open !== undefined) update.is_open = !!body.is_open;
  if (body?.questions !== undefined) update.questions = sanitizeQuestions(body.questions);
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("application_forms")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ form: data });
}

export async function DELETE(req, { params }) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const id = params?.id;

  const { error } = await supabase.from("application_forms").delete().eq("id", id);
  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
}
