CREATE OR REPLACE FUNCTION toggle_message_reaction(
  p_message_id UUID,
  p_request_id UUID,
  p_user_id UUID,
  p_emoji TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reactions JSONB;
  v_found_index INT;
BEGIN
  IF NOT is_request_member(p_request_id, p_user_id) THEN
    RAISE EXCEPTION 'No tienes permisos para reaccionar a este mensaje' USING ERRCODE = 'P0001';
  END IF;

  SELECT reactions INTO v_reactions FROM study_group_messages WHERE id = p_message_id AND request_id = p_request_id;
  IF v_reactions IS NULL THEN
    v_reactions := '[]'::jsonb;
  END IF;

  v_found_index := (
    SELECT pos
    FROM jsonb_array_elements(v_reactions) WITH ORDINALITY AS elem(r, pos)
    WHERE r->>'userId' = p_user_id::text AND r->>'emoji' = p_emoji
  );

  IF v_found_index IS NOT NULL THEN
    v_reactions := v_reactions - (v_found_index - 1);
  ELSE
    v_reactions := v_reactions || jsonb_build_object('emoji', p_emoji, 'userId', p_user_id::text);
  END IF;

  UPDATE study_group_messages SET reactions = v_reactions WHERE id = p_message_id AND request_id = p_request_id;

  RETURN v_reactions;
END;
$$;
