-- ══════════════════════════════════════════════════════════════════════════════
-- US-004: Completar perfil público
-- Cambio atómico de programa principal para un usuario
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION set_primary_program(
  p_user_id UUID,
  p_program_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_user_id IS NULL OR p_program_id IS NULL THEN
    RAISE EXCEPTION 'user_id y program_id son obligatorios';
  END IF;

  DELETE FROM user_programs
  WHERE user_id = p_user_id;

  INSERT INTO user_programs (user_id, program_id, is_primary, enrolled_at)
  VALUES (p_user_id, p_program_id, TRUE, NOW());
END;
$$;

COMMENT ON FUNCTION set_primary_program IS
  'US-004: Establece el programa principal del usuario de forma atómica.';
