-- Add remind_at column back to study_sessions (lost during 20260525 table recreation)
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ;

-- Add index for remind_at to improve query performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_remind_at ON study_sessions(remind_at) WHERE remind_at IS NOT NULL;
