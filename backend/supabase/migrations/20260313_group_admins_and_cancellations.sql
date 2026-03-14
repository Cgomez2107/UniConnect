-- ============================================================================
-- US: Admins de grupo multiples + cancelaciones (autor/admin y postulante)
-- Fecha: 2026-03-13
-- ============================================================================

-- 1) Tabla de admins adicionales por solicitud (el autor ya es admin por defecto).
CREATE TABLE IF NOT EXISTS study_request_admins (
  request_id  UUID NOT NULL REFERENCES study_requests(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_study_request_admins_user
  ON study_request_admins(user_id);

ALTER TABLE study_request_admins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'study_request_admins'
      AND policyname = 'study_request_admins_select_for_authenticated'
  ) THEN
    CREATE POLICY study_request_admins_select_for_authenticated
      ON study_request_admins
      FOR SELECT
      TO authenticated
      USING (TRUE);
  END IF;
END
$$;

-- 2) Helper: valida si un usuario es admin de la solicitud.
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
  )
  INTO v_extra_admin;

  RETURN COALESCE(v_extra_admin, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION is_request_admin(UUID, UUID) TO authenticated;

-- 3) Reemplaza RPC de revision para permitir admins (no solo autor).
CREATE OR REPLACE FUNCTION review_application_as_author(
  p_application_id UUID,
  p_reviewer_id UUID,
  p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
  v_current_status TEXT;
BEGIN
  IF p_reviewer_id IS NULL OR p_reviewer_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado para gestionar solicitudes.' USING ERRCODE = 'P0001';
  END IF;

  IF p_status NOT IN ('aceptada', 'rechazada') THEN
    RAISE EXCEPTION 'Estado de revision invalido.' USING ERRCODE = 'P0001';
  END IF;

  SELECT request_id, status
  INTO v_request_id, v_current_status
  FROM applications
  WHERE id = p_application_id;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'La postulacion no existe.' USING ERRCODE = 'P0001';
  END IF;

  IF v_current_status <> 'pendiente' THEN
    RAISE EXCEPTION 'La postulacion ya fue gestionada.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT is_request_admin(v_request_id, p_reviewer_id) THEN
    RAISE EXCEPTION 'No tienes permisos de administrador en esta solicitud.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE applications
  SET status = p_status,
      reviewed_at = NOW()
  WHERE id = p_application_id;
END;
$$;

GRANT EXECUTE ON FUNCTION review_application_as_author(UUID, UUID, TEXT) TO authenticated;

-- 4) Asignar admin a miembro aceptado.
CREATE OR REPLACE FUNCTION assign_request_admin(
  p_request_id UUID,
  p_target_user_id UUID,
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
    RAISE EXCEPTION 'Solo los administradores pueden asignar admins.' USING ERRCODE = 'P0001';
  END IF;

  SELECT author_id INTO v_author_id FROM study_requests WHERE id = p_request_id;
  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF p_target_user_id = v_author_id THEN
    RAISE EXCEPTION 'El autor ya es admin por defecto.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.request_id = p_request_id
      AND a.applicant_id = p_target_user_id
      AND a.status = 'aceptada'
  ) THEN
    RAISE EXCEPTION 'Solo miembros aceptados pueden ser administradores.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO study_request_admins (request_id, user_id, granted_by)
  VALUES (p_request_id, p_target_user_id, p_actor_user_id)
  ON CONFLICT (request_id, user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION assign_request_admin(UUID, UUID, UUID) TO authenticated;

-- 5) Quitar admin (no permite quitar al autor).
CREATE OR REPLACE FUNCTION revoke_request_admin(
  p_request_id UUID,
  p_target_user_id UUID,
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
    RAISE EXCEPTION 'Solo los administradores pueden quitar admins.' USING ERRCODE = 'P0001';
  END IF;

  SELECT author_id INTO v_author_id FROM study_requests WHERE id = p_request_id;
  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF p_target_user_id = v_author_id THEN
    RAISE EXCEPTION 'No puedes quitar al autor del rol de admin.' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM study_request_admins
  WHERE request_id = p_request_id
    AND user_id = p_target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION revoke_request_admin(UUID, UUID, UUID) TO authenticated;

-- 6) Listar admins de una solicitud.
CREATE OR REPLACE FUNCTION get_request_admins(
  p_request_id UUID
)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  granted_by UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    sra.user_id,
    p.full_name,
    p.avatar_url,
    sra.granted_by,
    sra.created_at
  FROM study_request_admins sra
  JOIN profiles p ON p.id = sra.user_id
  WHERE sra.request_id = p_request_id
  ORDER BY sra.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_request_admins(UUID) TO authenticated;

-- 7) Editar contenido de solicitud por admin.
CREATE OR REPLACE FUNCTION update_request_content_as_admin(
  p_request_id UUID,
  p_actor_user_id UUID,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'Solo administradores pueden editar la solicitud.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE study_requests
  SET title = COALESCE(NULLIF(TRIM(p_title), ''), title),
      description = COALESCE(NULLIF(TRIM(p_description), ''), description),
      updated_at = NOW()
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_request_content_as_admin(UUID, UUID, TEXT, TEXT) TO authenticated;

-- 8) Cancelar solicitud (autor/admin).
CREATE OR REPLACE FUNCTION cancel_study_request(
  p_request_id UUID,
  p_actor_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'Solo administradores pueden cancelar la solicitud.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE study_requests
  SET status = 'cerrada',
      is_active = FALSE,
      updated_at = NOW()
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_study_request(UUID, UUID) TO authenticated;

-- 9) Cancelar postulacion/participacion por parte del postulante.
-- Si estaba aceptado, se interpreta como salir del grupo.
CREATE OR REPLACE FUNCTION cancel_my_application(
  p_request_id UUID,
  p_actor_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app_id UUID;
BEGIN
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  SELECT id
  INTO v_app_id
  FROM applications
  WHERE request_id = p_request_id
    AND applicant_id = p_actor_user_id
  LIMIT 1;

  IF v_app_id IS NULL THEN
    RAISE EXCEPTION 'No tienes una postulacion activa en esta solicitud.' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM study_request_admins
  WHERE request_id = p_request_id
    AND user_id = p_actor_user_id;

  DELETE FROM applications
  WHERE id = v_app_id;
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_my_application(UUID, UUID) TO authenticated;
