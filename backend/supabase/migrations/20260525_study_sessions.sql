DROP TABLE IF EXISTS study_sessions CASCADE;

CREATE TABLE study_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id          UUID NOT NULL REFERENCES study_requests(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT DEFAULT '',
  start_time        TIMESTAMPTZ NOT NULL,
  end_time          TIMESTAMPTZ NOT NULL,
  rrule             TEXT,
  parent_series_id  UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
  created_by        UUID NOT NULL REFERENCES profiles(id),
  cancelled_at      TIMESTAMPTZ,
  reminder_sent_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_group ON study_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_series ON study_sessions(parent_series_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_study_sessions_reminder ON study_sessions(reminder_sent_at) WHERE reminder_sent_at IS NULL;
