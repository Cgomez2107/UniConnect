-- ============================================================================
-- FIX: Salida unificada (Admin/Miembro) y correcciones de flujo
-- Fecha: 2026-04-29
-- ============================================================================

-- Actualizamos leave_request_admin para que sea una salida completa del grupo
-- tanto de la tabla de administradores como de la tabla de aplicaciones (miembros)
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
  -- 1. Validar autorización básica
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Obtener autor para validar que no sea él quien intenta salir directamente
  SELECT author_id INTO v_author_id FROM study_requests WHERE id = p_request_id;
  
  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Grupo de estudio no encontrado.' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Si el usuario es el autor, NO puede salir sin delegar
  IF v_author_id = p_actor_user_id THEN
    RAISE EXCEPTION 'Como creador del grupo, debes delegar la administración a otro miembro antes de salir.' USING ERRCODE = 'P0001';
  END IF;

  -- 4. Validar si hay transferencias pendientes enviadas por este usuario
  IF EXISTS (
    SELECT 1 
    FROM study_request_admin_transfers t
    WHERE t.request_id = p_request_id 
      AND t.from_user_id = p_actor_user_id 
      AND t.status = 'pendiente'
  ) THEN
    RAISE EXCEPTION 'No puedes salir mientras tengas una solicitud de transferencia pendiente.' USING ERRCODE = 'P0001';
  END IF;

  -- 5. ELIMINACIÓN: Salida efectiva del grupo
  
  -- 5.1 Eliminar de administradores adicionales
  DELETE FROM study_request_admins
  WHERE request_id = p_request_id AND user_id = p_actor_user_id;

  -- 5.2 Eliminar de aplicaciones (miembros aceptados)
  -- Esto permite que tanto administradores como miembros normales salgan del grupo
  DELETE FROM applications
  WHERE request_id = p_request_id AND applicant_id = p_actor_user_id;

END;
$$;

GRANT EXECUTE ON FUNCTION leave_request_admin(UUID, UUID) TO authenticated;
