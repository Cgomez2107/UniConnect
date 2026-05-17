-- Add reactions column to messages table for 1:1 chat
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '[]'::jsonb;
