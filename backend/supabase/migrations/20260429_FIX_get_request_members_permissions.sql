-- ============================================================================
-- FIX: Permitir que miembros vean a otros miembros en get_request_members
-- Fecha: 2026-04-29
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
  -- CAMBIO: Usar is_request_member en lugar de is_request_admin
  -- para que los miembros normales puedan ver a sus compañeros.
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
