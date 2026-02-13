
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
BEGIN
  -- Only regenerate slug if name or city actually changed (or on INSERT)
  IF TG_OP = 'INSERT' OR OLD.display_name IS DISTINCT FROM NEW.display_name OR OLD.city IS DISTINCT FROM NEW.city THEN
    base_slug := lower(
      regexp_replace(
        unaccent(NEW.display_name || '-' || COALESCE(NEW.city, 'schweiz')),
        '[^a-z0-9]+', '-', 'g'
      )
    );
    base_slug := trim(both '-' from base_slug);

    IF TG_OP = 'INSERT' THEN
      -- New profile: random suffix
      final_slug := base_slug || '-' || substr(md5(random()::text), 1, 8);
    ELSE
      -- Update: deterministic suffix from profile ID (stable across edits!)
      final_slug := base_slug || '-' || substr(md5(NEW.id::text), 1, 8);
    END IF;

    NEW.slug := final_slug;
  END IF;

  RETURN NEW;
END;
$$;
