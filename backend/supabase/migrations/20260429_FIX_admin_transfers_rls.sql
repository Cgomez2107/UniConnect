-- ============================================================================
-- FIX: Políticas de RLS para transferencias de administración
-- Fecha: 2026-04-29
-- ============================================================================

-- 1) Permitir lectura a los involucrados (remitente y destinatario)
DROP POLICY IF EXISTS "Users can view their own transfers" ON study_request_admin_transfers;
CREATE POLICY "Users can view their own transfers"
ON study_request_admin_transfers
FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- 2) Permitir que el destinatario actualice el estado (rechazar)
-- Nota: La aceptación se hace vía RPC (accept_admin_transfer) que es SECURITY DEFINER
DROP POLICY IF EXISTS "Recipients can update their transfers" ON study_request_admin_transfers;
CREATE POLICY "Recipients can update their transfers"
ON study_request_admin_transfers
FOR UPDATE
TO authenticated
USING (auth.uid() = to_user_id);

-- 3) Permitir que el sistema o el admin vea todas las transferencias de su grupo (opcional pero recomendado)
DROP POLICY IF EXISTS "Admins can view transfers of their group" ON study_request_admin_transfers;
CREATE POLICY "Admins can view transfers of their group"
ON study_request_admin_transfers
FOR SELECT
TO authenticated
USING (is_request_admin(request_id, auth.uid()));
