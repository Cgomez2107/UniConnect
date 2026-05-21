-- ============================================================================
-- ST01: Refactor a patron State + Observer para transferencias de admin
-- Fecha: 2026-05-14
--
-- Dependencias:
--   - study_requests, profiles, applications, study_request_admins existen
--   - is_request_admin(), is_request_member() existen
-- ============================================================================

-- ============================================================================
-- 1. Tabla de transferencias (idempotente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS study_request_admin_transfers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID NOT NULL REFERENCES study_requests(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pendiente'
               CHECK (status IN ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_transfers_request
  ON study_request_admin_transfers(request_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_transfers_request_pending
  ON study_request_admin_transfers(request_id)
  WHERE status = 'pendiente';

ALTER TABLE study_request_admin_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RLS — Seguridad a nivel de fila
-- ============================================================================

-- SELECT: el usuario puede ver transferencias donde es origen, destino, o admin del grupo
DROP POLICY IF EXISTS "Users can view their own transfers" ON study_request_admin_transfers;
CREATE POLICY "Users can view their own transfers"
  ON study_request_admin_transfers
  FOR SELECT
  USING (
    auth.uid() = from_user_id
    OR auth.uid() = to_user_id
    OR is_request_admin(request_id, auth.uid())
  );

-- INSERT: solo administradores del grupo pueden solicitar
DROP POLICY IF EXISTS "Admins can request transfers" ON study_request_admin_transfers;
CREATE POLICY "Admins can request transfers"
  ON study_request_admin_transfers
  FOR INSERT
  WITH CHECK (
    is_request_admin(request_id, auth.uid())
    AND auth.uid() = from_user_id
  );

-- UPDATE: el destinatario puede actualizar (aceptar/rechazar)
DROP POLICY IF EXISTS "Recipients can update their transfers" ON study_request_admin_transfers;
CREATE POLICY "Recipients can update their transfers"
  ON study_request_admin_transfers
  FOR UPDATE
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- ============================================================================
-- 3. Funciones del flujo de transferencia
-- ============================================================================

-- --------------------------------------------------------------------------
-- 3.1 request_admin_transfer(p_request_id, p_target_user_id, p_actor_user_id)
-- --------------------------------------------------------------------------
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

-- --------------------------------------------------------------------------
-- 3.2 accept_admin_transfer(p_transfer_id, p_actor_user_id)
--      Transfiere la propiedad del grupo y limpia al admin anterior
-- --------------------------------------------------------------------------
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
  v_author_id UUID;
BEGIN
  -- 1. Validar autorizacion
  IF p_actor_user_id IS NULL OR p_actor_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado.' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Obtener datos de la transferencia
  SELECT t.*
  INTO v_transfer
  FROM study_request_admin_transfers t
  WHERE t.id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RAISE EXCEPTION 'Transferencia no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.status <> 'pendiente' THEN
    RAISE EXCEPTION 'La transferencia ya fue resuelta.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.to_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'No autorizado para aceptar esta transferencia.' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Marcar transferencia como aceptada
  UPDATE study_request_admin_transfers t
  SET status = 'aceptada',
      responded_at = NOW()
  WHERE t.id = p_transfer_id;

  -- 4. Anadir al nuevo administrador
  INSERT INTO study_request_admins (request_id, user_id, granted_by)
  VALUES (v_transfer.request_id, v_transfer.to_user_id, v_transfer.from_user_id)
  ON CONFLICT (request_id, user_id) DO NOTHING;

  -- 5. Transferir la propiedad del grupo (author_id)
  SELECT author_id INTO v_author_id
  FROM study_requests
  WHERE id = v_transfer.request_id;

  IF v_author_id = v_transfer.from_user_id THEN
    UPDATE study_requests
    SET author_id = v_transfer.to_user_id
    WHERE id = v_transfer.request_id;
  END IF;

  -- 6. SWAP de roles: antiguo admin pasa a 'miembro', nuevo admin a 'owner'
  DELETE FROM study_request_admins
  WHERE request_id = v_transfer.request_id
    AND user_id = v_transfer.from_user_id;

  INSERT INTO applications (request_id, applicant_id, status, reviewed_at)
  VALUES (v_transfer.request_id, v_transfer.from_user_id, 'aceptada', NOW())
  ON CONFLICT (request_id, applicant_id)
  DO UPDATE SET status = 'aceptada', reviewed_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION accept_admin_transfer(UUID, UUID) TO authenticated;

-- --------------------------------------------------------------------------
-- 3.2b accept_admin_transfer_backend(p_transfer_id, p_actor_user_id)
--      Variante para uso interno del backend (sin verificar auth.uid())
--      La autorizacion viaja por el actorUserId provisto por el caso de uso
--      El backend opera con pool de conexiones sin sesion de usuario activa
--      (auth.uid() = NULL), por lo que NO se verifica auth.uid() aqui.
--      La autorizacion se valida contra el to_user_id de la transferencia.
-- --------------------------------------------------------------------------
DROP FUNCTION IF EXISTS accept_admin_transfer_backend(UUID, UUID);
CREATE FUNCTION accept_admin_transfer_backend(
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
  v_author_id UUID;
BEGIN
  -- 1. Validar que el actor es el destinatario de la transferencia
  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'actorUserId es requerido.' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Obtener datos de la transferencia
  SELECT t.*
  INTO v_transfer
  FROM study_request_admin_transfers t
  WHERE t.id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RAISE EXCEPTION 'Transferencia no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.status <> 'pendiente' THEN
    RAISE EXCEPTION 'La transferencia ya fue resuelta.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.to_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'No autorizado para aceptar esta transferencia.' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Marcar transferencia como aceptada
  UPDATE study_request_admin_transfers t
  SET status = 'aceptada',
      responded_at = NOW()
  WHERE t.id = p_transfer_id;

  -- 4. Anadir al nuevo administrador
  INSERT INTO study_request_admins (request_id, user_id, granted_by)
  VALUES (v_transfer.request_id, v_transfer.to_user_id, v_transfer.from_user_id)
  ON CONFLICT (request_id, user_id) DO NOTHING;

  -- 5. Transferir la propiedad del grupo (author_id)
  SELECT author_id INTO v_author_id
  FROM study_requests
  WHERE id = v_transfer.request_id;

  IF v_author_id = v_transfer.from_user_id THEN
    UPDATE study_requests
    SET author_id = v_transfer.to_user_id
    WHERE id = v_transfer.request_id;
  END IF;

  -- 6. Eliminar al admin anterior de admins y miembros
  DELETE FROM study_request_admins
  WHERE request_id = v_transfer.request_id
    AND user_id = v_transfer.from_user_id;

  DELETE FROM applications
  WHERE request_id = v_transfer.request_id
    AND applicant_id = v_transfer.from_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_admin_transfer_backend(UUID, UUID) TO authenticated;

-- --------------------------------------------------------------------------
-- 3.3 reject_admin_transfer(p_transfer_id, p_actor_user_id)
--      Rechaza una transferencia pendiente
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_admin_transfer(
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

  SELECT t.*
  INTO v_transfer
  FROM study_request_admin_transfers t
  WHERE t.id = p_transfer_id;

  IF v_transfer.id IS NULL THEN
    RAISE EXCEPTION 'Transferencia no encontrada.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.status <> 'pendiente' THEN
    RAISE EXCEPTION 'La transferencia ya fue resuelta.' USING ERRCODE = 'P0001';
  END IF;

  IF v_transfer.to_user_id <> p_actor_user_id THEN
    RAISE EXCEPTION 'No autorizado para rechazar esta transferencia.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE study_request_admin_transfers
  SET status = 'rechazada',
      responded_at = NOW()
  WHERE id = p_transfer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION reject_admin_transfer(UUID, UUID) TO authenticated;

-- --------------------------------------------------------------------------
-- 3.4 leave_request_admin(p_request_id, p_actor_user_id)
--      Salida de un administrador (no autor: solo admins adicionales)
-- --------------------------------------------------------------------------
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
    RAISE EXCEPTION 'No eres administrador de este grupo.' USING ERRCODE = 'P0001';
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

-- ============================================================================
-- 4. Notificacion por trigger (evento BD → notificacion persistente)
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_admin_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_body  TEXT;
  v_type  TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pendiente' THEN
    v_type  := 'transferencia_admin_solicitada';
    v_title := (SELECT title FROM study_requests WHERE id = NEW.request_id);
    v_body  := 'Tienes una solicitud para transferir la administracion del grupo.';

    INSERT INTO user_notifications (user_id, type, title, body, payload)
    VALUES (
      NEW.to_user_id,
      v_type,
      v_title,
      v_body,
      jsonb_build_object(
        'transferId', NEW.id,
        'groupId',   NEW.request_id,
        'oldAdminId', NEW.from_user_id
      )
    );
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'aceptada' AND OLD.status = 'pendiente' THEN
      INSERT INTO user_notifications (user_id, type, title, body, payload)
      VALUES (
        NEW.from_user_id,
        'transferencia_admin_aceptada',
        'Transferencia aceptada',
        'Tu transferencia de administracion fue aceptada.',
        jsonb_build_object(
          'transferId', NEW.id,
          'groupId',    NEW.request_id,
          'newAdminId', NEW.to_user_id
        )
      );
    END IF;

    IF NEW.status = 'rechazada' AND OLD.status = 'pendiente' THEN
      INSERT INTO user_notifications (user_id, type, title, body, payload)
      VALUES (
        NEW.from_user_id,
        'transferencia_admin_rechazada',
        'Transferencia rechazada',
        'La transferencia de administracion fue rechazada.',
        jsonb_build_object(
          'transferId', NEW.id,
          'groupId',    NEW.request_id,
          'newAdminId', NEW.to_user_id
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_transfer_notify ON study_request_admin_transfers;
CREATE TRIGGER trg_admin_transfer_notify
  AFTER INSERT OR UPDATE ON study_request_admin_transfers
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_transfer();

-- ============================================================================
-- 5. Funcion de consulta para hidratacion del estado (usada por el backend)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_admin_transfer_status(p_request_id UUID)
RETURNS TABLE (
  has_pending_transfer   BOOLEAN,
  pending_transfer_id    UUID,
  pending_transfer_to_id UUID
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    (t.id IS NOT NULL)          AS has_pending_transfer,
    t.id                        AS pending_transfer_id,
    t.to_user_id                AS pending_transfer_to_id
  FROM study_requests sr
  LEFT JOIN study_request_admin_transfers t
         ON t.request_id = sr.id AND t.status = 'pendiente'
  WHERE sr.id = p_request_id;
$$;

GRANT EXECUTE ON FUNCTION get_admin_transfer_status(UUID) TO authenticated;
