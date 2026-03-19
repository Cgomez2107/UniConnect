-- US-016 extensión: soporte de imágenes en chat privado

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS media_filename TEXT,
  ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_preview TEXT;

ALTER TABLE messages
  ALTER COLUMN content DROP NOT NULL;

ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_content_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_content_or_media_check CHECK (
    (
      content IS NOT NULL
      AND char_length(btrim(content)) > 0
      AND char_length(content) <= 5000
    )
    OR media_url IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS idx_messages_media_url
  ON messages(media_url)
  WHERE media_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_reply_to_message_id
  ON messages(reply_to_message_id)
  WHERE reply_to_message_id IS NOT NULL;
