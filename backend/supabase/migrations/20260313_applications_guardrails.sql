-- ============================================================================
-- US-011 + US-012: Guardrails para postulaciones y gestion por autor
-- Fecha: 2026-03-13
-- ============================================================================

-- 1) Evita postulaciones duplicadas al mismo post.
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_request_applicant_unique
  ON applications (request_id, applicant_id);

-- 2) Valida reglas de negocio al crear postulaciones.
CREATE OR REPLACE FUNCTION validate_application_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  SELECT id, author_id, status, is_active
  INTO v_request
  FROM study_requests
  WHERE id = NEW.request_id;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'La solicitud de estudio no existe.' USING ERRCODE = 'P0001';
  END IF;

  IF v_request.is_active IS DISTINCT FROM TRUE OR v_request.status <> 'abierta' THEN
    RAISE EXCEPTION 'La convocatoria esta cerrada.' USING ERRCODE = 'P0001';
  END IF;

  IF v_request.author_id = NEW.applicant_id THEN
    RAISE EXCEPTION 'No puedes postularte a tu propia solicitud.' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_validate_before_insert ON applications;
CREATE TRIGGER applications_validate_before_insert
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION validate_application_insert();

-- 3) Gestion de postulaciones solo para el autor del post.
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
  v_author_id UUID;
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

  SELECT author_id
  INTO v_author_id
  FROM study_requests
  WHERE id = v_request_id;

  IF v_author_id IS NULL OR v_author_id <> p_reviewer_id THEN
    RAISE EXCEPTION 'No eres el autor de esta publicacion.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE applications
  SET status = p_status,
      reviewed_at = NOW()
  WHERE id = p_application_id;
END;
$$;

GRANT EXECUTE ON FUNCTION review_application_as_author(UUID, UUID, TEXT) TO authenticated;
