-- ══════════════════════════════════════════════════════════════════════════════
-- US-007 / US-008: Eventos académicos y culturales del campus
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. TABLA ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 120),
  description  TEXT CHECK (char_length(description) <= 1000),
  event_date   TIMESTAMPTZ NOT NULL,
  location     TEXT CHECK (char_length(location) <= 200),
  category     TEXT NOT NULL DEFAULT 'academico'
               CHECK (category IN ('academico','cultural','deportivo','otro')),
  image_url    TEXT,
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. ÍNDICES ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_events_event_date
  ON events(event_date DESC);

CREATE INDEX IF NOT EXISTS idx_events_category
  ON events(category);

CREATE INDEX IF NOT EXISTS idx_events_created_by
  ON events(created_by);

-- ── 3. TRIGGER: actualizar updated_at ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_set_updated_at ON events;
CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- ── 4. SEGURIDAD RLS ──────────────────────────────────────────────────────────

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede ver eventos
CREATE POLICY "events_select_authenticated"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Solo admins pueden insertar eventos
CREATE POLICY "events_insert_admin"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Solo admins pueden actualizar eventos
CREATE POLICY "events_update_admin"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Solo admins pueden eliminar eventos
CREATE POLICY "events_delete_admin"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
