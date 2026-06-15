CREATE TABLE IF NOT EXISTS feedback_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  pregunta TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tiene_respuesta BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE feedback_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read all feedback_queries"
  ON feedback_queries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "n8n service can insert feedback_queries"
  ON feedback_queries
  FOR INSERT
  WITH CHECK (true);
