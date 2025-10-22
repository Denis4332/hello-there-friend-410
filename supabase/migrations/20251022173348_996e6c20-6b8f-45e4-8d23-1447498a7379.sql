-- Fix security issue: Add search_path to function
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
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;