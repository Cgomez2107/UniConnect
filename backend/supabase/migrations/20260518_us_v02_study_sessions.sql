-- ══════════════════════════════════════════════════════════════════════════════
-- US-V02: Study Sessions (Programaci�n de Sesiones de Estudio)
-- ══════════════════════════════════════════════════════════════════════════════

-- =============================================================================
-- 1. session_series: Configuraci�n de recurrencia de una serie de sesiones
-- =============================================================================
CREATE TABLE IF NOT EXISTS session_series (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        UUID NOT NULL REFERENCES study_requests(id) ON DELETE CASCADE,
  frequency         TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly')),
  interval          INT NOT NULL DEFAULT 1 CHECK (interval >= 1),
  days_of_week      INT[] NOT NULL CHECK (array_length(days_of_week, 1) > 0),
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  start_time        TIME WITHOUT TIME ZONE NOT NULL,
  duration_minutes  INT NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  location          TEXT CHECK (length(location) <= 200),
  created_by        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_series_request ON session_series(request_id);

-- =============================================================================
-- 2. study_sessions: Instancias individuales de sesiones (materializadas)
-- =============================================================================
CREATE TABLE IF NOT EXISTS study_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        UUID NOT NULL REFERENCES study_requests(id) ON DELETE CASCADE,
  series_id         UUID REFERENCES session_series(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  start_time        TIMESTAMPTZ NOT NULL,
  end_time          TIMESTAMPTZ NOT NULL,
  location          TEXT,
  status            TEXT NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled', 'cancelled')),
  remind_at         TIMESTAMPTZ,
  reminded          BOOLEAN NOT NULL DEFAULT FALSE,
  created_by        UUID NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_request_id ON study_sessions(request_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_series_id ON study_sessions(series_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_remind_at
  ON study_sessions(remind_at)
  WHERE reminded = FALSE AND status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);

-- =============================================================================
-- 3. session_attendees: Asistencia de miembros a sesiones
-- =============================================================================
CREATE TABLE IF NOT EXISTS session_attendees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'declined')),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_attendees_unique ON session_attendees(session_id, user_id);
CREATE INDEX IF NOT EXISTS idx_session_attendees_session ON session_attendees(session_id);

-- =============================================================================
-- 4. Funci�n: Crear registros de asistencia pendiente para todos los miembros
-- =============================================================================
CREATE OR REPLACE FUNCTION create_pending_attendees_for_session()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO session_attendees (session_id, user_id, status)
  SELECT NEW.id, member.user_id, 'pending'
  FROM (
    SELECT sr.author_id AS user_id FROM study_requests sr WHERE sr.id = NEW.request_id
    UNION
    SELECT a.applicant_id FROM applications a WHERE a.request_id = NEW.request_id AND a.status = 'aceptada'
    UNION
    SELECT sra.user_id FROM study_request_admins sra WHERE sra.request_id = NEW.request_id
  ) member
  ON CONFLICT (session_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_pending_attendees ON study_sessions;
CREATE TRIGGER trg_create_pending_attendees
  AFTER INSERT ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION create_pending_attendees_for_session();
