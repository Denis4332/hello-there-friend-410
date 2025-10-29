-- Fix search_path for validate_profile_activation function
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
$$ LANGUAGE plpgsql SET search_path = public;