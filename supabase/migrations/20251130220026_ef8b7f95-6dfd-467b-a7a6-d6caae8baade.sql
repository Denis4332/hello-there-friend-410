-- Add media_type column to photos table for video support
ALTER TABLE photos ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

-- Add check constraint for valid media types
ALTER TABLE photos ADD CONSTRAINT photos_media_type_check 
  CHECK (media_type IN ('image', 'video'));