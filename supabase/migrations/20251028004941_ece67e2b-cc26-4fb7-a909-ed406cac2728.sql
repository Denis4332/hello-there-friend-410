-- Enable PostGIS extension for geospatial calculations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create function to search profiles by radius
CREATE OR REPLACE FUNCTION search_profiles_by_radius(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_km INTEGER,
  filter_category_id UUID DEFAULT NULL,
  filter_keyword TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  age INTEGER,
  gender TEXT,
  city TEXT,
  canton TEXT,
  postal_code TEXT,
  lat NUMERIC,
  lng NUMERIC,
  about_me TEXT,
  languages TEXT[],
  is_premium BOOLEAN,
  verified_at TIMESTAMPTZ,
  status TEXT,
  slug TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  telegram TEXT,
  instagram TEXT,
  distance_km NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.age,
    p.gender,
    p.city,
    p.canton,
    p.postal_code,
    p.lat,
    p.lng,
    p.about_me,
    p.languages,
    p.is_premium,
    p.verified_at,
    p.status,
    p.slug,
    p.created_at,
    p.updated_at,
    p.phone,
    p.whatsapp,
    p.email,
    p.website,
    p.telegram,
    p.instagram,
    ROUND(CAST(
      ST_Distance(
        ST_MakePoint(user_lng, user_lat)::geography,
        ST_MakePoint(p.lng, p.lat)::geography
      ) / 1000 AS NUMERIC), 1
    ) AS distance_km
  FROM profiles p
  WHERE p.status = 'active'
    AND p.lat IS NOT NULL
    AND p.lng IS NOT NULL
    AND ST_DWithin(
      ST_MakePoint(user_lng, user_lat)::geography,
      ST_MakePoint(p.lng, p.lat)::geography,
      radius_km * 1000
    )
    AND (filter_category_id IS NULL OR EXISTS (
      SELECT 1 FROM profile_categories pc
      WHERE pc.profile_id = p.id AND pc.category_id = filter_category_id
    ))
    AND (filter_keyword IS NULL OR 
      p.display_name ILIKE '%' || filter_keyword || '%' OR
      p.about_me ILIKE '%' || filter_keyword || '%'
    )
  ORDER BY distance_km ASC, p.is_premium DESC, p.verified_at DESC NULLS LAST;
$$;