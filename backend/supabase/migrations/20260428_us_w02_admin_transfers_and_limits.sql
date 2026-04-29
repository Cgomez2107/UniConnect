-- ============================================================================
-- US-W02: Admin transfers + members list + max 3 groups per subject
-- Fecha: 2026-04-28
-- ============================================================================

-- 1) Tabla de transferencias de administracion
CREATE TABLE IF NOT EXISTS study_request_admin_transfers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID NOT NULL REFERENCES study_requests(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pendiente',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_transfers_request
  ON study_request_admin_transfers(request_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_transfers_request_pending
  ON study_request_admin_transfers(request_id)
  WHERE status = 'pendiente';

ALTER TABLE study_request_admin_transfers ENABLE ROW LEVEL SECURITY;

-- 2) Solicitar transferencia de admin
CREATE OR REPLACE FUNCTION request_admin_transfer(
  p_request_id UUID,
  p_target_user_id UUID,
  p_actor_user_id UUID
)
RETURNS TABLE (
  id UUID,
  request_id UUID,
  from_user_id UUID,
  to_user_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_exists BOOLEAN;
  v_target_is_member BOOLEAN;
BEGIN
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  IF NOT is_request_admin(p_request_id, p_actor_user_id) THEN
    RAISE EXCEPTION 'Solo los administradores pueden transferir administracion.' USING ERRCODE = 'P0001';
  END IF;

  IF p_target_user_id = p_actor_user_id THEN
    RAISE EXCEPTION 'No puedes transferirte la administracion a ti mismo.' USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (SELECT 1 FROM study_requests WHERE id = p_request_id)
  INTO v_request_exists;

  IF NOT v_request_exists THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.request_id = p_request_id
      AND a.applicant_id = p_target_user_id
      AND a.status = 'aceptada'
  )
  INTO v_target_is_member;

  IF NOT v_target_is_member THEN
    RAISE EXCEPTION 'Solo miembros aceptados pueden recibir la transferencia.' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM study_request_admin_transfers t
    WHERE t.request_id = p_request_id
      AND t.status = 'pendiente'
  ) THEN
    RAISE EXCEPTION 'Ya existe una transferencia pendiente para esta solicitud.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO study_request_admin_transfers (request_id, from_user_id, to_user_id, status)
  VALUES (p_request_id, p_actor_user_id, p_target_user_id, 'pendiente')
  RETURNING study_request_admin_transfers.*
  INTO id, request_id, from_user_id, to_user_id, status, created_at, responded_at;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION request_admin_transfer(UUID, UUID, UUID) TO authenticated;

-- 3) Aceptar transferencia de admin
CREATE OR REPLACE FUNCTION accept_admin_transfer(
  p_transfer_id UUID,
  p_actor_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer study_request_admin_transfers%ROWTYPE;
BEGIN
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  SELECT *
  INTO v_transfer
  FROM study_request_admin_transfers
  WHERE id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RAISE EXCEPTION 'Transferencia no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.status <> 'pendiente' THEN
    RAISE EXCEPTION 'La transferencia ya fue resuelta.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.to_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'No autorizado para aceptar esta transferencia.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE study_request_admin_transfers
  SET status = 'aceptada',
      responded_at = NOW()
  WHERE id = p_transfer_id;

  INSERT INTO study_request_admins (request_id, user_id, granted_by)
  VALUES (v_transfer.request_id, v_transfer.to_user_id, v_transfer.from_user_id)
  ON CONFLICT (request_id, user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_admin_transfer(UUID, UUID) TO authenticated;

-- 4) Listar miembros (autor + admins + aceptados)
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
  IF NOT is_request_admin(p_request_id, p_actor_user_id) THEN
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
  SELECT DISTINCT ON (b.user_id)
    b.user_id,
    p.full_name,
    p.avatar_url,
    b.role,
    b.joined_at
  FROM base b
  JOIN profiles p ON p.id = b.user_id
  ORDER BY b.user_id,
           CASE b.role WHEN 'autor' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
           b.joined_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_request_members(UUID, UUID) TO authenticated;

-- 5) Regla de maximo 3 grupos activos por asignatura
CREATE OR REPLACE FUNCTION validate_study_request_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM study_requests
  WHERE author_id = NEW.author_id
    AND subject_id = NEW.subject_id
    AND is_active = TRUE;

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Has alcanzado el limite de grupos activos que puedes crear.' USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS study_requests_validate_before_insert ON study_requests;
CREATE TRIGGER study_requests_validate_before_insert
  BEFORE INSERT ON study_requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_study_request_insert();

-- 6) Salida de administracion (bloqueada si hay transferencia pendiente)
CREATE OR REPLACE FUNCTION leave_request_admin(
  p_request_id UUID,
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
    RAISE EXCEPTION 'Solo los administradores pueden salir del rol.' USING ERRCODE = 'P0001';
  END IF;

  SELECT author_id INTO v_author_id FROM study_requests WHERE id = p_request_id;
  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF v_author_id = p_actor_user_id THEN
    RAISE EXCEPTION 'El autor no puede salir del rol de administrador.' USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM study_request_admin_transfers t
    WHERE t.request_id = p_request_id
      AND t.from_user_id = p_actor_user_id
      AND t.status = 'pendiente'
  ) THEN
    RAISE EXCEPTION 'No puedes salir mientras exista una transferencia pendiente.' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM study_request_admins
  WHERE request_id = p_request_id
    AND user_id = p_actor_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION leave_request_admin(UUID, UUID) TO authenticated;
