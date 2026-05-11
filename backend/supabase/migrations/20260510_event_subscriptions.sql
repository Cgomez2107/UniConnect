-- ══════════════════════════════════════════════════════════════════════════════
-- US-O03: Observer para nuevos eventos universitarios
-- Tabla de suscripciones de estudiantes a categorías de eventos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. TABLA ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_subscriptions (
  user_id    VARCHAR(255) NOT NULL,
  category   VARCHAR(50)  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, category)
);

-- ── 2. ÍNDICES ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_event_subscriptions_category
  ON event_subscriptions (category);

-- ── 3. COMENTARIOS ────────────────────────────────────────────────────────────

COMMENT ON TABLE  event_subscriptions              IS 'Suscripciones de estudiantes a categorías de eventos para notificaciones automáticas';
COMMENT ON COLUMN event_subscriptions.user_id      IS 'UUID del estudiante (corresponde al sub del JWT)';
COMMENT ON COLUMN event_subscriptions.category     IS 'Categoría del evento: academico, cultural, deportivo, otro';
COMMENT ON COLUMN event_subscriptions.created_at   IS 'Momento en que se realizó la suscripción';
