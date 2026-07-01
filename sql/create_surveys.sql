-- Create surveys and survey responses tables for the new Felmérések feature
CREATE TABLE IF NOT EXISTS surveys (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  survey_code TEXT NOT NULL,
  logic_code TEXT NOT NULL,
  grammar_code TEXT NOT NULL,
  situational_code TEXT NOT NULL,
  basic_duration_seconds INTEGER NOT NULL DEFAULT 180,
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_surveys_name ON surveys(name);
CREATE INDEX IF NOT EXISTS idx_surveys_survey_code ON surveys(survey_code);

CREATE TABLE IF NOT EXISTS survey_responses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  survey_id BIGINT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'alap',
  current_stage TEXT NOT NULL DEFAULT 'alap',
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  left_page_count INTEGER NOT NULL DEFAULT 0,
  left_page BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_participant_name ON survey_responses(participant_name);
