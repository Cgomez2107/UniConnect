-- US-011/US-016: bucket dedicado para audios de chat
-- Evita errores de MIME al subir notas de voz desde el cliente movil.

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'chat-audio',
  'chat-audio',
  true,
  20971520,
  ARRAY[
    'audio/x-m4a',
    'audio/m4a',
    'audio/mp4',
    'audio/aac',
    'audio/mpeg',
    'audio/wav',
    'audio/webm'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'chat_audio_select_authenticated'
  ) THEN
    CREATE POLICY chat_audio_select_authenticated
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'chat-audio');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'chat_audio_insert_own_folder'
  ) THEN
    CREATE POLICY chat_audio_insert_own_folder
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'chat-audio'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'chat_audio_update_own_folder'
  ) THEN
    CREATE POLICY chat_audio_update_own_folder
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'chat-audio'
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'chat-audio'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'chat_audio_delete_own_folder'
  ) THEN
    CREATE POLICY chat_audio_delete_own_folder
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'chat-audio'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END
$$;
