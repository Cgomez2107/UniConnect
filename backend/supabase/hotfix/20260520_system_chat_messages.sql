-- ============================================================================
-- Hotfix: insert_study_group_system_message
--
-- Inserta un mensaje de sistema en el chat del grupo sin verificar
-- is_request_member (el sistema no es un miembro real).
-- El sender_id se guarda como NULL para distinguirlo de mensajes de usuario.
--
-- Llamada por ChatSystemMessageObserver cuando el Patron State emite
-- eventos de transferencia de administracion.
-- ============================================================================

DROP FUNCTION IF EXISTS insert_study_group_system_message(UUID, TEXT);

CREATE FUNCTION insert_study_group_system_message(
  p_request_id UUID,
  p_content TEXT
)
RETURNS TABLE (
  id UUID,
  request_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trimmed TEXT;
BEGIN
  v_trimmed := btrim(COALESCE(p_content, ''));
  IF v_trimmed = '' THEN
    RAISE EXCEPTION 'El mensaje de sistema no puede estar vacio.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO study_group_messages (request_id, sender_id, content)
  VALUES (p_request_id, NULL, v_trimmed)
  RETURNING
    study_group_messages.id,
    study_group_messages.request_id,
    study_group_messages.sender_id,
    study_group_messages.content,
    study_group_messages.created_at
  INTO id, request_id, sender_id, content, created_at;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_study_group_system_message(UUID, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS insert_study_group_system_message_backend(UUID, TEXT);

CREATE FUNCTION insert_study_group_system_message_backend(
  p_request_id UUID,
  p_content TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM insert_study_group_system_message(p_request_id, p_content);
END;
$$;

GRANT EXECUTE ON FUNCTION insert_study_group_system_message_backend(UUID, TEXT) TO authenticated;
