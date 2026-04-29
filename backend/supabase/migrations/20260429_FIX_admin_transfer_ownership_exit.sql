-- ============================================================================
-- FIX: Transferencia de autoría y salida automática post-aceptación
-- Fecha: 2026-04-29
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
  -- 1. Validar autorización básica
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Obtener datos de la transferencia
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

  -- 3. Marcar transferencia como aceptada
  UPDATE study_request_admin_transfers t
  SET status = 'aceptada',
      responded_at = NOW()
  WHERE t.id = p_transfer_id;

  -- 4. Añadir al nuevo administrador
  INSERT INTO study_request_admins (request_id, user_id, granted_by)
  VALUES (v_transfer.request_id, v_transfer.to_user_id, v_transfer.from_user_id)
  ON CONFLICT (request_id, user_id) DO NOTHING;

  -- 5. Gestionar la salida del administrador anterior
  SELECT author_id INTO v_author_id 
  FROM study_requests 
  WHERE id = v_transfer.request_id;
  
  -- 5.1 Si el que se va es el autor/dueño, transferir la propiedad del grupo
  IF v_author_id = v_transfer.from_user_id THEN
    UPDATE study_requests
    SET author_id = v_transfer.to_user_id
    WHERE id = v_transfer.request_id;
  END IF;

  -- 5.2 Eliminar de la tabla de administradores adicionales
  DELETE FROM study_request_admins
  WHERE request_id = v_transfer.request_id
    AND user_id = v_transfer.from_user_id;

  -- 5.3 Eliminar de la tabla de aplicaciones (miembros)
  -- Esto asegura que el usuario sea redirigido fuera de la vista de grupo
  DELETE FROM applications
  WHERE request_id = v_transfer.request_id
    AND applicant_id = v_transfer.from_user_id;

END;
$$;

GRANT EXECUTE ON FUNCTION accept_admin_transfer(UUID, UUID) TO authenticated;
