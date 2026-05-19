-- Ampliar file_type de VARCHAR(50) a TEXT para soportar MIME types completos
ALTER TABLE study_resources ALTER COLUMN file_type TYPE TEXT;

COMMENT ON COLUMN study_resources.file_type IS 'Tipo MIME o extensión del archivo';
