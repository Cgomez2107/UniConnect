-- ============================================================================
-- CONSOLIDADO COMPLETO: Tablas + Funciones Corregidas para US-W02
-- Fecha: 2026-04-28
-- 
-- Este script incluye:
-- 1. Creación de tablas base
-- 2. Funciones RPC con correcciones de ambigüedad
-- 3. Validación de permisos correcta
-- ============================================================================

-- ============================================================================
-- FASE 1: CREAR TABLAS BASE
-- ============================================================================

-- 1.1) Tabla de mensajes del grupo (chat grupal)
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

-- 1.2) Tabla de notificaciones
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

-- 1.3) Tabla de transferencias de administración
CREATE TABLE IF NOT EXISTS study_request_admin_transfers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID NOT NULL REFERENCES study_requests(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pendiente',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_transfers_request
  ON study_request_admin_transfers(request_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_transfers_request_pending
  ON study_request_admin_transfers(request_id)
  WHERE status = 'pendiente';

ALTER TABLE study_request_admin_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FASE 2: CREAR FUNCIONES (ELIMINANDO CONFLICTOS PRIMERO)
-- ============================================================================

-- 2.0) Eliminar funciones que pueden tener conflictos
DROP FUNCTION IF EXISTS insert_study_group_message(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_study_group_messages(UUID, UUID, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS request_admin_transfer(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS accept_admin_transfer(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS leave_request_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_request_members(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_request_admin(UUID, UUID) CASCADE;

-- ============================================================================
-- FASE 3: CREAR FUNCIONES HELPER (SIN DEPENDENCIAS)
-- ============================================================================

-- 3.1) is_request_member: Valida si usuario es autor, admin o miembro aceptado
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

  -- Verificar si es el autor
  SELECT sr.author_id INTO v_author_id
  FROM study_requests sr
  WHERE sr.id = p_request_id;

  IF v_author_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- El autor siempre es miembro
  IF v_author_id = p_user_id THEN
    RETURN TRUE;
  END IF;

  -- Verificar si es admin registrado
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

  -- Verificar si es miembro aceptado
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

-- 3.2) is_request_admin: Valida si usuario es autor o admin
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

  -- Verificar si es admin registrado en study_request_admins
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
-- FASE 4: CREAR FUNCIONES DE CHAT
-- ============================================================================

-- 4.1) get_study_group_messages: Obtener mensajes del grupo
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

-- 4.2) insert_study_group_message: Insertar mensaje en el grupo
-- PARÁMETRO CORRECTO: p_group_id (no p_request_id)
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

  -- Insertar y capturar en variable (sin ambigüedad)
  INSERT INTO study_group_messages (request_id, sender_id, content)
  VALUES (p_group_id, p_sender_id, v_trimmed)
  RETURNING study_group_messages.* INTO v_new_message;

  -- Retornar con datos del perfil del remitente (alias explícito)
  id := v_new_message.id;
  request_id := v_new_message.request_id;
  sender_id := v_new_message.sender_id;
  content := v_new_message.content;
  created_at := v_new_message.created_at;
  sender_full_name := (SELECT prof.full_name FROM profiles prof WHERE prof.id = v_new_message.sender_id);
  sender_avatar_url := (SELECT prof.avatar_url FROM profiles prof WHERE prof.id = v_new_message.sender_id);

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_study_group_message(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- FASE 5: CREAR FUNCIONES DE TRANSFERENCIA DE ADMINISTRACIÓN
-- ============================================================================

-- 5.1) request_admin_transfer: Solicitar transferencia de admin
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

  -- Validar que es admin de esta solicitud
  IF NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'Solo los administradores pueden transferir administracion.' USING ERRCODE = 'P0001';
  END IF;

  -- No se puede transferir a sí mismo
  IF p_target_user_id = p_actor_user_id THEN
    RAISE EXCEPTION 'No puedes transferirte la administracion a ti mismo.' USING ERRCODE = 'P0001';
  END IF;

  -- Verificar que la solicitud existe
  SELECT EXISTS (SELECT 1 FROM study_requests sr WHERE sr.id = p_request_id)
  INTO v_request_exists;

  IF NOT v_request_exists THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  -- Verificar que el target es miembro aceptado
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

  -- Verificar que no hay transferencia pendiente
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

  -- Retornar sin ambigüedad
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

-- 5.2) accept_admin_transfer: Aceptar transferencia de admin
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

  -- Marcar transferencia como aceptada (alias en UPDATE)
  UPDATE study_request_admin_transfers sat
  SET status = 'aceptada',
      responded_at = NOW()
  WHERE sat.id = p_transfer_id;

  -- Agregar nuevo admin en study_request_admins
  INSERT INTO study_request_admins (request_id, user_id, granted_by)
  VALUES (v_transfer.request_id, v_transfer.to_user_id, v_transfer.from_user_id)
  ON CONFLICT (request_id, user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_admin_transfer(UUID, UUID) TO authenticated;

-- 5.3) leave_request_admin: Salir del rol de admin
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

  -- El autor NO puede salir
  IF v_author_id = p_actor_user_id THEN
    RAISE EXCEPTION 'El autor no puede salir del rol de administrador.' USING ERRCODE = 'P0001';
  END IF;

  -- Bloquear si hay transferencia pendiente DESDE este usuario
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
-- FASE 6: CREAR FUNCIONES DE LISTADO
-- ============================================================================

-- 6.1) get_request_members: Listar miembros del grupo (para elegir sucesor)
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
-- FIN: TODAS LAS TABLAS Y FUNCIONES CREADAS Y CORREGIDAS
-- ============================================================================
-- 
-- ✅ Tablas creadas:
--    - study_group_messages (chat grupal)
--    - user_notifications (notificaciones)
--    - study_request_admin_transfers (transferencias de admin)
--
-- ✅ Funciones helper creadas:
--    - is_request_member() - Valida membresía
--    - is_request_admin() - Valida administración
--
-- ✅ Funciones de chat creadas:
--    - get_study_group_messages(p_group_id, p_actor_user_id, p_limit, p_offset)
--    - insert_study_group_message(p_group_id, p_sender_id, p_content) ✅ PARÁMETRO CORRECTO
--
-- ✅ Funciones de transferencia creadas:
--    - request_admin_transfer() con alias explícito (sat)
--    - accept_admin_transfer() con alias explícito (sat)
--    - leave_request_admin() con bloqueo de transferencias pendientes
--
-- ✅ Funciones de listado creadas:
--    - get_request_members() para elegir sucesor en flujo "Abandonar grupo"
--
-- ============================================================================
