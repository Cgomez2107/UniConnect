-- Add events table to supabase_realtime publication so postgres_changes
-- subscriptions (useNewEventObserver) can detect new event inserts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  END IF;
END $$;
