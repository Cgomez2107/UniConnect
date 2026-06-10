-- ══════════════════════════════════════════════════════════════════════════════
-- RPC: Obtener usuarios con email para el panel de administración
-- Une profiles con auth_users para mostrar el correo electrónico real
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_admin_users_with_email()
RETURNS TABLE (
  id          UUID,
  full_name   TEXT,
  email       TEXT,
  role        TEXT,
  is_active   BOOLEAN,
  semester    INTEGER,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    COALESCE(p.email, au.email, '') AS email,
    p.role,
    p.is_active,
    p.semester,
    p.avatar_url,
    p.created_at
  FROM profiles p
  LEFT JOIN auth_users au ON au.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_users_with_email() TO authenticated;
