-- ══════════════════════════════════════════════════════════════════════════════
-- US-011: Mensajería privada 1:1
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. TABLAS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantiza que no haya dos conversaciones entre el mismo par de usuarios
-- (LEAST/GREATEST normalizan el orden para que A↔B y B↔A sean lo mismo)
CREATE UNIQUE INDEX IF NOT EXISTS unique_conversation
  ON conversations (
    LEAST(participant_a::text, participant_b::text),
    GREATEST(participant_a::text, participant_b::text)
  );

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content         TEXT NOT NULL
                  CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ
);

-- ── 2. ÍNDICES ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_a
  ON conversations(participant_a);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_b
  ON conversations(participant_b);

-- ── 3. TRIGGER: actualizar updated_at de la conversación al enviar mensaje ────

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_update_conversation_ts ON messages;
CREATE TRIGGER messages_update_conversation_ts
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ── 4. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

-- Conversaciones: solo los dos participantes pueden ver/crear
CREATE POLICY "conv_select" ON conversations
  FOR SELECT USING (
    auth.uid() = participant_a OR auth.uid() = participant_b
  );

CREATE POLICY "conv_insert" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = participant_a OR auth.uid() = participant_b
  );

-- Mensajes: solo participantes de la conversación
CREATE POLICY "msg_select" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

CREATE POLICY "msg_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- Solo el destinatario puede marcar como leído (actualizar read_at)
CREATE POLICY "msg_update_read" ON messages
  FOR UPDATE USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- ── 5. FUNCIÓN RPC: get_conversations_for_user ────────────────────────────────
-- Devuelve las conversaciones del usuario enriquecidas con:
--   - datos del otro participante
--   - último mensaje
--   - conteo de no leídos
-- Llamada desde el frontend: supabase.rpc('get_conversations_for_user', { p_user_id: '...' })

CREATE OR REPLACE FUNCTION get_conversations_for_user(p_user_id UUID)
RETURNS TABLE (
  id              UUID,
  participant_a   UUID,
  participant_b   UUID,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  other_user_id   UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  last_message    TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count    BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    c.id,
    c.participant_a,
    c.participant_b,
    c.created_at,
    c.updated_at,

    -- el "otro" participante
    CASE
      WHEN c.participant_a = p_user_id THEN c.participant_b
      ELSE c.participant_a
    END AS other_user_id,

    p.full_name   AS other_user_name,
    p.avatar_url  AS other_user_avatar,

    -- último mensaje (subconsulta eficiente con LIMIT 1)
    (
      SELECT m.content
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message,

    (
      SELECT m.created_at
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message_at,

    -- mensajes no leídos que el otro me envió a mí
    (
      SELECT COUNT(*)
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != p_user_id
        AND m.read_at IS NULL
    ) AS unread_count

  FROM conversations c
  JOIN profiles p
    ON p.id = CASE
                WHEN c.participant_a = p_user_id THEN c.participant_b
                ELSE c.participant_a
              END

  WHERE c.participant_a = p_user_id
     OR c.participant_b = p_user_id

  ORDER BY c.updated_at DESC;
$$;

-- ── 6. REALTIME ───────────────────────────────────────────────────────────────
-- Permite que el frontend reciba mensajes nuevos en tiempo real sin hacer polling.

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ── 7. PUSH TOKENS ────────────────────────────────────────────────────────────
-- Columna para guardar el token de Expo Push Notifications de cada usuario.
-- El frontend lo guarda al iniciar sesión; la Edge Function lo lee para enviar notificaciones.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT;

