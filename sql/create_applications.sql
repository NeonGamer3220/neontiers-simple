-- Create tables for the "Jelentkezések" (rank applications) admin feature.
--
-- application_forms: one row per rank/position that can be applied to,
--   reachable publicly at neontiers.hu/jelentkezes/<slug>.
-- application_responses: one row per filled-in application, tied to a form.

CREATE TABLE IF NOT EXISTS application_forms (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT true,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_application_forms_slug ON application_forms(slug);

CREATE TABLE IF NOT EXISTS application_responses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  form_id BIGINT NOT NULL REFERENCES application_forms(id) ON DELETE CASCADE,
  discord_name TEXT NOT NULL,
  availability TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_application_responses_form_id ON application_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_application_responses_created_at ON application_responses(created_at);
