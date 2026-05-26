-- Add resource_type, og_title, og_image, og_description columns to study_resources
-- This enables type-based filtering (AC4) and OpenGraph previews (AC1/AC5/AC6)

ALTER TABLE study_resources
  ADD COLUMN IF NOT EXISTS resource_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT;

-- Update existing rows: map file_type extensions to semantic resource types
UPDATE study_resources
SET resource_type = 
  CASE
    WHEN file_type IS NULL THEN NULL
    WHEN LOWER(file_type) IN ('pdf') THEN 'pdf'
    WHEN LOWER(file_type) IN ('doc','docx','txt','md','rtf','csv','json','xml','log') THEN 'document'
    WHEN LOWER(file_type) IN ('ppt','pptx','key','odp') THEN 'presentation'
    WHEN LOWER(file_type) IN ('xls','xlsx','ods','numbers') THEN 'spreadsheet'
    WHEN LOWER(file_type) IN ('jpg','jpeg','png','gif','webp','svg','bmp','ico','tiff') THEN 'image'
    WHEN LOWER(file_type) IN ('mp4','mov','avi','mkv','webm','wmv','flv') THEN 'video'
    WHEN LOWER(file_type) IN ('mp3','wav','ogg','flac','aac','wma') THEN 'audio'
    WHEN LOWER(file_type) IN ('zip','rar','7z','tar','gz','bz2') THEN 'archive'
    WHEN LOWER(file_type) = 'link' THEN 'link'
    ELSE 'file'
  END
WHERE resource_type IS NULL OR resource_type = '' OR resource_type = 'file';

-- Index for type-based filtering
CREATE INDEX IF NOT EXISTS idx_study_resources_resource_type
  ON study_resources (resource_type);

CREATE INDEX IF NOT EXISTS idx_study_resources_resource_type_subject
  ON study_resources (resource_type, subject_id);
