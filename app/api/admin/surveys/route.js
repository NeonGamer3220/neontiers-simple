import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
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

async function getAdminFromSession() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    if (!session || !session.value) return null;
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}

async function resolveAdminName(adminSession) {
  if (!adminSession) return null;
  if (adminSession.admin_name) return adminSession.admin_name;
  if (adminSession.adminId && supabase) {
    const { data } = await supabase
      .from("admins")
      .select("admin_name")
      .eq("id", adminSession.adminId)
      .single();
    return data?.admin_name || null;
  }
  return null;
}

function requireSupabase() {
  if (!supabase) {
    return json(
      {
        error: "Supabase is not configured",
        need_env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      },
      500
    );
  }
  return null;
}

export async function GET(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  const adminSession = await getAdminFromSession();
  if (!adminSession) return json({ error: "Not authenticated" }, 401);
  if (String(adminSession.role || "").toLowerCase() !== "owner") {
    return json({ error: "Hozzáférés megtagadva" }, 403);
  }

  const { searchParams } = new URL(req.url);
  const action = (searchParams.get("action") || "list").trim();

  if (action === "list") {
    const { data, error } = await supabase
      .from("surveys")
      .select("id,name,created_at,basic_duration_seconds")
      .order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ surveys: data || [] });
  }

  if (action === "results") {
    const id = Number(searchParams.get("id"));
    if (!Number.isFinite(id) || id <= 0) {
      return json({ error: "Invalid survey id" }, 400);
    }

    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("id,name,created_at")
      .eq("id", id)
      .single();
    if (surveyError) return json({ error: surveyError.message }, 500);

    const { data: responses, error: respError } = await supabase
      .from("survey_responses")
      .select("id,participant_name,state,current_stage,answers,left_page,left_page_count,started_at,completed_at,created_at")
      .eq("survey_id", id)
      .order("created_at", { ascending: false });
    if (respError) return json({ error: respError.message }, 500);

    return json({ survey, responses: responses || [] });
  }

  return json({ error: "Invalid action" }, 400);
}

export async function POST(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  const adminSession = await getAdminFromSession();
  if (!adminSession) return json({ error: "Not authenticated" }, 401);
  if (String(adminSession.role || "").toLowerCase() !== "owner") {
    return json({ error: "Hozzáférés megtagadva" }, 403);
  }

  let body = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = String(body.action || "").trim();
  if (!action) return json({ error: "Missing action" }, 400);

  if (action === "create") {
    const {
      name,
      survey_code,
      logic_code,
      grammar_code,
      situational_code,
      basic_duration_seconds,
      questions,
    } = body;

    if (!name || !survey_code || !logic_code || !grammar_code || !situational_code || !questions) {
      return json({ error: "Missing fields for survey creation" }, 400);
    }

    const { data: existing } = await supabase
      .from("surveys")
      .select("id")
      .ilike("name", String(name).trim())
      .maybeSingle();
    if (existing) return json({ error: "Ilyen nevű felmérés már létezik" }, 409);

    const { data, error } = await supabase
      .from("surveys")
      .insert([
        {
          name: String(name).trim(),
          survey_code: String(survey_code).trim(),
          logic_code: String(logic_code).trim(),
          grammar_code: String(grammar_code).trim(),
          situational_code: String(situational_code).trim(),
          basic_duration_seconds: Number(basic_duration_seconds) || 180,
          questions,
        },
      ])
      .select("id,name,created_at");

    if (error) return json({ error: error.message }, 500);
    return json({ survey: data?.[0] || null }, 201);
  }

  if (action === "delete") {
    const id = Number(body.id);
    if (!Number.isFinite(id) || id <= 0) {
      return json({ error: "Invalid survey id" }, 400);
    }

    const { error } = await supabase.from("surveys").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "Invalid action" }, 400);
}
