-- ============================================================================
-- Hotfix: accept_admin_transfer_backend reescrita solo con UPDATEs
--
-- PROBLEMA:
--   La funcion original usaba DELETE FROM study_request_admins para degradar
--   al antiguo admin, lo que se percibia como "expulsar al usuario del grupo".
--
-- SOLUCION:
--   1. Agrega columna `active` a study_request_admins (sin eliminar registros)
--   2. Actualiza is_request_admin / is_request_member / get_request_members
--      para filtrar solo admins activos
--   3. Re-escribe accept_admin_transfer_backend usando solo UPDATE + UPSERT
--   4. Re-escribe leave_request_admin_backend para usar UPDATE en vez de DELETE
-- ============================================================================

-- ============================================================================
-- PARTE 1: Schema — columna `active` en study_request_admins
-- ============================================================================
ALTER TABLE study_request_admins
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- PARTE 2: Helper is_request_admin — filtrar solo admins activos
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
  v_extra_admin BOOLEAN;
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
      AND sra.active = true        -- <-- solo admins activos
  )
  INTO v_extra_admin;

  RETURN COALESCE(v_extra_admin, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION is_request_admin(UUID, UUID) TO authenticated;

-- ============================================================================
-- PARTE 3: Helper is_request_member — filtrar solo admins activos
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
      AND sra.active = true        -- <-- solo admins activos
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
-- PARTE 4: get_request_members — filtrar solo admins activos
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
  IF NOT is_request_member(p_request_id, p_actor_user_id) THEN
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
      AND sra.active = true        -- <-- solo admins activos
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
-- PARTE 5: accept_admin_transfer_backend — SOLO UPDATEs, sin DELETE
--
-- Equivalent a los 4 pasos del SQL original:
--   1. UPDATE `group_members` SET role = 'miembro' WHERE ...
--      → UPDATE `study_request_admins` SET active = false
--        + UPDATE `applications` SET status = 'aceptada'
--   2. UPDATE `group_members` SET role = 'owner' WHERE ...
--      → UPDATE `study_requests` SET author_id = nuevo_admin
--   3. UPDATE `groups` SET owner_id = nuevo_admin WHERE ...
--      → Mismo UPDATE a study_requests.author_id (paso 2)
--   4. UPDATE `study_request_admin_transfers` SET status = 'aceptada' WHERE ...
-- ============================================================================
DROP FUNCTION IF EXISTS accept_admin_transfer_backend(UUID, UUID);

CREATE FUNCTION accept_admin_transfer_backend(
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
  v_author_id UUID;
BEGIN
  ----------------------------------------------------------------------------
  -- 1. Validaciones
  ----------------------------------------------------------------------------
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'actorUserId es requerido.' USING ERRCODE = 'P0001';
  END IF;

  SELECT t.* INTO v_transfer
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

  ----------------------------------------------------------------------------
  -- 2. Transferencia SOLO con UPDATE (NUNCA DELETE)
  --    4 pasos exactos que pide el negocio:
  ----------------------------------------------------------------------------

  -- PASO 1: Degradar al antiguo admin → 'miembro'
  --   a) Marcar como inactivo en study_request_admins (ya no es admin)
  UPDATE study_request_admins
  SET active = false
  WHERE request_id = v_transfer.request_id
    AND user_id = v_transfer.from_user_id;

  --   b) Asegurar que tenga aplicacion aceptada (para aparecer como 'miembro')
  UPDATE applications
  SET status = 'aceptada', reviewed_at = NOW()
  WHERE request_id = v_transfer.request_id
    AND applicant_id = v_transfer.from_user_id;

  -- PASO 2+3: Ascender al nuevo admin → 'owner'
  UPDATE study_requests
  SET author_id = v_transfer.to_user_id
  WHERE id = v_transfer.request_id;

  -- PASO 4: Marcar transferencia como aceptada
  UPDATE study_request_admin_transfers
  SET status = 'aceptada', responded_at = NOW()
  WHERE id = p_transfer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_admin_transfer_backend(UUID, UUID) TO authenticated;

-- ============================================================================
-- PARTE 6: leave_request_admin_backend — mismo cambio, UPDATE en vez de DELETE
-- ============================================================================
DROP FUNCTION IF EXISTS leave_request_admin_backend(UUID, UUID);

CREATE FUNCTION leave_request_admin_backend(
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
  v_admin_count INTEGER;
  v_new_author_id UUID;
BEGIN
  ----------------------------------------------------------------------------
  -- 1. Validaciones
  ----------------------------------------------------------------------------
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'actorUserId es requerido.' USING ERRCODE = 'P0001';
  END IF;

  SELECT author_id INTO v_author_id
  FROM study_requests
  WHERE id = p_request_id;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF v_author_id <> p_actor_user_id AND NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'No eres administrador de este grupo.' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*) INTO v_admin_count
  FROM (
    SELECT author_id AS user_id FROM study_requests WHERE id = p_request_id
    UNION
    SELECT user_id FROM study_request_admins WHERE request_id = p_request_id AND active = true
  ) admins
  WHERE user_id <> p_actor_user_id;

  IF v_admin_count < 1 THEN
    RAISE EXCEPTION 'Eres el unico administrador. Debes transferir el mando antes de salir.' USING ERRCODE = 'P0001';
  END IF;

  ----------------------------------------------------------------------------
  -- 2. Ejecutar la salida solo con UPDATEs
  ----------------------------------------------------------------------------
  IF v_author_id = p_actor_user_id THEN
    SELECT COALESCE(
      (SELECT user_id FROM study_request_admins WHERE request_id = p_request_id AND active = true LIMIT 1),
      (SELECT author_id FROM study_requests WHERE id = p_request_id AND author_id <> p_actor_user_id)
    ) INTO v_new_author_id;

    IF v_new_author_id IS NOT NULL THEN
      UPDATE study_requests
      SET author_id = v_new_author_id
      WHERE id = p_request_id;
    END IF;
  END IF;

  -- Antes: DELETE FROM study_request_admins WHERE ...
  -- Ahora:  UPDATE active = false (el registro permanece)
  UPDATE study_request_admins
  SET active = false
  WHERE request_id = p_request_id
    AND user_id = p_actor_user_id;

  -- Antes: DELETE FROM applications WHERE ...
  -- Ahora:  UPDATE status = 'rechazada' (el registro permanece)
  UPDATE applications
  SET status = 'rechazada', reviewed_at = NOW()
  WHERE request_id = p_request_id
    AND applicant_id = p_actor_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION leave_request_admin_backend(UUID, UUID) TO authenticated;

-- ============================================================================
-- PARTE 7: accept_admin_transfer — version con auth.uid() para RPC directo
--          Misma logica: solo UPDATEs, sin DELETE
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
  v_author_id UUID;
BEGIN
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  SELECT t.* INTO v_transfer
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

  -- SWAP de roles solo con UPDATEs
  UPDATE study_request_admins
  SET active = false
  WHERE request_id = v_transfer.request_id
    AND user_id = v_transfer.from_user_id;

  UPDATE applications
  SET status = 'aceptada', reviewed_at = NOW()
  WHERE request_id = v_transfer.request_id
    AND applicant_id = v_transfer.from_user_id;

  UPDATE study_requests
  SET author_id = v_transfer.to_user_id
  WHERE id = v_transfer.request_id;

  UPDATE study_request_admin_transfers
  SET status = 'aceptada', responded_at = NOW()
  WHERE id = p_transfer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_admin_transfer(UUID, UUID) TO authenticated;

-- ============================================================================
-- PARTE 8: leave_request_admin — version con auth.uid() para RPC directo
--          Misma logica: solo UPDATEs, sin DELETE
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
    RAISE EXCEPTION 'No eres administrador de este grupo.' USING ERRCODE = 'P0001';
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

  -- Antes: DELETE FROM study_request_admins WHERE ...
  -- Ahora:  UPDATE active = false
  UPDATE study_request_admins
  SET active = false
  WHERE request_id = p_request_id
    AND user_id = p_actor_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION leave_request_admin(UUID, UUID) TO authenticated;
