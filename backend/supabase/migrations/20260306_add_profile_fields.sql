-- ══════════════════════════════════════════════════════════════════════════════
-- US-004: Completar perfil público + US-006: Compartir apuntes
-- Agregar campos de teléfono y recurso para compartir en profiles
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. ALTERAR TABLA PROFILES ─────────────────────────────────────────────────

-- Agregar campo de teléfono (opcional)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Agregar índice para búsqueda por teléfono (si es necesario)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number
  ON profiles(phone_number) WHERE phone_number IS NOT NULL;

-- ── 2. CREAR TABLA DE RECURSOS COMPARTIDOS (para US-006) ──────────────────────

CREATE TABLE IF NOT EXISTS study_resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id    UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  subject_id    UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  file_url      TEXT NOT NULL,  -- URL del archivo en storage (Supabase)
  file_name     VARCHAR(255) NOT NULL,
  file_type     VARCHAR(50),    -- PDF, DOCX, XLSX, etc.
  file_size_kb  INTEGER,        -- Tamaño en KB para auditoría
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. ÍNDICES PARA STUDY_RESOURCES ───────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_study_resources_user_id
  ON study_resources(user_id);

CREATE INDEX IF NOT EXISTS idx_study_resources_subject_id
  ON study_resources(subject_id);

CREATE INDEX IF NOT EXISTS idx_study_resources_program_id
  ON study_resources(program_id);

CREATE INDEX IF NOT EXISTS idx_study_resources_created_at
  ON study_resources(created_at DESC);

-- ── 4. ROW LEVEL SECURITY (RLS) ───────────────────────────────────────────────

ALTER TABLE study_resources ENABLE ROW LEVEL SECURITY;

-- Política: Cualquier usuario autenticado puede ver recursos de otros
CREATE POLICY "study_resources_select" ON study_resources
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política: Solo el propietario puede insertar
CREATE POLICY "study_resources_insert" ON study_resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Solo el propietario puede actualizar
CREATE POLICY "study_resources_update" ON study_resources
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Solo el propietario puede eliminar
CREATE POLICY "study_resources_delete" ON study_resources
  FOR DELETE USING (auth.uid() = user_id);

-- ── 5. COMENTARIOS DE DOCUMENTACIÓN ───────────────────────────────────────────

COMMENT ON COLUMN profiles.phone_number IS 'Teléfono del estudiante para contacto directo (formato internacional recomendado)';

COMMENT ON TABLE study_resources IS 'Recursos de estudio (apuntes, ejercicios) compartidos por estudiantes, vinculados a una materia y programa';

COMMENT ON COLUMN study_resources.file_url IS 'URL pública del archivo en Supabase Storage';

COMMENT ON COLUMN study_resources.file_type IS 'Extensión del archivo (ej: pdf, docx, xlsx)';
