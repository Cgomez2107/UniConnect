-- ============================================================================
-- US-EV03: Gestión del Ciclo de Vida de Eventos
-- Agrega columnas faltantes a la tabla events para soportar:
--   - Máquina de estados (draft, published, cancelled, finished)
--   - Soft delete (deleted_at)
--   - Cupo máximo y contador de registrados
-- ============================================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS status            TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'cancelled', 'finished')),
  ADD COLUMN IF NOT EXISTS max_capacity      INTEGER
    CHECK (max_capacity IS NULL OR max_capacity > 0),
  ADD COLUMN IF NOT EXISTS registered_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at        TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_events_status
  ON events(status);

CREATE INDEX IF NOT EXISTS idx_events_active
  ON events(event_date DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_deleted_at
  ON events(deleted_at);

COMMENT ON COLUMN events.status            IS 'Estado del ciclo de vida del evento: draft, published, cancelled, finished';
COMMENT ON COLUMN events.max_capacity      IS 'Cupo máximo de asistentes. NULL = sin límite. Debe ser > 0 si se especifica.';
COMMENT ON COLUMN events.registered_count  IS 'Contador de usuarios registrados al evento (desnormalizado para eficiencia).';
COMMENT ON COLUMN events.deleted_at        IS 'Soft delete. NULL si el evento está activo. Timestamp si fue eliminado lógicamente.';

-- ============================================================================
-- Tabla de registros de usuarios a eventos (para el Observer de cancelación)
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_registrations (
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event
  ON event_registrations(event_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user
  ON event_registrations(user_id);

COMMENT ON TABLE  event_registrations       IS 'Registro de usuarios a eventos individuales (para notificaciones de cancelación)';
COMMENT ON COLUMN event_registrations.event_id IS 'ID del evento al que el usuario se registró';
COMMENT ON COLUMN event_registrations.user_id  IS 'UUID del usuario registrado';
