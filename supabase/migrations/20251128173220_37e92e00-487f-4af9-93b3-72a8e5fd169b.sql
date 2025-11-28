-- STEP 1: Normalize all existing profiles to use canton abbreviations
UPDATE profiles p
SET canton = c.abbreviation
FROM cantons c
WHERE p.canton = c.name
  AND p.canton != c.abbreviation;

-- STEP 2: Create trigger function to auto-normalize canton values
CREATE OR REPLACE FUNCTION public.normalize_canton_to_abbreviation()
RETURNS TRIGGER AS $$
BEGIN
  -- If canton is a full name (longer than 3 chars), convert to abbreviation
  IF LENGTH(NEW.canton) > 3 THEN
    SELECT abbreviation INTO NEW.canton
    FROM cantons
    WHERE name = NEW.canton;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- STEP 3: Create trigger on profiles table
DROP TRIGGER IF EXISTS profile_normalize_canton ON profiles;

CREATE TRIGGER profile_normalize_canton
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.normalize_canton_to_abbreviation();