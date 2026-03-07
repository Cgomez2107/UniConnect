-- ══════════════════════════════════════════════════════════════════════════════
-- US-005: Buscar compañeros por materia
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- Crea una función RPC que busca estudiantes inscritos en una materia dada.
-- Excluye al usuario que hace la consulta para evitar auto-resultados.
-- Soporta paginación básica (limit + offset).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. FUNCIÓN RPC: search_students_by_subject ────────────────────────────────
-- Busca estudiantes que cursan la materia indicada (excluye al solicitante).
-- Devuelve perfil básico + programa principal del estudiante.
--
-- Parámetros:
--   p_subject_id  UUID    — ID de la materia a buscar
--   p_user_id     UUID    — ID del usuario autenticado (se excluye de resultados)
--   p_limit       INT     — Máximo de resultados (default 20)
--   p_offset      INT     — Inicio de la ventana de paginación (default 0)
--
-- Retorna:
--   id, full_name, avatar_url, bio, semester, program_name, faculty_name

CREATE OR REPLACE FUNCTION search_students_by_subject(
  p_subject_id UUID,
  p_user_id    UUID,
  p_limit      INT DEFAULT 20,
  p_offset     INT DEFAULT 0
)
RETURNS TABLE (
  id            UUID,
  full_name     TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  semester      INT,
  program_name  TEXT,
  faculty_name  TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    pr.id,
    pr.full_name,
    pr.avatar_url,
    pr.bio,
    pr.semester,
    -- Programa principal del estudiante (o el primero disponible)
    (
      SELECT pg.name
      FROM user_programs up
      JOIN programs pg ON pg.id = up.program_id
      WHERE up.user_id = pr.id
      ORDER BY up.is_primary DESC
      LIMIT 1
    ) AS program_name,
    -- Facultad del programa principal
    (
      SELECT f.name
      FROM user_programs up
      JOIN programs pg ON pg.id = up.program_id
      JOIN faculties f  ON f.id  = pg.faculty_id
      WHERE up.user_id = pr.id
      ORDER BY up.is_primary DESC
      LIMIT 1
    ) AS faculty_name
  FROM user_subjects us
  JOIN profiles pr ON pr.id = us.user_id
  WHERE us.subject_id = p_subject_id
    AND us.user_id   != p_user_id
    AND pr.is_active   = TRUE
    AND pr.role        = 'estudiante'
  ORDER BY pr.full_name ASC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

-- ── 2. ÍNDICE para acelerar búsquedas por materia ─────────────────────────────
-- user_subjects(subject_id) ya se usa en joins; este índice compuesto
-- cubre la consulta principal sin acceder a la tabla base.

CREATE INDEX IF NOT EXISTS idx_user_subjects_subject_user
  ON user_subjects(subject_id, user_id);

-- ── 3. COMENTARIOS DE DOCUMENTACIÓN ───────────────────────────────────────────

COMMENT ON FUNCTION search_students_by_subject IS
  'US-005: Busca estudiantes inscritos en una materia específica, excluyendo al solicitante. Soporta paginación.';
