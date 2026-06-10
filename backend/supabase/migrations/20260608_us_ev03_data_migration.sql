-- US EV03: Data Migration
-- Set existing future events to 'published' if they are still in draft
-- This ensures pre-migration events get a valid lifecycle status
UPDATE events
SET status = 'published'
WHERE status = 'draft' AND event_date >= NOW();
