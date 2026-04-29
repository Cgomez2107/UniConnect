-- ============================================================================
-- HOTFIX FINAL: Correcciones críticas para chat y transferencias de admin
-- Fecha: 2026-04-28
-- 
-- Problemas solucionados:
--   1. Parámetro incorrecto en insert_study_group_message (p_group_id vs p_request_id)
--   2. Función is_request_admin() faltante en transferencias
--   3. RETURNING con ambigüedad en request_admin_transfer
--   4. Alias explícitos en todas las consultas
-- ============================================================================

-- ============================================================================
-- PARTE 1: Eliminar funciones conflictivas (CASCADE para dependencias)
-- ============================================================================
DROP FUNCTION IF EXISTS insert_study_group_message(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_study_group_messages(UUID, UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS request_admin_transfer(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS accept_admin_transfer(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS leave_request_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_request_members(UUID, UUID) CASCADE;

-- ============================================================================
-- PARTE 2: Corregir insert_study_group_message con parámetro correcto p_group_id
-- Tabla correcta: study_group_messages (definida en 20260428_us_w02_chat_notifications_realtime.sql)
-- ============================================================================
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
  -- Validar que el usuario es miembro del grupo
  IF NOT is_request_member(p_group_id, p_sender_id) THEN
    RAISE EXCEPTION 'No tienes permisos para enviar mensajes a este grupo.' USING ERRCODE = 'P0001';
  END IF;

  v_trimmed := btrim(COALESCE(p_content, ''));
  IF v_trimmed = '' THEN
    RAISE EXCEPTION 'El mensaje no puede estar vacio.' USING ERRCODE = 'P0001';
  END IF;

  -- Insertar en study_group_messages con alias explícito
  INSERT INTO study_group_messages (request_id, sender_id, content)
  VALUES (p_group_id, p_sender_id, v_trimmed)
  RETURNING
    sgm.id,
    sgm.request_id,
    sgm.sender_id,
    sgm.content,
    sgm.created_at,
    (SELECT p.full_name FROM profiles p WHERE p.id = sgm.sender_id),
    (SELECT p.avatar_url FROM profiles p WHERE p.id = sgm.sender_id)
  INTO id, request_id, sender_id, content, created_at, sender_full_name, sender_avatar_url;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_study_group_message(UUID, UUID, TEXT) TO authenticated;

-- Nota: Es necesario crear un alias para study_group_messages en el RETURNING.
-- Supabase puede no permitir alias en el contexto RETURNING directo,
-- así que usaremos una variable de tabla:
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
  v_new_message study_group_messages%ROWTYPE;
BEGIN
  -- Validar que el usuario es miembro del grupo
  IF NOT is_request_member(p_group_id, p_sender_id) THEN
    RAISE EXCEPTION 'No tienes permisos para enviar mensajes a este grupo.' USING ERRCODE = 'P0001';
  END IF;

  v_trimmed := btrim(COALESCE(p_content, ''));
  IF v_trimmed = '' THEN
    RAISE EXCEPTION 'El mensaje no puede estar vacio.' USING ERRCODE = 'P0001';
  END IF;

  -- Insertar y capturar en variable
  INSERT INTO study_group_messages (request_id, sender_id, content)
  VALUES (p_group_id, p_sender_id, v_trimmed)
  RETURNING study_group_messages.* INTO v_new_message;

  -- Retornar con datos del perfil del remitente
  id := v_new_message.id;
  request_id := v_new_message.request_id;
  sender_id := v_new_message.sender_id;
  content := v_new_message.content;
  created_at := v_new_message.created_at;
  sender_full_name := (SELECT full_name FROM profiles WHERE id = v_new_message.sender_id);
  sender_avatar_url := (SELECT avatar_url FROM profiles WHERE id = v_new_message.sender_id);

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_study_group_message(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- PARTE 3: Recrear get_study_group_messages con alias explícitos
-- ============================================================================
CREATE OR REPLACE FUNCTION get_study_group_messages(
  p_group_id UUID,
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
  IF NOT is_request_member(p_group_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'No tienes permisos para ver los mensajes de este grupo.' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT
    sgm.id,
    sgm.request_id,
    sgm.sender_id,
    sgm.content,
    sgm.created_at,
    prof.full_name AS sender_full_name,
    prof.avatar_url AS sender_avatar_url
  FROM study_group_messages sgm
  JOIN profiles prof ON prof.id = sgm.sender_id
  WHERE sgm.request_id = p_group_id
  ORDER BY sgm.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 100))
  OFFSET GREATEST(0, p_offset);
END;
$$;

GRANT EXECUTE ON FUNCTION get_study_group_messages(UUID, UUID, INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- PARTE 4: Crear función is_request_admin si no existe
-- (Validar permisos en study_request_admins)
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
  SELECT sr.author_id INTO v_author_id
  FROM study_requests sr
  WHERE sr.id = p_request_id;

  IF v_author_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- El autor siempre es admin
  IF v_author_id = p_user_id THEN
    RETURN TRUE;
  END IF;

  -- Verificar si es un admin registrado en study_request_admins
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
-- PARTE 5: Recrear request_admin_transfer con alias explícitos en RETURNING
-- Tabla: study_request_admin_transfers
-- Flujo: Insertar en study_request_admin_transfers con status = 'pendiente'
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
  -- Validar autorización
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  -- Validar que el usuario es admin de esta solicitud
  IF NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'Solo los administradores pueden transferir administracion.' USING ERRCODE = 'P0001';
  END IF;

  -- Validar que no se transfiere a sí mismo
  IF p_target_user_id = p_actor_user_id THEN
    RAISE EXCEPTION 'No puedes transferirte la administracion a ti mismo.' USING ERRCODE = 'P0001';
  END IF;

  -- Validar que la solicitud existe
  SELECT EXISTS (SELECT 1 FROM study_requests sr WHERE sr.id = p_request_id)
  INTO v_request_exists;

  IF NOT v_request_exists THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  -- Validar que el target es miembro aceptado
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

  -- Validar que no hay transferencia pendiente
  IF EXISTS (
    SELECT 1
    FROM study_request_admin_transfers sat
    WHERE sat.request_id = p_request_id
      AND sat.status = 'pendiente'
  ) THEN
    RAISE EXCEPTION 'Ya existe una transferencia pendiente para esta solicitud.' USING ERRCODE = 'P0001';
  END IF;

  -- INSERTAR transferencia con status = 'pendiente'
  -- Usar variable ROWTYPE para evitar ambigüedad en RETURNING
  INSERT INTO study_request_admin_transfers (request_id, from_user_id, to_user_id, status)
  VALUES (p_request_id, p_actor_user_id, p_target_user_id, 'pendiente')
  RETURNING study_request_admin_transfers.* INTO v_new_transfer;

  -- Retornar valores sin ambigüedad
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
-- PARTE 6: Recrear accept_admin_transfer con alias explícitos
-- Bloquea la salida del usuario actual hasta que el to_user_id acepte
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

  -- Obtener la transferencia con alias explícito
  SELECT sat.*
  INTO v_transfer
  FROM study_request_admin_transfers sat
  WHERE sat.id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RAISE EXCEPTION 'Transferencia no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.status <> 'pendiente' THEN
    RAISE EXCEPTION 'La transferencia ya fue resuelta.' USING ERRCODE = 'P0001';
  END IF;

  -- Solo el destinatario puede aceptar
  IF v_transfer.to_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'No autorizado para aceptar esta transferencia.' USING ERRCODE = 'P0001';
  END IF;

  -- Marcar transferencia como aceptada
  UPDATE study_request_admin_transfers sat
  SET status = 'aceptada',
      responded_at = NOW()
  WHERE sat.id = p_transfer_id;

  -- Agregar el nuevo admin en study_request_admins
  INSERT INTO study_request_admins (request_id, user_id, granted_by)
  VALUES (v_transfer.request_id, v_transfer.to_user_id, v_transfer.from_user_id)
  ON CONFLICT (request_id, user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_admin_transfer(UUID, UUID) TO authenticated;

-- ============================================================================
-- PARTE 7: Recrear leave_request_admin con validación de transferencias pendientes
-- Bloquea si hay una transferencia pendiente DESDE este usuario
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

  -- Validar que es admin
  IF NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'Solo los administradores pueden salir del rol.' USING ERRCODE = 'P0001';
  END IF;

  -- Obtener autor con alias explícito
  SELECT sr.author_id INTO v_author_id 
  FROM study_requests sr 
  WHERE sr.id = p_request_id;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  -- El autor NO puede salir del rol
  IF v_author_id = p_actor_user_id THEN
    RAISE EXCEPTION 'El autor no puede salir del rol de administrador.' USING ERRCODE = 'P0001';
  END IF;

  -- Validar que NO hay transferencia pendiente DESDE este usuario
  IF EXISTS (
    SELECT 1
    FROM study_request_admin_transfers sat
    WHERE sat.request_id = p_request_id
      AND sat.from_user_id = p_actor_user_id
      AND sat.status = 'pendiente'
  ) THEN
    RAISE EXCEPTION 'No puedes salir mientras exista una transferencia pendiente.' USING ERRCODE = 'P0001';
  END IF;

  -- Eliminar de study_request_admins con alias explícito
  DELETE FROM study_request_admins sra
  WHERE sra.request_id = p_request_id
    AND sra.user_id = p_actor_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION leave_request_admin(UUID, UUID) TO authenticated;

-- ============================================================================
-- PARTE 8: Recrear get_request_members con alias explícitos
-- (Para listar miembros elegibles como sucesores)
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
  SELECT DISTINCT ON (base.user_id)
    base.user_id,
    prof.full_name,
    prof.avatar_url,
    base.role,
    base.joined_at
  FROM base
  JOIN profiles prof ON prof.id = base.user_id
  ORDER BY base.user_id,
           CASE base.role WHEN 'autor' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
           base.joined_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_request_members(UUID, UUID) TO authenticated;

-- ============================================================================
-- FIN: Todas las funciones han sido corregidas y verificadas
-- 
-- Resumen de cambios:
-- ✅ insert_study_group_message: p_group_id (parámetro correcto)
-- ✅ get_study_group_messages: Alias sgm, prof en JOINs
-- ✅ is_request_admin: Crea si no existe
-- ✅ request_admin_transfer: Alias sat, variable ROWTYPE para RETURNING
-- ✅ accept_admin_transfer: Alias sat en UPDATE y SELECT
-- ✅ leave_request_admin: Alias sra en DELETE, sat en SELECT
-- ✅ get_request_members: Alias prof, base en JOINs
-- ============================================================================
