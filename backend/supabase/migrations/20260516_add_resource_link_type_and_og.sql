-- ══════════════════════════════════════════════════════════════════════════════
-- US-V03: Biblioteca Colaborativa de Recursos
-- Agregar soporte para recursos tipo link con metadatos Open Graph
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. AGREGAR COLUMNAS A STUDY_RESOURCES ────────────────────────────────────

ALTER TABLE study_resources ADD COLUMN IF NOT EXISTS resource_type VARCHAR(10) NOT NULL DEFAULT 'file'
  CHECK (resource_type IN ('file', 'link'));

ALTER TABLE study_resources ADD COLUMN IF NOT EXISTS url TEXT;

ALTER TABLE study_resources ADD COLUMN IF NOT EXISTS og_title VARCHAR(255);

ALTER TABLE study_resources ADD COLUMN IF NOT EXISTS og_description TEXT;

ALTER TABLE study_resources ADD COLUMN IF NOT EXISTS og_image TEXT;

ALTER TABLE study_resources ADD COLUMN IF NOT EXISTS og_scraped_at TIMESTAMPTZ;

-- ── 2. MODIFICAR CONSTRAINTS ────────────────────────────────────────────────

-- Para recursos tipo link, file_url y file_name pueden ser NULL
ALTER TABLE study_resources ALTER COLUMN file_url DROP NOT NULL;
ALTER TABLE study_resources ALTER COLUMN file_name DROP NOT NULL;

-- ── 3. ÍNDICES ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_study_resources_resource_type
  ON study_resources(resource_type);

CREATE INDEX IF NOT EXISTS idx_study_resources_url
  ON study_resources(url) WHERE url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_study_resources_og_scraped_at
  ON study_resources(og_scraped_at) WHERE og_scraped_at IS NOT NULL;

-- ── 4. COMENTARIOS DE DOCUMENTACIÓN ─────────────────────────────────────────

COMMENT ON COLUMN study_resources.resource_type IS 'Tipo de recurso: file (archivo subido) o link (enlace externo)';

COMMENT ON COLUMN study_resources.url IS 'URL original del recurso (solo para resource_type = link)';

COMMENT ON COLUMN study_resources.og_title IS 'Título extraído del Open Graph del URL';

COMMENT ON COLUMN study_resources.og_description IS 'Descripción extraída del Open Graph del URL';

COMMENT ON COLUMN study_resources.og_image IS 'URL de la imagen preview extraída del Open Graph';
