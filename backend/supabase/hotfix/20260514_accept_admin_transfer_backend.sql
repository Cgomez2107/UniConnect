-- ============================================================================
-- Hotfix: accept_admin_transfer_backend
-- 
-- Parche para CRIT-1: El PersistenceObserver fallaba al llamar a
-- accept_admin_transfer porque el backend opera con un pool de conexiones
-- sin sesion de usuario activa (auth.uid() = NULL), lo que disparaba la
-- excepcion de seguridad en la funcion original.
--
-- Esta variante omite la verificacion de auth.uid() y en su lugar valida
-- que el p_actor_user_id coincida con el to_user_id de la transferencia.
--
-- Uso: Ejecutar en Supabase Dashboard > SQL Editor
-- Safe de re-ejecutar (DROP FUNCTION IF EXISTS al inicio)
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
  -- 1. Validaciones de seguridad y negocio
  ----------------------------------------------------------------------------

  -- El backend siempre debe enviar un actorUserId
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'actorUserId es requerido.' USING ERRCODE = 'P0001';
  END IF;

  -- Obtener datos de la transferencia
  SELECT t.*
  INTO v_transfer
  FROM study_request_admin_transfers t
  WHERE t.id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RAISE EXCEPTION 'Transferencia no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  -- Solo se puede aceptar una transferencia en estado 'pendiente'
  IF v_transfer.status <> 'pendiente' THEN
    RAISE EXCEPTION 'La transferencia ya fue resuelta.' USING ERRCODE = 'P0001';
  END IF;

  -- Validar que el actor es el destinatario de la transferencia
  -- (reemplaza la verificacion de auth.uid() de la funcion original)
  IF v_transfer.to_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'No autorizado para aceptar esta transferencia.' USING ERRCODE = 'P0001';
  END IF;

  ----------------------------------------------------------------------------
  -- 2. Ejecutar la transferencia de propiedad
  ----------------------------------------------------------------------------

  -- 2a. Marcar la transferencia como aceptada
  UPDATE study_request_admin_transfers t
  SET status = 'aceptada',
      responded_at = NOW()
  WHERE t.id = p_transfer_id;

  -- 2b. Anadir al nuevo administrador
  INSERT INTO study_request_admins (request_id, user_id, granted_by)
  VALUES (v_transfer.request_id, v_transfer.to_user_id, v_transfer.from_user_id)
  ON CONFLICT (request_id, user_id) DO NOTHING;

  -- 2c. Transferir la propiedad del grupo (author_id) solo si el anterior
  --     autor es el admin que esta transfiriendo
  SELECT author_id INTO v_author_id
  FROM study_requests
  WHERE id = v_transfer.request_id;

  IF v_author_id = v_transfer.from_user_id THEN
    UPDATE study_requests
    SET author_id = v_transfer.to_user_id
    WHERE id = v_transfer.request_id;
  END IF;

  -- 2d. Eliminar al admin anterior de la tabla de admins y de miembros
  DELETE FROM study_request_admins
  WHERE request_id = v_transfer.request_id
    AND user_id = v_transfer.from_user_id;

  DELETE FROM applications
  WHERE request_id = v_transfer.request_id
    AND applicant_id = v_transfer.from_user_id;
END;
$$;

-- Otorgar permisos de ejecucion a usuarios autenticados
GRANT EXECUTE ON FUNCTION accept_admin_transfer_backend(UUID, UUID) TO authenticated;

-- ============================================================================
-- Nota: Esta funcion es llamada por el PersistenceObserver del backend
-- cuando se emite un evento TRANSFERENCIA_ADMIN_ACEPTADA.
-- El actorUserId real viaja desde el caso de uso AcceptAdminTransfer
-- -> evento -> PersistenceObserver -> esta funcion.
-- ============================================================================

-- ============================================================================
-- Hotfix: leave_request_admin_backend
--
-- Variante backend de leave_request_admin que:
-- 1. Omite la verificacion de auth.uid() (pool de conexiones sin sesion)
-- 2. Permite que el autor (creador) renuncie, reasignando author_id
-- 3. Omite la restriccion de transferencias pendientes (validado por State)
-- 4. Valida que quede al menos 1 administrador despues de la salida
--
-- Llamada por PersistenceObserver cuando se emite ADMIN_ROLE_LEFT
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

  -- Verificar que la solicitud existe
  SELECT author_id INTO v_author_id
  FROM study_requests
  WHERE id = p_request_id;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  -- Verificar que el usuario es administrador (autor o admin adicional)
  IF v_author_id <> p_actor_user_id AND NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'No eres administrador de este grupo.' USING ERRCODE = 'P0001';
  END IF;

  -- Proteccion de huerfanos: contar cuantos admins quedaran despues
  SELECT COUNT(*) INTO v_admin_count
  FROM (
    SELECT author_id AS user_id FROM study_requests WHERE id = p_request_id
    UNION
    SELECT user_id FROM study_request_admins WHERE request_id = p_request_id
  ) admins
  WHERE user_id <> p_actor_user_id;

  IF v_admin_count < 1 THEN
    RAISE EXCEPTION 'Eres el unico administrador. Debes transferir el mando antes de salir.' USING ERRCODE = 'P0001';
  END IF;

  ----------------------------------------------------------------------------
  -- 2. Ejecutar la salida
  ----------------------------------------------------------------------------

  -- 2a. Si el usuario que se va es el autor, reasignar author_id a otro admin
  IF v_author_id = p_actor_user_id THEN
    SELECT COALESCE(
      (SELECT user_id FROM study_request_admins WHERE request_id = p_request_id LIMIT 1),
      (SELECT author_id FROM study_requests WHERE id = p_request_id AND author_id <> p_actor_user_id)
    ) INTO v_new_author_id;

    IF v_new_author_id IS NOT NULL THEN
      UPDATE study_requests
      SET author_id = v_new_author_id
      WHERE id = p_request_id;
    END IF;
  END IF;

  -- 2b. Eliminar de la tabla de admins
  DELETE FROM study_request_admins
  WHERE request_id = p_request_id
    AND user_id = p_actor_user_id;

  -- 2c. Eliminar solicitudes de membresia pendientes del usuario
  DELETE FROM applications
  WHERE request_id = p_request_id
    AND applicant_id = p_actor_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION leave_request_admin_backend(UUID, UUID) TO authenticated;

-- ============================================================================
-- Nota: Esta funcion es llamada por el PersistenceObserver del backend
-- cuando se emite un evento ADMIN_ROLE_LEFT.
-- El userId viaja desde el caso de uso LeaveAdminRole
-- -> group.leaveAdminRole() -> estado -> emit(ADMIN_ROLE_LEFT)
-- -> PersistenceObserver -> repository.leaveAdminRole() -> esta funcion.
-- ============================================================================
