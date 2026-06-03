-- ============================================================================
-- Drop DB triggers that duplicate notifications created by the application layer
-- The Observer/Strategy pattern (NotificationMapper + InAppWebSocketStrategy) now
-- handles all notification creation WITH priority/action decorators. These triggers
-- created bare notifications WITHOUT priority, causing duplicates.
-- ============================================================================

-- 1. Drop the new trigger (20260514 migration)
DROP TRIGGER IF EXISTS trg_admin_transfer_notify ON study_request_admin_transfers;
DROP FUNCTION IF EXISTS notify_admin_transfer();

-- 2. Drop the old trigger (20260428 migration)
DROP TRIGGER IF EXISTS study_request_admin_transfers_notify_insert ON study_request_admin_transfers;
DROP FUNCTION IF EXISTS study_request_admin_transfers_notify();

-- 3. Also drop the standalone function used by the old trigger
DROP FUNCTION IF EXISTS notify_admin_transfer(UUID);