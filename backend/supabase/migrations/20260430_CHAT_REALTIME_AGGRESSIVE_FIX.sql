-- ============================================================================
-- FIX DEFINITIVO: Realtime y Funciones de Chat
-- Fecha: 2026-04-30
-- ============================================================================

-- 1. Limpieza profunda de funciones de inserción para evitar conflictos de sobrecarga (Overloading)
DROP FUNCTION IF EXISTS insert_study_group_message(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS insert_study_group_message(UUID, UUID, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS insert_study_group_message(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) CASCADE;

-- 2. Versión robusta de la función con 7 parámetros (coincide con el repositorio de Node.js)
CREATE OR REPLACE FUNCTION insert_study_group_message(
  p_group_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_media_url TEXT DEFAULT NULL,
  p_media_type TEXT DEFAULT NULL,
  p_media_filename TEXT DEFAULT NULL,
  p_mentions JSONB DEFAULT '[]'::JSONB
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
  mentions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trimmed TEXT;
  v_new_id UUID;
BEGIN
  -- Validar que el remitente es miembro activo o admin del grupo
  IF NOT is_request_member(p_group_id, p_sender_id) THEN
    RAISE EXCEPTION 'No tienes permisos para enviar mensajes a este grupo.' USING ERRCODE = 'P0001';
  END IF;

  v_trimmed := btrim(COALESCE(p_content, ''));
  IF v_trimmed = '' AND p_media_url IS NULL THEN
    RAISE EXCEPTION 'El mensaje no puede estar vacio si no hay multimedia.' USING ERRCODE = 'P0001';
  END IF;

  -- Inserción directa
  INSERT INTO study_group_messages (
    request_id, 
    sender_id, 
    content, 
    media_url, 
    media_type, 
    media_filename, 
    mentions
  )
  VALUES (
    p_group_id, 
    p_sender_id, 
    v_trimmed, 
    p_media_url, 
    p_media_type, 
    p_media_filename, 
    p_mentions
  )
  RETURNING study_group_messages.id INTO v_new_id;

  -- Retornar el mensaje enriquecido con los datos del perfil
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
    m.mentions
  FROM study_group_messages m
  JOIN profiles p ON p.id = m.sender_id
  WHERE m.id = v_new_id;
END;
$$;

-- 3. Configuración crítica para Supabase Realtime
-- REPLICA IDENTITY FULL permite que los filtros por columnas no-primarias funcionen
ALTER TABLE study_group_messages REPLICA IDENTITY FULL;

-- Asegurar que la tabla está en la publicación de Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'study_group_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE study_group_messages;
  END IF;
END $$;

-- 4. Permisos de ejecución
GRANT EXECUTE ON FUNCTION insert_study_group_message(UUID, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- 5. Política de RLS para lectura (necesaria para recibir eventos de Realtime)
DROP POLICY IF EXISTS study_group_messages_select ON study_group_messages;
CREATE POLICY study_group_messages_select 
ON study_group_messages 
FOR SELECT 
TO authenticated 
USING (is_request_member(request_id, auth.uid()));
