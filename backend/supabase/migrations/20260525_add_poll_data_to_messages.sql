-- US-V04: Agregar soporte de encuestas (poll_data) a la tabla messages
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS poll_data JSONB DEFAULT NULL;

-- Crear índice para búsquedas por poll_data (opcional, para optimización)
CREATE INDEX IF NOT EXISTS idx_messages_poll_data
  ON messages(poll_data)
  WHERE poll_data IS NOT NULL;
