-- ============================================================================
-- MIGRACIÓN: Actualización de Esquema y Funciones para Decorator Pattern
-- Objetivo: Agregar soporte para multimedia, menciones y reacciones
-- ============================================================================

-- 1. Actualizar esquema de la tabla
ALTER TABLE study_group_messages 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT,
ADD COLUMN IF NOT EXISTS media_filename TEXT,
ADD COLUMN IF NOT EXISTS mentions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

-- 2. IMPORTANTE: Eliminar funciones antes de recrearlas para cambiar el tipo de retorno
DROP FUNCTION IF EXISTS get_study_group_messages(UUID, UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS insert_study_group_message(UUID, UUID, TEXT, TEXT, TEXT, TEXT) CASCADE;
-- También eliminamos la versión antigua que solo recibía 3 parámetros
DROP FUNCTION IF EXISTS insert_study_group_message(UUID, UUID, TEXT) CASCADE;

-- 3. Crear versión actualizada de get_study_group_messages
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
  sender_avatar_url TEXT,
  media_url TEXT,
  media_type TEXT,
  media_filename TEXT,
  mentions JSONB,
  reactions JSONB
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
    p.avatar_url AS sender_avatar_url,
    m.media_url,
    m.media_type,
    m.media_filename,
    m.mentions,
    m.reactions
  FROM study_group_messages m
  JOIN profiles p ON p.id = m.sender_id
  WHERE m.request_id = p_request_id
  ORDER BY m.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100))
  OFFSET GREATEST(0, p_offset);
END;
$$;

-- 4. Crear versión actualizada de insert_study_group_message
CREATE OR REPLACE FUNCTION insert_study_group_message(
  p_request_id UUID,
  p_actor_user_id UUID,
  p_content TEXT,
  p_media_url TEXT DEFAULT NULL,
  p_media_type TEXT DEFAULT NULL,
  p_media_filename TEXT DEFAULT NULL
)
RETURNS TABLE (
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
  reactions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trimmed TEXT;
  v_new_id UUID;
BEGIN
  IF NOT is_request_member(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'No tienes permisos para enviar mensajes a este grupo.' USING ERRCODE = 'P0001';
  END IF;

  v_trimmed := btrim(COALESCE(p_content, ''));
  -- Permitir mensajes vacíos si hay media
  IF v_trimmed = '' AND p_media_url IS NULL THEN
    RAISE EXCEPTION 'El mensaje no puede estar vacio.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO study_group_messages (
    request_id, 
    sender_id, 
    content, 
    media_url, 
    media_type, 
    media_filename
  )
  VALUES (
    p_request_id, 
    p_actor_user_id, 
    v_trimmed, 
    p_media_url, 
    p_media_type, 
    p_media_filename
  )
  RETURNING study_group_messages.id INTO v_new_id;

  RETURN QUERY
  SELECT
    m.id,
    m.request_id,
    m.sender_id,
    m.content,
    m.created_at,
    p.full_name AS sender_full_name,
    p.avatar_url AS sender_avatar_url,
    m.media_url,
    m.media_type,
    m.media_filename,
    m.mentions,
    m.reactions
  FROM study_group_messages m
  JOIN profiles p ON p.id = m.sender_id
  WHERE m.id = v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_study_group_messages(UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_study_group_message(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
