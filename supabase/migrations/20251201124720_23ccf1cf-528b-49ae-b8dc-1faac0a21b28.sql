-- Fix NULL-Problem in generate_profile_slug (age entfernen, COALESCE für city)
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  -- Generate base slug WITHOUT age (age is deprecated/NULL)
  base_slug := lower(
    regexp_replace(
      unaccent(NEW.display_name || '-' || COALESCE(NEW.city, 'schweiz')),
      '[^a-z0-9äöüß]+', '-', 'g'
    )
  );
  
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Add random suffix for uniqueness
  final_slug := base_slug || '-' || substr(md5(random()::text), 1, 8);
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Generate slugs for all profiles that have NULL slug
UPDATE profiles 
SET slug = lower(
  trim(both '-' from regexp_replace(
    unaccent(display_name || '-' || COALESCE(city, 'schweiz')),
    '[^a-z0-9äöüß]+', '-', 'g'
  ))
) || '-' || substr(md5(id::text), 1, 8)
WHERE slug IS NULL;