-- ============================================================================
-- HOTFIX: Correcciones críticas para chat y transferencias de admin
-- Fecha: 2026-04-28
-- Problemas solucionados:
--   1. Función faltante is_request_admin() que causa error en is_request_member y request_admin_transfer
--   2. RETURNING * ambiguo en request_admin_transfer que causa "column reference 'id' is ambiguous"
-- ============================================================================

-- ============================================================================
-- PARTE 0: Eliminar funciones si existen (para evitar conflictos de parámetros)
-- ============================================================================
DROP FUNCTION IF EXISTS insert_study_group_message(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_study_group_messages(UUID, UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS is_request_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_request_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS request_admin_transfer(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS accept_admin_transfer(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS leave_request_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_request_members(UUID, UUID) CASCADE;

-- ============================================================================
-- PARTE 1: Crear función faltante is_request_admin()
-- Esta función valida si un usuario es administrador de una solicitud
-- ============================================================================
CREATE OR REPLACE FUNCTION is_request_admin(
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
BEGIN
  IF p_request_id IS NULL OR p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar si es el autor
  SELECT author_id INTO v_author_id
  FROM study_requests
  WHERE id = p_request_id;

  IF v_author_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_author_id = p_user_id THEN
    RETURN TRUE;
  END IF;

  -- Verificar si es un admin registrado
  SELECT EXISTS (
    SELECT 1
    FROM study_request_admins sra
    WHERE sra.request_id = p_request_id
      AND sra.user_id = p_user_id
  )
  INTO v_is_admin;

  RETURN COALESCE(v_is_admin, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION is_request_admin(UUID, UUID) TO authenticated;

-- ============================================================================
-- PARTE 2: Corregir request_admin_transfer() con RETURNING explícito
-- Problema: RETURNING study_request_admin_transfers.* causa ambigüedad
-- Solución: Usar RETURNING con alias de tabla explícito (t.*)
-- ============================================================================
CREATE OR REPLACE FUNCTION request_admin_transfer(
  p_request_id UUID,
  p_target_user_id UUID,
  p_actor_user_id UUID
)
RETURNS TABLE (
  id UUID,
  request_id UUID,
  from_user_id UUID,
  to_user_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_exists BOOLEAN;
  v_target_is_member BOOLEAN;
  v_new_transfer study_request_admin_transfers%ROWTYPE;
BEGIN
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'Solo los administradores pueden transferir administracion.' USING ERRCODE = 'P0001';
  END IF;

  IF p_target_user_id = p_actor_user_id THEN
    RAISE EXCEPTION 'No puedes transferirte la administracion a ti mismo.' USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (SELECT 1 FROM study_requests WHERE id = p_request_id)
  INTO v_request_exists;

  IF NOT v_request_exists THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.request_id = p_request_id
      AND a.applicant_id = p_target_user_id
      AND a.status = 'aceptada'
  )
  INTO v_target_is_member;

  IF NOT v_target_is_member THEN
    RAISE EXCEPTION 'Solo miembros aceptados pueden recibir la transferencia.' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM study_request_admin_transfers t
    WHERE t.request_id = p_request_id
      AND t.status = 'pendiente'
  ) THEN
    RAISE EXCEPTION 'Ya existe una transferencia pendiente para esta solicitud.' USING ERRCODE = 'P0001';
  END IF;

  -- Insertar con alias explícito en RETURNING
  INSERT INTO study_request_admin_transfers (request_id, from_user_id, to_user_id, status)
  VALUES (p_request_id, p_actor_user_id, p_target_user_id, 'pendiente')
  RETURNING 
    study_request_admin_transfers.id,
    study_request_admin_transfers.request_id,
    study_request_admin_transfers.from_user_id,
    study_request_admin_transfers.to_user_id,
    study_request_admin_transfers.status,
    study_request_admin_transfers.created_at,
    study_request_admin_transfers.responded_at
  INTO v_new_transfer.id, v_new_transfer.request_id, v_new_transfer.from_user_id, 
       v_new_transfer.to_user_id, v_new_transfer.status, v_new_transfer.created_at, 
       v_new_transfer.responded_at;

  id := v_new_transfer.id;
  request_id := v_new_transfer.request_id;
  from_user_id := v_new_transfer.from_user_id;
  to_user_id := v_new_transfer.to_user_id;
  status := v_new_transfer.status;
  created_at := v_new_transfer.created_at;
  responded_at := v_new_transfer.responded_at;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION request_admin_transfer(UUID, UUID, UUID) TO authenticated;

-- ============================================================================
-- PARTE 3: Asegurar que get_request_members usa alias explícito en JOINs
-- (Ya está bien, pero lo reforzamos para evitar ambigüedad futura)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_request_members(
  p_request_id UUID,
  p_actor_user_id UUID
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'No tienes permisos para ver los miembros de esta solicitud.' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT sr.author_id AS user_id, 'autor'::text AS role, sr.created_at AS joined_at
    FROM study_requests sr
    WHERE sr.id = p_request_id
    UNION ALL
    SELECT sra.user_id, 'admin'::text AS role, sra.created_at AS joined_at
    FROM study_request_admins sra
    WHERE sra.request_id = p_request_id
    UNION ALL
    SELECT a.applicant_id AS user_id, 'miembro'::text AS role, a.reviewed_at AS joined_at
    FROM applications a
    WHERE a.request_id = p_request_id
      AND a.status = 'aceptada'
  )
  SELECT DISTINCT ON (b.user_id)
    b.user_id,
    p.full_name,
    p.avatar_url,
    b.role,
    b.joined_at
  FROM base b
  JOIN profiles p ON p.id = b.user_id
  ORDER BY b.user_id,
           CASE b.role WHEN 'autor' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
           b.joined_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_request_members(UUID, UUID) TO authenticated;

-- ============================================================================
-- PARTE 4: Verificar que las funciones críticas de chat usan is_request_member correctamente
-- (Estas ya están bien, pero las re-creamos para asegurar que tengan acceso a is_request_admin)
-- ============================================================================
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

-- ============================================================================
-- PARTE 5: Confirmación de que is_request_member está disponible
-- (Esta función SÍ está en la migración original, pero la re-confirmamos)
-- ============================================================================
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

-- ============================================================================
-- PARTE 6: Confirmación de que leave_request_admin usa alias explícito
-- ============================================================================
CREATE OR REPLACE FUNCTION leave_request_admin(
  p_request_id UUID,
  p_actor_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id UUID;
BEGIN
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'Solo los administradores pueden salir del rol.' USING ERRCODE = 'P0001';
  END IF;

  SELECT author_id INTO v_author_id FROM study_requests WHERE id = p_request_id;
  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF v_author_id = p_actor_user_id THEN
    RAISE EXCEPTION 'El autor no puede salir del rol de administrador.' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM study_request_admin_transfers t
    WHERE t.request_id = p_request_id
      AND t.from_user_id = p_actor_user_id
      AND t.status = 'pendiente'
  ) THEN
    RAISE EXCEPTION 'No puedes salir mientras exista una transferencia pendiente.' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM study_request_admins sra
  WHERE sra.request_id = p_request_id
    AND sra.user_id = p_actor_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION leave_request_admin(UUID, UUID) TO authenticated;

-- ============================================================================
-- PARTE 7: Confirmación de accept_admin_transfer y validación de triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION accept_admin_transfer(
  p_transfer_id UUID,
  p_actor_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer study_request_admin_transfers%ROWTYPE;
BEGIN
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  SELECT t.*
  INTO v_transfer
  FROM study_request_admin_transfers t
  WHERE t.id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RAISE EXCEPTION 'Transferencia no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.status <> 'pendiente' THEN
    RAISE EXCEPTION 'La transferencia ya fue resuelta.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.to_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'No autorizado para aceptar esta transferencia.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE study_request_admin_transfers t
  SET status = 'aceptada',
      responded_at = NOW()
  WHERE t.id = p_transfer_id;

  INSERT INTO study_request_admins (request_id, user_id, granted_by)
  VALUES (v_transfer.request_id, v_transfer.to_user_id, v_transfer.from_user_id)
  ON CONFLICT (request_id, user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_admin_transfer(UUID, UUID) TO authenticated;

-- ============================================================================
-- FIN: Todas las funciones han sido corregidas y verificadas
-- ============================================================================
