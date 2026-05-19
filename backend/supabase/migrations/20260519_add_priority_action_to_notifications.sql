-- ============================================================================
-- Migration: Add priority and action columns to user_notifications
-- D03: Decoradores de notificación (Prioridad y Acción)
-- ============================================================================

-- 1. Agregar columnas a user_notifications
ALTER TABLE user_notifications
  ADD COLUMN IF NOT EXISTS priority TEXT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS action JSONB NULL;

-- 2. Actualizar la función de notificación de transferencias (trigger)
--    para incluir priority y action
CREATE OR REPLACE FUNCTION notify_admin_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_body  TEXT;
  v_type  TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pendiente' THEN
    v_type  := 'transferencia_admin_solicitada';
    v_title := (SELECT title FROM study_requests WHERE id = NEW.request_id);
    v_body  := 'Tienes una solicitud para transferir la administracion del grupo.';

    INSERT INTO user_notifications (user_id, type, title, body, payload, priority, action)
    VALUES (
      NEW.to_user_id,
      v_type,
      v_title,
      v_body,
      jsonb_build_object(
        'transferId', NEW.id,
        'groupId',   NEW.request_id,
        'oldAdminId', NEW.from_user_id
      ),
      'urgente',
      jsonb_build_object(
        'label',    'Revisar solicitud',
        'endpoint', '/api/v1/study-groups/transfers/' || NEW.id || '/accept'
      )
    );
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'aceptada' AND OLD.status = 'pendiente' THEN
      INSERT INTO user_notifications (user_id, type, title, body, payload, priority, action)
      VALUES (
        NEW.from_user_id,
        'transferencia_admin_aceptada',
        'Transferencia aceptada',
        'Tu transferencia de administracion fue aceptada.',
        jsonb_build_object(
          'transferId', NEW.id,
          'groupId',    NEW.request_id,
          'newAdminId', NEW.to_user_id
        ),
        'normal',
        jsonb_build_object(
          'label',    'Ver grupo',
          'endpoint', '/api/v1/study-groups/' || NEW.request_id
        )
      );
    END IF;

    IF NEW.status = 'rechazada' AND OLD.status = 'pendiente' THEN
      INSERT INTO user_notifications (user_id, type, title, body, payload, priority)
      VALUES (
        NEW.from_user_id,
        'transferencia_admin_rechazada',
        'Transferencia rechazada',
        'La transferencia de administracion fue rechazada.',
        jsonb_build_object(
          'transferId', NEW.id,
          'groupId',    NEW.request_id,
          'newAdminId', NEW.to_user_id
        ),
        'normal'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Actualizar la función get_user_notifications para incluir priority y action
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
  priority TEXT,
  action JSONB,
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
    n.priority,
    n.action,
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
