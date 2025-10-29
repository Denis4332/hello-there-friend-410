-- Add street_address field to profiles table
ALTER TABLE profiles ADD COLUMN street_address TEXT;

COMMENT ON COLUMN profiles.street_address IS 'Optional street address for profile location';