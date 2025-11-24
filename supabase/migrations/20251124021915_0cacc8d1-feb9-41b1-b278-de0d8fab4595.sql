-- Fix delete_profile_photos trigger - Tabelle heißt jetzt "photos", nicht "profile_photos"
CREATE OR REPLACE FUNCTION delete_profile_photos()
RETURNS TRIGGER AS $$
BEGIN
  -- Lösche alle Fotos aus dem Storage
  DELETE FROM storage.objects
  WHERE bucket_id = 'profile-photos'
  AND name IN (
    SELECT storage_path 
    FROM photos 
    WHERE profile_id = OLD.id
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;