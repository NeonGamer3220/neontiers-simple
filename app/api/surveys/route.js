export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

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

function requireSupabase() {
  if (!supabase) {
    return json({ error: "Supabase is not configured", need_env: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] }, 500);
  }
  return null;
}

async function fetchSurveyByNameAndCode(name, code) {
  const { data, error } = await supabase
    .from("surveys")
    .select("id,name,questions,basic_duration_seconds")
    .ilike("name", String(name).trim())
    .eq("survey_code", String(code).trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function fetchSurveyById(id) {
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function GET(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") || "").trim();
  const code = (searchParams.get("code") || "").trim();

  if (!name || !code) {
    return json({ error: "Missing survey name or code" }, 400);
  }

  try {
    const survey = await fetchSurveyByNameAndCode(name, code);
    if (!survey) return json({ error: "Felmérés nem található" }, 404);

    return json({ survey });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

export async function POST(req) {
  const missing = requireSupabase();
  if (missing) return missing;

  let body = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = String(body.action || "").trim();
  if (!action) return json({ error: "Missing action" }, 400);

  try {
    if (action === "start") {
      const surveyId = Number(body.survey_id);
      const participantName = String(body.participant_name || "").trim();
      if (!Number.isFinite(surveyId) || surveyId <= 0 || !participantName) {
        return json({ error: "Missing survey_id or participant_name" }, 400);
      }

      const { data, error } = await supabase
        .from("survey_responses")
        .insert([
          {
            survey_id: surveyId,
            participant_name: participantName,
            state: "alap",
            current_stage: "alap",
            answers: {},
          },
        ])
        .select("id, survey_id, participant_name, state, current_stage, started_at");

      if (error) return json({ error: error.message }, 500);
      return json({ response: data?.[0] || null }, 201);
    }

    if (action === "validate_stage") {
      const responseId = Number(body.response_id);
      const stage = String(body.stage || "").trim();
      const code = String(body.code || "").trim();
      if (!Number.isFinite(responseId) || responseId <= 0 || !stage || !code) {
        return json({ error: "Missing response_id/stage/code" }, 400);
      }

      const { data: response, error: responseError } = await supabase
        .from("survey_responses")
        .select("id,survey_id")
        .eq("id", responseId)
        .maybeSingle();
      if (responseError) return json({ error: responseError.message }, 500);
      if (!response) return json({ error: "Response not found" }, 404);

      const survey = await fetchSurveyById(response.survey_id);
      if (!survey) return json({ error: "Survey not found" }, 404);

      const expectedCode =
        stage === "logikai"
          ? survey.logic_code
          : stage === "nyelvtani"
          ? survey.grammar_code
          : stage === "helyzeti"
          ? survey.situational_code
          : null;

      if (!expectedCode) return json({ error: "Invalid stage" }, 400);
      if (code.trim() !== expectedCode.trim()) {
        return json({ error: "Helytelen kód" }, 403);
      }

      return json({ ok: true });
    }

    if (action === "track") {
      const responseId = Number(body.response_id);
      const event = String(body.event || "").trim();
      if (!Number.isFinite(responseId) || responseId <= 0 || !event) {
        return json({ error: "Missing response_id or event" }, 400);
      }

      const update = {
        updated_at: new Date().toISOString(),
      };

      if (event === "leave" || event === "blur") {
        update.left_page_count = supabase.raw("COALESCE(left_page_count, 0) + 1");
        update.left_page = true;
      }

      const { error } = await supabase
        .from("survey_responses")
        .update(update)
        .eq("id", responseId);
      if (error) return json({ error: error.message }, 500);

      return json({ ok: true });
    }

    if (action === "submit") {
      const responseId = Number(body.response_id);
      const stage = String(body.stage || "").trim();
      const answers = body.answers || {};
      if (!Number.isFinite(responseId) || responseId <= 0 || !stage || typeof answers !== "object") {
        return json({ error: "Missing response_id/stage/answers" }, 400);
      }

      const { data: existing, error: existingError } = await supabase
        .from("survey_responses")
        .select("id,survey_id,answers")
        .eq("id", responseId)
        .maybeSingle();
      if (existingError) return json({ error: existingError.message }, 500);
      if (!existing) return json({ error: "Response not found" }, 404);

      const previousAnswers = existing.answers || {};
      previousAnswers[stage] = answers;

      const stageOrder = ["alap", "logikai", "nyelvtani", "helyzeti"];
      const currentIndex = stageOrder.indexOf(stage);
      const nextIndex = currentIndex + 1;
      const nextStage = nextIndex < stageOrder.length ? stageOrder[nextIndex] : "completed";

      const update = {
        answers: previousAnswers,
        current_stage: nextStage,
        state: nextStage === "completed" ? "completed" : nextStage,
        updated_at: new Date().toISOString(),
      };
      if (nextStage === "completed") {
        update.completed_at = new Date().toISOString();
      }

      const { data: updated, error: updateError } = await supabase
        .from("survey_responses")
        .update(update)
        .eq("id", responseId)
        .select("id,participant_name,state,current_stage,answers,left_page,left_page_count,started_at,completed_at");
      if (updateError) return json({ error: updateError.message }, 500);

      return json({ response: updated?.[0] || null });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    return json({ error: error.message || "Unknown server error" }, 500);
  }
}
