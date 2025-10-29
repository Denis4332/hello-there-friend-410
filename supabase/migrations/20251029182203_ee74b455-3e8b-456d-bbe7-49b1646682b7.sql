-- Fix C: Backend validation to prevent profile activation without photos

-- Create validation function
CREATE OR REPLACE FUNCTION validate_profile_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check when profile is being activated
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    -- Check if at least one photo exists
    IF NOT EXISTS (
      SELECT 1 FROM photos WHERE profile_id = NEW.id LIMIT 1
    ) THEN
      RAISE EXCEPTION 'Profile cannot be activated without at least one photo';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before profile status update
DROP TRIGGER IF EXISTS check_photos_before_activation ON profiles;
CREATE TRIGGER check_photos_before_activation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_activation();