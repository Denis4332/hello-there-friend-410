-- Enable unaccent extension for slug generation
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create cities table
CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  canton_id UUID NOT NULL REFERENCES public.cantons(id) ON DELETE CASCADE,
  postal_code TEXT,
  lat NUMERIC(10, 7),
  lng NUMERIC(10, 7),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view cities"
  ON public.cities
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cities"
  ON public.cities
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for slug generation
CREATE OR REPLACE FUNCTION public.generate_city_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Generate base slug from city name
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        unaccent(NEW.name),
        '[^a-z0-9äöüß]+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
  
  -- Trim leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM cities WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cities_slug_trigger
  BEFORE INSERT OR UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_city_slug();

-- Trigger for updated_at
CREATE TRIGGER cities_updated_at_trigger
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert top Swiss cities
-- First, get canton IDs
DO $$
DECLARE
  canton_zh UUID;
  canton_be UUID;
  canton_bs UUID;
  canton_ge UUID;
  canton_lu UUID;
  canton_sg UUID;
  canton_ag UUID;
  canton_vd UUID;
  canton_ti UUID;
  canton_vs UUID;
BEGIN
  SELECT id INTO canton_zh FROM cantons WHERE abbreviation = 'ZH';
  SELECT id INTO canton_be FROM cantons WHERE abbreviation = 'BE';
  SELECT id INTO canton_bs FROM cantons WHERE abbreviation = 'BS';
  SELECT id INTO canton_ge FROM cantons WHERE abbreviation = 'GE';
  SELECT id INTO canton_lu FROM cantons WHERE abbreviation = 'LU';
  SELECT id INTO canton_sg FROM cantons WHERE abbreviation = 'SG';
  SELECT id INTO canton_ag FROM cantons WHERE abbreviation = 'AG';
  SELECT id INTO canton_vd FROM cantons WHERE abbreviation = 'VD';
  SELECT id INTO canton_ti FROM cantons WHERE abbreviation = 'TI';
  SELECT id INTO canton_vs FROM cantons WHERE abbreviation = 'VS';

  -- Insert cities
  INSERT INTO public.cities (name, canton_id, postal_code, lat, lng) VALUES
    ('Zürich', canton_zh, '8000', 47.3769, 8.5417),
    ('Winterthur', canton_zh, '8400', 47.5000, 8.7500),
    ('Uster', canton_zh, '8610', 47.3500, 8.7167),
    ('Bern', canton_be, '3000', 46.9481, 7.4474),
    ('Thun', canton_be, '3600', 46.7578, 7.6281),
    ('Biel/Bienne', canton_be, '2500', 47.1372, 7.2461),
    ('Basel', canton_bs, '4000', 47.5596, 7.5886),
    ('Genève', canton_ge, '1200', 46.2044, 6.1432),
    ('Luzern', canton_lu, '6000', 47.0502, 8.3093),
    ('St. Gallen', canton_sg, '9000', 47.4245, 9.3767),
    ('Baden', canton_ag, '5400', 47.4729, 8.3059),
    ('Aarau', canton_ag, '5000', 47.3919, 8.0458),
    ('Lausanne', canton_vd, '1000', 46.5197, 6.6323),
    ('Lugano', canton_ti, '6900', 46.0037, 8.9511),
    ('Sion', canton_vs, '1950', 46.2311, 7.3601);
END $$;