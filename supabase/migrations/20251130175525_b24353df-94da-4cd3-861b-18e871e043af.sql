
-- Fix: Add SET search_path = public to 3 functions (security best practice)
-- No functionality changes - only adds explicit search path

-- 1. delete_profile_photos - Trigger für Photo-Löschung
CREATE OR REPLACE FUNCTION public.delete_profile_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- 2. delete_storage_object - Storage Helper für einzelne Fotos
CREATE OR REPLACE FUNCTION public.delete_storage_object()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'profile-photos' 
  AND name = OLD.storage_path;
  RETURN OLD;
END;
$$;

-- 3. generate_profile_slug - URL-Slug Generator
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;
