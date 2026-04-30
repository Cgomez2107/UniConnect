-- ============================================================================
-- Corrección de Límite de Grupos: 3 por asignatura TOTAL
-- Fecha: 2026-04-29
-- ============================================================================

-- 1) Eliminar cualquier restricción UNIQUE antigua si existiera (limpieza preventiva)
DO $$ 
BEGIN
    -- Eliminar constraints de unicidad
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_requests_subject_id_key') THEN
        ALTER TABLE study_requests DROP CONSTRAINT study_requests_subject_id_key;
    END IF;
    
    -- Eliminar índices únicos directos
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_requests_subject_unique') THEN
        DROP INDEX idx_study_requests_subject_unique;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'study_requests_subject_id_idx_unique') THEN
        DROP INDEX study_requests_subject_id_idx_unique;
    END IF;

    -- Eliminar el índice que limita a 1 grupo por usuario/materia
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'unique_open_request_per_subject') THEN
        DROP INDEX unique_open_request_per_subject;
    END IF;
END $$;

-- 2) Actualizar la función de validación para contar TOTAL por asignatura
-- Anteriormente contaba por author_id + subject_id (límite por usuario).
-- Ahora garantiza que no haya más de 3 grupos abiertos por materia en toda la plataforma.
CREATE OR REPLACE FUNCTION validate_study_request_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_count INTEGER;
BEGIN
  -- Contamos TODAS las solicitudes abiertas para esta asignatura
  SELECT COUNT(*)
  INTO v_total_count
  FROM study_requests
  WHERE subject_id = NEW.subject_id
    AND is_active = TRUE
    AND status = 'abierta';

  IF v_total_count >= 3 THEN
    RAISE EXCEPTION 'Esta materia ya alcanzó el límite de 3 grupos activos. Intenta unirte a uno existente para concentrar la colaboración.' 
    USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Re-asegurar que el trigger esté vinculado
DROP TRIGGER IF EXISTS study_requests_validate_before_insert ON study_requests;
CREATE TRIGGER study_requests_validate_before_insert
  BEFORE INSERT ON study_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_study_request_insert();
