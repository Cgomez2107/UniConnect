-- ============================================================================
-- US-W02: Chat grupal + notificaciones + realtime
-- Fecha: 2026-04-28
-- ============================================================================

-- 1) Tabla de mensajes del grupo
CREATE TABLE IF NOT EXISTS study_group_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES study_requests(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_group_messages_request
  ON study_group_messages(request_id, created_at DESC);

ALTER TABLE study_group_messages ENABLE ROW LEVEL SECURITY;

-- 2) Tabla de notificaciones
CREATE TABLE IF NOT EXISTS user_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  payload     JSONB NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at     TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user
  ON user_notifications(user_id, created_at DESC);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- 3) Helper: valida si un usuario es miembro (autor, admin o aceptado)
CREATE OR REPLACE FUNCTION is_request_member(
  p_request_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id UUID;
  v_is_admin BOOLEAN;
  v_is_member BOOLEAN;
BEGIN
  IF p_request_id IS NULL OR p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT author_id
  INTO v_author_id
  FROM study_requests
  WHERE id = p_request_id;

  IF v_author_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_author_id = p_user_id THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM study_request_admins sra
    WHERE sra.request_id = p_request_id
      AND sra.user_id = p_user_id
  )
  INTO v_is_admin;

  IF COALESCE(v_is_admin, FALSE) THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.request_id = p_request_id
      AND a.applicant_id = p_user_id
      AND a.status = 'aceptada'
  )
  INTO v_is_member;

  RETURN COALESCE(v_is_member, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION is_request_member(UUID, UUID) TO authenticated;

-- 4) RPC: obtener mensajes del grupo
CREATE OR REPLACE FUNCTION get_study_group_messages(
  p_request_id UUID,
  p_actor_user_id UUID,
  p_limit INTEGER,
  p_offset INTEGER
)
RETURNS TABLE (
  id UUID,
  request_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  sender_full_name TEXT,
  sender_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_request_member(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'No tienes permisos para ver los mensajes de este grupo.' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT
    m.id,
    m.request_id,
    m.sender_id,
    m.content,
    m.created_at,
    p.full_name AS sender_full_name,
    p.avatar_url AS sender_avatar_url
  FROM study_group_messages m
  JOIN profiles p ON p.id = m.sender_id
  WHERE m.request_id = p_request_id
  ORDER BY m.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100))
  OFFSET GREATEST(0, p_offset);
END;
$$;

GRANT EXECUTE ON FUNCTION get_study_group_messages(UUID, UUID, INTEGER, INTEGER) TO authenticated;

-- 5) RPC: insertar mensaje del grupo
CREATE OR REPLACE FUNCTION insert_study_group_message(
  p_request_id UUID,
  p_actor_user_id UUID,
  p_content TEXT
)
RETURNS TABLE (
  id UUID,
  request_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  sender_full_name TEXT,
  sender_avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trimmed TEXT;
BEGIN
  IF NOT is_request_member(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'No tienes permisos para enviar mensajes a este grupo.' USING ERRCODE = 'P0001';
  END IF;

  v_trimmed := btrim(COALESCE(p_content, ''));
  IF v_trimmed = '' THEN
    RAISE EXCEPTION 'El mensaje no puede estar vacio.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO study_group_messages (request_id, sender_id, content)
  VALUES (p_request_id, p_actor_user_id, v_trimmed)
  RETURNING
    study_group_messages.id,
    study_group_messages.request_id,
    study_group_messages.sender_id,
    study_group_messages.content,
    study_group_messages.created_at,
    (SELECT full_name FROM profiles WHERE id = study_group_messages.sender_id),
    (SELECT avatar_url FROM profiles WHERE id = study_group_messages.sender_id)
  INTO id, request_id, sender_id, content, created_at, sender_full_name, sender_avatar_url;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_study_group_message(UUID, UUID, TEXT) TO authenticated;

-- 6) RPC: listar notificaciones del usuario
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_actor_user_id UUID,
  p_limit INTEGER,
  p_offset INTEGER
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  title TEXT,
  body TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT
    n.id,
    n.user_id,
    n.type,
    n.title,
    n.body,
    n.payload,
    n.created_at,
    n.read_at
  FROM user_notifications n
  WHERE n.user_id = p_actor_user_id
  ORDER BY n.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100))
  OFFSET GREATEST(0, p_offset);
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_notifications(UUID, INTEGER, INTEGER) TO authenticated;

-- 7) Notificacion al solicitar transferencia
CREATE OR REPLACE FUNCTION notify_admin_transfer(
  p_transfer_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer study_request_admin_transfers%ROWTYPE;
  v_request_title TEXT;
BEGIN
  SELECT *
  INTO v_transfer
  FROM study_request_admin_transfers
  WHERE id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RETURN;
  END IF;

  SELECT title
  INTO v_request_title
  FROM study_requests
  WHERE id = v_transfer.request_id;

  INSERT INTO user_notifications (user_id, type, title, body, payload)
  VALUES (
    v_transfer.to_user_id,
    'admin_transfer',
    'Invitacion para ser administrador',
    COALESCE(v_request_title, 'Solicitud de estudio') || ' te invito a administrar el grupo.',
    jsonb_build_object('transferId', v_transfer.id, 'requestId', v_transfer.request_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION notify_admin_transfer(UUID) TO authenticated;

-- 8) Trigger para notificar transferencias
CREATE OR REPLACE FUNCTION study_request_admin_transfers_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM notify_admin_transfer(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS study_request_admin_transfers_notify_insert ON study_request_admin_transfers;
CREATE TRIGGER study_request_admin_transfers_notify_insert
  AFTER INSERT ON study_request_admin_transfers
  FOR EACH ROW
  EXECUTE FUNCTION study_request_admin_transfers_notify();

-- 9) Politicas basicas para realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'study_group_messages'
      AND policyname = 'study_group_messages_select'
  ) THEN
    CREATE POLICY study_group_messages_select
      ON study_group_messages
      FOR SELECT
      TO authenticated
      USING (is_request_member(request_id, auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'study_group_messages'
      AND policyname = 'study_group_messages_insert'
  ) THEN
    CREATE POLICY study_group_messages_insert
      ON study_group_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (is_request_member(request_id, auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_notifications'
      AND policyname = 'user_notifications_select'
  ) THEN
    CREATE POLICY user_notifications_select
      ON user_notifications
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'study_request_admin_transfers'
      AND policyname = 'study_request_admin_transfers_select'
  ) THEN
    CREATE POLICY study_request_admin_transfers_select
      ON study_request_admin_transfers
      FOR SELECT
      TO authenticated
      USING (
        to_user_id = auth.uid()
        OR from_user_id = auth.uid()
        OR is_request_admin(request_id, auth.uid())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'applications_select_by_member'
  ) THEN
    CREATE POLICY applications_select_by_member
      ON applications
      FOR SELECT
      TO authenticated
      USING (is_request_member(request_id, auth.uid()));
  END IF;
END
$$;

-- 10) Realtime publication + replica identity
ALTER TABLE study_group_messages REPLICA IDENTITY FULL;
ALTER TABLE study_request_admin_transfers REPLICA IDENTITY FULL;
ALTER TABLE applications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'study_group_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE study_group_messages';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'study_request_admin_transfers'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE study_request_admin_transfers';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'applications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE applications';
  END IF;
END
$$;
