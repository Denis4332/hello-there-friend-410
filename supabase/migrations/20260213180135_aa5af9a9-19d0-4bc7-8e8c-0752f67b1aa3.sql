CREATE OR REPLACE FUNCTION delete_storage_object()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to delete from storage, but don't block if it fails
  -- (e.g. when called from edge functions that already handle storage cleanup)
  BEGIN
    DELETE FROM storage.objects 
    WHERE bucket_id = 'profile-photos' 
    AND name = OLD.storage_path;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Could not delete storage object %: %', OLD.storage_path, SQLERRM;
  END;
  RETURN OLD;
END;
$$;