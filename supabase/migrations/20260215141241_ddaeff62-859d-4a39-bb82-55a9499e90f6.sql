
-- A) Recreate public_profiles view with expiry check
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker = on) AS
SELECT
  id, slug, display_name, age, gender, city, canton, postal_code,
  lat, lng, about_me, languages, is_adult, verified_at,
  status, listing_type, premium_until, top_ad_until,
  created_at, updated_at
FROM profiles
WHERE status = 'active'
  AND (
    (listing_type = 'top' AND top_ad_until >= now())
    OR (listing_type <> 'top' AND premium_until >= now())
  );

-- B) Replace get_paginated_profiles with expiry filter
CREATE OR REPLACE FUNCTION public.get_paginated_profiles(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_city text DEFAULT NULL,
  p_canton text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_rotation_seed integer DEFAULT 0
)
RETURNS TABLE(profiles json, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset integer;
  v_total bigint;
  v_profiles json;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT count(*) INTO v_total
  FROM profiles p
  WHERE p.status = 'active'
    AND (
      (p.listing_type = 'top' AND p.top_ad_until >= now())
      OR (p.listing_type <> 'top' AND p.premium_until >= now())
    )
    AND (p_city IS NULL OR lower(p.city) = lower(p_city))
    AND (p_canton IS NULL OR lower(p.canton) = lower(p_canton))
    AND (p_category_id IS NULL OR EXISTS (
      SELECT 1 FROM profile_categories pc WHERE pc.profile_id = p.id AND pc.category_id = p_category_id
    ))
    AND (p_keyword IS NULL OR (
      p.display_name ILIKE '%' || p_keyword || '%'
      OR p.about_me ILIKE '%' || p_keyword || '%'
      OR p.city ILIKE '%' || p_keyword || '%'
    ));

  SELECT json_agg(row_to_json(t)) INTO v_profiles
  FROM (
    SELECT
      p.id, p.display_name, p.age, p.gender, p.city, p.canton,
      p.postal_code, p.about_me, p.languages, p.status, p.slug,
      p.listing_type, p.verified_at, p.premium_until, p.top_ad_until,
      p.lat, p.lng, p.is_adult, p.created_at, p.updated_at,
      p.availability_status, p.last_seen_at,
      pc_agg.profile_categories,
      ph_agg.photos,
      cont.street_address,
      cont.show_street,
      CASE p.listing_type
        WHEN 'top' THEN 1
        WHEN 'premium' THEN 2
        ELSE 3
      END AS tier_order
    FROM profiles p
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object(
        'category_id', pc.category_id,
        'categories', json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
      )) AS profile_categories
      FROM profile_categories pc
      JOIN categories c ON c.id = pc.category_id
      WHERE pc.profile_id = p.id
    ) pc_agg ON true
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object(
        'id', ph.id,
        'storage_path', ph.storage_path,
        'is_primary', ph.is_primary,
        'sort_order', ph.sort_order,
        'media_type', ph.media_type
      ) ORDER BY ph.is_primary DESC, ph.sort_order ASC, ph.created_at ASC) AS photos
      FROM photos ph
      WHERE ph.profile_id = p.id
    ) ph_agg ON true
    LEFT JOIN profile_contacts cont ON cont.profile_id = p.id
    WHERE p.status = 'active'
      AND (
        (p.listing_type = 'top' AND p.top_ad_until >= now())
        OR (p.listing_type <> 'top' AND p.premium_until >= now())
      )
      AND (p_city IS NULL OR lower(p.city) = lower(p_city))
      AND (p_canton IS NULL OR lower(p.canton) = lower(p_canton))
      AND (p_category_id IS NULL OR EXISTS (
        SELECT 1 FROM profile_categories pc WHERE pc.profile_id = p.id AND pc.category_id = p_category_id
      ))
      AND (p_keyword IS NULL OR (
        p.display_name ILIKE '%' || p_keyword || '%'
        OR p.about_me ILIKE '%' || p_keyword || '%'
        OR p.city ILIKE '%' || p_keyword || '%'
      ))
    ORDER BY
      tier_order ASC,
      md5(p.id::text || p_rotation_seed::text) ASC
    LIMIT p_page_size
    OFFSET v_offset
  ) t;

  RETURN QUERY SELECT COALESCE(v_profiles, '[]'::json), v_total;
END;
$$;

-- C) Replace search_profiles_by_radius_v2 with expiry filter
CREATE OR REPLACE FUNCTION public.search_profiles_by_radius_v2(
  user_lat numeric,
  user_lng numeric,
  radius_km numeric,
  filter_category_id uuid DEFAULT NULL,
  filter_keyword text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_rotation_seed integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, display_name text, age integer, gender text,
  city text, canton text, postal_code text, about_me text,
  languages text[], status text, slug text, listing_type text,
  verified_at timestamptz, premium_until timestamptz, top_ad_until timestamptz,
  lat numeric, lng numeric, is_adult boolean,
  created_at timestamptz, updated_at timestamptz,
  availability_status text,
  street_address text, show_street boolean,
  distance_km double precision,
  photos json, profile_categories json,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset integer;
  v_total bigint;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  CREATE TEMP TABLE IF NOT EXISTS _filtered ON COMMIT DROP AS
  SELECT
    p.id, p.display_name, p.age, p.gender,
    p.city, p.canton, p.postal_code, p.about_me,
    p.languages, p.status, p.slug, p.listing_type,
    p.verified_at, p.premium_until, p.top_ad_until,
    p.lat, p.lng, p.is_adult, p.created_at, p.updated_at,
    p.availability_status,
    cont.street_address,
    cont.show_street,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat))
        * cos(radians(p.lng) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) AS distance_km,
    CASE p.listing_type
      WHEN 'top' THEN 1
      WHEN 'premium' THEN 2
      ELSE 3
    END AS tier_order
  FROM profiles p
  LEFT JOIN profile_contacts cont ON cont.profile_id = p.id
  WHERE p.status = 'active'
    AND (
      (p.listing_type = 'top' AND p.top_ad_until >= now())
      OR (p.listing_type <> 'top' AND p.premium_until >= now())
    )
    AND p.lat IS NOT NULL AND p.lng IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat))
        * cos(radians(p.lng) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) <= radius_km
    AND (filter_category_id IS NULL OR EXISTS (
      SELECT 1 FROM profile_categories pc WHERE pc.profile_id = p.id AND pc.category_id = filter_category_id
    ))
    AND (filter_keyword IS NULL OR (
      p.display_name ILIKE '%' || filter_keyword || '%'
      OR p.about_me ILIKE '%' || filter_keyword || '%'
      OR p.city ILIKE '%' || filter_keyword || '%'
    ));

  SELECT count(*) INTO v_total FROM _filtered;

  RETURN QUERY
  SELECT
    f.id, f.display_name, f.age, f.gender,
    f.city, f.canton, f.postal_code, f.about_me,
    f.languages, f.status, f.slug, f.listing_type,
    f.verified_at, f.premium_until, f.top_ad_until,
    f.lat, f.lng, f.is_adult, f.created_at, f.updated_at,
    f.availability_status,
    f.street_address, f.show_street,
    f.distance_km,
    (SELECT json_agg(json_build_object(
      'id', ph.id,
      'storage_path', ph.storage_path,
      'is_primary', ph.is_primary,
      'sort_order', ph.sort_order,
      'media_type', ph.media_type
    ) ORDER BY ph.is_primary DESC, ph.sort_order ASC, ph.created_at ASC)
    FROM photos ph WHERE ph.profile_id = f.id
    ) AS photos,
    (SELECT json_agg(json_build_object(
      'category_id', pc.category_id,
      'categories', json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
    ))
    FROM profile_categories pc
    JOIN categories c ON c.id = pc.category_id
    WHERE pc.profile_id = f.id
    ) AS profile_categories,
    v_total
  FROM _filtered f
  ORDER BY f.tier_order ASC, md5(f.id::text || p_rotation_seed::text) ASC
  LIMIT p_page_size OFFSET v_offset;

  DROP TABLE IF EXISTS _filtered;
END;
$$;

-- D1) Replace search_profiles_by_radius (without pagination) with expiry filter
CREATE OR REPLACE FUNCTION public.search_profiles_by_radius(
  user_lat numeric,
  user_lng numeric,
  radius_km numeric,
  filter_category_id uuid DEFAULT NULL,
  filter_keyword text DEFAULT NULL
)
RETURNS TABLE(
  id uuid, display_name text, age integer, gender text,
  city text, canton text, postal_code text, about_me text,
  languages text[], status text, slug text, listing_type text,
  verified_at timestamptz, premium_until timestamptz, top_ad_until timestamptz,
  lat numeric, lng numeric, is_adult boolean,
  created_at timestamptz, updated_at timestamptz,
  availability_status text,
  street_address text, show_street boolean,
  distance_km double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.display_name, p.age, p.gender,
    p.city, p.canton, p.postal_code, p.about_me,
    p.languages, p.status, p.slug, p.listing_type,
    p.verified_at, p.premium_until, p.top_ad_until,
    p.lat, p.lng, p.is_adult, p.created_at, p.updated_at,
    p.availability_status,
    cont.street_address,
    cont.show_street,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat))
        * cos(radians(p.lng) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) AS distance_km
  FROM profiles p
  LEFT JOIN profile_contacts cont ON cont.profile_id = p.id
  WHERE p.status = 'active'
    AND (
      (p.listing_type = 'top' AND p.top_ad_until >= now())
      OR (p.listing_type <> 'top' AND p.premium_until >= now())
    )
    AND p.lat IS NOT NULL AND p.lng IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat))
        * cos(radians(p.lng) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) <= radius_km
    AND (filter_category_id IS NULL OR EXISTS (
      SELECT 1 FROM profile_categories pc WHERE pc.profile_id = p.id AND pc.category_id = filter_category_id
    ))
    AND (filter_keyword IS NULL OR (
      p.display_name ILIKE '%' || filter_keyword || '%'
      OR p.about_me ILIKE '%' || filter_keyword || '%'
      OR p.city ILIKE '%' || filter_keyword || '%'
    ))
  ORDER BY
    CASE p.listing_type WHEN 'top' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END ASC,
    distance_km ASC;
END;
$$;

-- D2) Replace search_profiles_by_radius (with pagination) with expiry filter
CREATE OR REPLACE FUNCTION public.search_profiles_by_radius(
  user_lat numeric,
  user_lng numeric,
  radius_km numeric,
  filter_category_id uuid DEFAULT NULL,
  filter_keyword text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20,
  p_rotation_seed integer DEFAULT 0
)
RETURNS TABLE(
  id uuid, display_name text, age integer, gender text,
  city text, canton text, postal_code text, about_me text,
  languages text[], status text, slug text, listing_type text,
  verified_at timestamptz, premium_until timestamptz, top_ad_until timestamptz,
  lat numeric, lng numeric, is_adult boolean,
  created_at timestamptz, updated_at timestamptz,
  availability_status text,
  street_address text, show_street boolean,
  distance_km double precision,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset integer;
  v_total bigint;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  SELECT count(*) INTO v_total
  FROM profiles p
  WHERE p.status = 'active'
    AND (
      (p.listing_type = 'top' AND p.top_ad_until >= now())
      OR (p.listing_type <> 'top' AND p.premium_until >= now())
    )
    AND p.lat IS NOT NULL AND p.lng IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat))
        * cos(radians(p.lng) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) <= radius_km
    AND (filter_category_id IS NULL OR EXISTS (
      SELECT 1 FROM profile_categories pc WHERE pc.profile_id = p.id AND pc.category_id = filter_category_id
    ))
    AND (filter_keyword IS NULL OR (
      p.display_name ILIKE '%' || filter_keyword || '%'
      OR p.about_me ILIKE '%' || filter_keyword || '%'
      OR p.city ILIKE '%' || filter_keyword || '%'
    ));

  RETURN QUERY
  SELECT
    p.id, p.display_name, p.age, p.gender,
    p.city, p.canton, p.postal_code, p.about_me,
    p.languages, p.status, p.slug, p.listing_type,
    p.verified_at, p.premium_until, p.top_ad_until,
    p.lat, p.lng, p.is_adult, p.created_at, p.updated_at,
    p.availability_status,
    cont.street_address,
    cont.show_street,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat))
        * cos(radians(p.lng) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) AS distance_km,
    v_total
  FROM profiles p
  LEFT JOIN profile_contacts cont ON cont.profile_id = p.id
  WHERE p.status = 'active'
    AND (
      (p.listing_type = 'top' AND p.top_ad_until >= now())
      OR (p.listing_type <> 'top' AND p.premium_until >= now())
    )
    AND p.lat IS NOT NULL AND p.lng IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat))
        * cos(radians(p.lng) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) <= radius_km
    AND (filter_category_id IS NULL OR EXISTS (
      SELECT 1 FROM profile_categories pc WHERE pc.profile_id = p.id AND pc.category_id = filter_category_id
    ))
    AND (filter_keyword IS NULL OR (
      p.display_name ILIKE '%' || filter_keyword || '%'
      OR p.about_me ILIKE '%' || filter_keyword || '%'
      OR p.city ILIKE '%' || filter_keyword || '%'
    ))
  ORDER BY
    CASE p.listing_type WHEN 'top' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END ASC,
    md5(p.id::text || p_rotation_seed::text) ASC
  LIMIT p_page_size OFFSET v_offset;
END;
$$;
