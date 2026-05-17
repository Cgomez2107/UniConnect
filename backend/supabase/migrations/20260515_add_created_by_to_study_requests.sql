-- ============================================================================
-- D02 (Profile Decorators): Add created_by column to study_requests
--
-- Permite diferenciar entre 'quién fundó el grupo' (created_by) y
-- 'quién lo administra hoy' (author_id ya existente, que puede cambiar
-- tras transferencias de administración).
-- ============================================================================

-- 1) Agregar columna created_by (UUID, nullable inicialmente)
ALTER TABLE study_requests
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2) Poblar created_by con el author_id actual para todos los registros existentes
--    (en el momento de creación, el fundador y el author son la misma persona)
--    Deshabilitamos triggers de usuario temporalmente porque validate_request_subject()
--    dispararía en cada UPDATE y fallaría si algún usuario ya no cursa la materia.
--    NOTA: Usamos DISABLE TRIGGER USER para evitar el error de permisos con triggers del sistema.
ALTER TABLE study_requests DISABLE TRIGGER USER;

UPDATE study_requests
  SET created_by = author_id
  WHERE created_by IS NULL;

ALTER TABLE study_requests ENABLE TRIGGER USER;

-- 3) Establecer NOT NULL una vez poblado (seguro porque author_id ya es NOT NULL)
ALTER TABLE study_requests
  ALTER COLUMN created_by SET NOT NULL;

-- 4) Documentación
COMMENT ON COLUMN study_requests.created_by
  IS 'UUID del usuario que fundó/creó el grupo originalmente (no cambia con transferencias de admin)';
