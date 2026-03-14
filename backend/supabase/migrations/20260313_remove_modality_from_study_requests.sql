-- ============================================================================
-- Remove modality from study requests (frontend + backend alignment)
-- Fecha: 2026-03-13
-- ============================================================================

ALTER TABLE study_requests
  DROP COLUMN IF EXISTS modality CASCADE;
