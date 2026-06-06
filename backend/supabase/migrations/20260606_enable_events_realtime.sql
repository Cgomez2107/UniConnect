-- Add events table to supabase_realtime publication so postgres_changes
-- subscriptions (useNewEventObserver) can detect new event inserts.
ALTER PUBLICATION supabase_realtime ADD TABLE events;
