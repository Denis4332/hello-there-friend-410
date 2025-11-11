-- Function to delete profile photos from storage when profile is deleted
CREATE OR REPLACE FUNCTION delete_profile_photos()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  photo_record RECORD;
  photo_path TEXT;
BEGIN
  -- Loop through all photos for the deleted profile
  FOR photo_record IN 
    SELECT photo_url 
    FROM profile_photos 
    WHERE profile_id = OLD.id
  LOOP
    -- Extract the file path from the URL
    -- Format: https://project.supabase.co/storage/v1/object/public/profile-photos/path/to/file.jpg
    photo_path := substring(photo_record.photo_url from 'profile-photos/(.*)$');
    
    IF photo_path IS NOT NULL THEN
      -- Delete from storage
      PERFORM storage.delete_object('profile-photos', photo_path);
    END IF;
  END LOOP;
  
  -- Delete photo records from database (CASCADE should handle this, but explicit is better)
  DELETE FROM profile_photos WHERE profile_id = OLD.id;
  
  RETURN OLD;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_delete_profile_photos ON profiles;
CREATE TRIGGER trigger_delete_profile_photos
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_profile_photos();

-- Function to find and clean orphaned photos (photos in storage but not in DB)
CREATE OR REPLACE FUNCTION cleanup_orphaned_photos()
RETURNS TABLE(deleted_count INT, error_message TEXT)
SECURITY DEFINER
SET search_path = public, storage
LANGUAGE plpgsql
AS $$
DECLARE
  storage_file RECORD;
  photo_exists BOOLEAN;
  deleted INT := 0;
  file_path TEXT;
BEGIN
  -- Loop through all files in profile-photos bucket
  FOR storage_file IN 
    SELECT name 
    FROM storage.objects 
    WHERE bucket_id = 'profile-photos'
  LOOP
    -- Check if photo URL exists in profile_photos table
    SELECT EXISTS(
      SELECT 1 
      FROM profile_photos 
      WHERE photo_url LIKE '%' || storage_file.name || '%'
    ) INTO photo_exists;
    
    -- If photo doesn't exist in DB, delete from storage
    IF NOT photo_exists THEN
      BEGIN
        PERFORM storage.delete_object('profile-photos', storage_file.name);
        deleted := deleted + 1;
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue
        RAISE WARNING 'Failed to delete orphaned file %: %', storage_file.name, SQLERRM;
      END;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT deleted, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 0, SQLERRM;
END;
$$;