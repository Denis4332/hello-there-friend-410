-- Drop old function
DROP FUNCTION IF EXISTS search_profiles_by_radius;

-- Create new search_profiles_by_radius function with correct fields
CREATE OR REPLACE FUNCTION search_profiles_by_radius(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_km INTEGER,
  filter_category_id UUID DEFAULT NULL,
  filter_keyword TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
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
  is_adult BOOLEAN,
  verified_at TIMESTAMPTZ,
  status TEXT,
  listing_type TEXT,
  premium_until TIMESTAMPTZ,
  top_ad_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_km NUMERIC,
  street_address TEXT,
  show_street BOOLEAN,
  availability_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.slug,
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
    p.is_adult,
    p.verified_at,
    p.status,
    p.listing_type,
    p.premium_until,
    p.top_ad_until,
    p.created_at,
    p.updated_at,
    ROUND(CAST(
      ST_Distance(
        ST_MakePoint(user_lng, user_lat)::geography,
        ST_MakePoint(p.lng, p.lat)::geography
      ) / 1000 AS NUMERIC), 1
    ) AS distance_km,
    pc.street_address,
    pc.show_street,
    p.availability_status
  FROM profiles p
  LEFT JOIN profile_contacts pc ON pc.profile_id = p.id
  WHERE p.status = 'active'
    AND p.lat IS NOT NULL
    AND p.lng IS NOT NULL
    AND ST_DWithin(
      ST_MakePoint(user_lng, user_lat)::geography,
      ST_MakePoint(p.lng, p.lat)::geography,
      radius_km * 1000
    )
    AND (filter_category_id IS NULL OR EXISTS (
      SELECT 1 FROM profile_categories pcat
      WHERE pcat.profile_id = p.id AND pcat.category_id = filter_category_id
    ))
    AND (filter_keyword IS NULL OR 
      p.display_name ILIKE '%' || filter_keyword || '%' OR
      p.about_me ILIKE '%' || filter_keyword || '%'
    )
  ORDER BY distance_km ASC;
$$;