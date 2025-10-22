-- Add slug column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create function to generate URL-safe slugs
CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Generate base slug from display_name and city
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        unaccent(NEW.display_name || '-' || NEW.city),
        '[^a-z0-9äöüß]+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
  
  -- Trim leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Add short ID from UUID (first 8 chars)
  final_slug := base_slug || '-' || substring(NEW.id::text, 1, 8);
  
  -- Ensure uniqueness (should be unique due to UUID, but just in case)
  WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || substring(NEW.id::text, 1, 8) || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slugs on INSERT
DROP TRIGGER IF EXISTS set_profile_slug_insert ON profiles;
CREATE TRIGGER set_profile_slug_insert
BEFORE INSERT ON profiles
FOR EACH ROW
WHEN (NEW.slug IS NULL)
EXECUTE FUNCTION generate_profile_slug();

-- Create trigger to auto-generate slugs on UPDATE
DROP TRIGGER IF EXISTS set_profile_slug_update ON profiles;
CREATE TRIGGER set_profile_slug_update
BEFORE UPDATE OF display_name, city ON profiles
FOR EACH ROW
WHEN (OLD.display_name IS DISTINCT FROM NEW.display_name OR OLD.city IS DISTINCT FROM NEW.city)
EXECUTE FUNCTION generate_profile_slug();

-- Generate slugs for existing profiles without slugs
UPDATE profiles 
SET display_name = display_name
WHERE slug IS NULL;