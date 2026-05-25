-- ============================================================================
-- Add poll_data column to study_group_messages and update insert function
-- ============================================================================

-- Add poll_data column (JSONB) to study_group_messages
ALTER TABLE study_group_messages
  ADD COLUMN IF NOT EXISTS poll_data JSONB DEFAULT NULL;

-- Drop existing function to recreate with poll_data parameter
DROP FUNCTION IF EXISTS insert_study_group_message(uuid,uuid,text,text,text,text,jsonb);

CREATE OR REPLACE FUNCTION insert_study_group_message(
  p_request_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_media_url TEXT DEFAULT NULL,
  p_media_type TEXT DEFAULT NULL,
  p_media_filename TEXT DEFAULT NULL,
  p_mentions JSONB DEFAULT '[]'::jsonb,
  p_poll_data JSONB DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  request_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  sender_full_name TEXT,
  sender_avatar_url TEXT,
  media_url TEXT,
  media_type TEXT,
  media_filename TEXT,
  mentions JSONB,
  reactions JSONB,
  poll_data JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_msg_id UUID;
BEGIN
  INSERT INTO study_group_messages (request_id, sender_id, content, media_url, media_type, media_filename, mentions, reactions, poll_data, created_at)
  VALUES (p_request_id, p_sender_id, p_content, p_media_url, p_media_type, p_media_filename, p_mentions, '[]'::jsonb, p_poll_data, NOW())
  RETURNING study_group_messages.id INTO v_msg_id;

  RETURN QUERY
  SELECT
    sgm.id,
    sgm.request_id,
    sgm.sender_id,
    sgm.content,
    sgm.created_at,
    pr.full_name,
    pr.avatar_url,
    sgm.media_url,
    sgm.media_type,
    sgm.media_filename,
    sgm.mentions,
    COALESCE(sgm.reactions, '[]'::jsonb),
    sgm.poll_data
  FROM study_group_messages sgm
  LEFT JOIN profiles pr ON pr.id = sgm.sender_id
  WHERE sgm.id = v_msg_id;
END;
$$;

-- Update get_study_group_messages to include poll_data
DROP FUNCTION IF EXISTS get_study_group_messages(uuid,uuid,int,int);

CREATE OR REPLACE FUNCTION get_study_group_messages(
  p_request_id UUID,
  p_actor_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  request_id UUID,
  sender_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  sender_full_name TEXT,
  sender_avatar_url TEXT,
  media_url TEXT,
  media_type TEXT,
  media_filename TEXT,
  mentions JSONB,
  reactions JSONB,
  poll_data JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sgm.id,
    sgm.request_id,
    sgm.sender_id,
    sgm.content,
    sgm.created_at,
    pr.full_name AS sender_full_name,
    pr.avatar_url AS sender_avatar_url,
    sgm.media_url,
    sgm.media_type,
    sgm.media_filename,
    sgm.mentions,
    COALESCE(sgm.reactions, '[]'::jsonb) AS reactions,
    sgm.poll_data
  FROM study_group_messages sgm
  LEFT JOIN profiles pr ON pr.id = sgm.sender_id
  WHERE sgm.request_id = p_request_id
    AND is_request_member(sgm.request_id, p_actor_user_id)
  ORDER BY sgm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
