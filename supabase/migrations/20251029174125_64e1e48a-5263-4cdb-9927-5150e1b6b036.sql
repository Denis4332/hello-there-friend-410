-- Fix 1: Update generate_profile_slug() function to include age in slug
CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  slug_exists BOOLEAN;
  counter INTEGER := 0;
BEGIN
  -- Generate base slug from display_name + age + city
  base_slug := lower(
    regexp_replace(
      unaccent(NEW.display_name || '-' || NEW.age || '-' || NEW.city),
      '[^a-z0-9äöüß]+', '-', 'g'
    )
  );
  
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Add random suffix for uniqueness (8 characters)
  final_slug := base_slug || '-' || substr(md5(random()::text), 1, 8);
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to also fire on age changes
DROP TRIGGER IF EXISTS set_profile_slug_update ON profiles;
CREATE TRIGGER set_profile_slug_update
BEFORE UPDATE ON profiles
FOR EACH ROW
WHEN (OLD.display_name IS DISTINCT FROM NEW.display_name 
   OR OLD.city IS DISTINCT FROM NEW.city 
   OR OLD.age IS DISTINCT FROM NEW.age)
EXECUTE FUNCTION generate_profile_slug();

-- Update existing profiles with new slug format that includes age
UPDATE profiles 
SET slug = lower(
  trim(both '-' from regexp_replace(
    unaccent(display_name || '-' || age || '-' || city),
    '[^a-z0-9äöüß]+', '-', 'g'
  ))
) || '-' || substr(md5(random()::text), 1, 8)
WHERE slug IS NOT NULL;