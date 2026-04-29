-- Fix: create RPC insert_study_group_message for group chat (US-W02)

CREATE OR REPLACE FUNCTION insert_study_group_message(
  p_group_id UUID,
  p_sender_id UUID,
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
  IF NOT is_request_member(p_group_id, p_sender_id) THEN
    RAISE EXCEPTION 'No tienes permisos para enviar mensajes a este grupo.' USING ERRCODE = 'P0001';
  END IF;

  v_trimmed := btrim(COALESCE(p_content, ''));
  IF v_trimmed = '' THEN
    RAISE EXCEPTION 'El mensaje no puede estar vacio.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO study_group_messages (request_id, sender_id, content)
  VALUES (p_group_id, p_sender_id, v_trimmed)
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
