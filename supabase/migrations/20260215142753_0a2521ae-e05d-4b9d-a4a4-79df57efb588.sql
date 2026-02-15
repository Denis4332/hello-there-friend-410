
-- ============================================================
-- Expiry-Filter in alle 3 Such-Funktionen einbauen
-- Abgelaufene Profile werden aus Suchergebnissen ausgeblendet
-- ============================================================

-- A) get_paginated_profiles: 2 Stellen (COUNT + SELECT)
CREATE OR REPLACE FUNCTION public.get_paginated_profiles(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 24,
  p_rotation_seed bigint DEFAULT 0,
  p_canton text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_keyword text DEFAULT NULL
)
RETURNS TABLE(profiles jsonb, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offset INT;
  v_total BIGINT;
  v_profiles JSONB;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  SELECT COUNT(DISTINCT p.id) INTO v_total
  FROM profiles p
  LEFT JOIN profile_categories pc ON p.id = pc.profile_id
  WHERE p.status = 'active'
    AND (
      (p.listing_type = 'top' AND p.top_ad_until >= now())
      OR (p.listing_type <> 'top' AND p.premium_until >= now())
    )
    AND (p_canton IS NULL OR p.canton = p_canton)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_category_id IS NULL OR pc.category_id = p_category_id)
    AND (p_keyword IS NULL OR p_keyword = '' OR 
         p.display_name ILIKE '%' || p_keyword || '%' OR 
         p.about_me ILIKE '%' || p_keyword || '%' OR
         p.city ILIKE '%' || p_keyword || '%');
  
  SELECT COALESCE(jsonb_agg(profile_data), '[]'::jsonb) INTO v_profiles
  FROM (
    SELECT jsonb_build_object(
      'id', p.id,
      'user_id', p.user_id,
      'display_name', p.display_name,
      'age', p.age,
      'gender', p.gender,
      'city', p.city,
      'canton', p.canton,
      'postal_code', p.postal_code,
      'about_me', p.about_me,
      'languages', p.languages,
      'status', p.status,
      'listing_type', p.listing_type,
      'verified_at', p.verified_at,
      'premium_until', p.premium_until,
      'top_ad_until', p.top_ad_until,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'slug', p.slug,
      'lat', p.lat,
      'lng', p.lng,
      'photos', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', ph.id,
          'storage_path', ph.storage_path,
          'is_primary', ph.is_primary,
          'media_type', ph.media_type
        ) ORDER BY ph.is_primary DESC, ph.created_at)
        FROM photos ph WHERE ph.profile_id = p.id
      ), '[]'::jsonb),
      'profile_categories', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'category_id', pc2.category_id,
          'categories', jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug
          )
        ))
        FROM profile_categories pc2
        JOIN categories c ON c.id = pc2.category_id
        WHERE pc2.profile_id = p.id
      ), '[]'::jsonb),
      'profile_contacts', (
        SELECT jsonb_build_object(
          'phone', pco.phone,
          'whatsapp', pco.whatsapp,
          'email', pco.email,
          'website', pco.website,
          'instagram', pco.instagram,
          'telegram', pco.telegram,
          'street_address', pco.street_address,
          'show_street', pco.show_street
        )
        FROM profile_contacts pco WHERE pco.profile_id = p.id
        LIMIT 1
      )
    ) as profile_data
    FROM (
      SELECT DISTINCT ON (p.id) p.*
      FROM profiles p
      LEFT JOIN profile_categories pc ON p.id = pc.profile_id
      WHERE p.status = 'active'
        AND (
          (p.listing_type = 'top' AND p.top_ad_until >= now())
          OR (p.listing_type <> 'top' AND p.premium_until >= now())
        )
        AND (p_canton IS NULL OR p.canton = p_canton)
        AND (p_city IS NULL OR p.city = p_city)
        AND (p_category_id IS NULL OR pc.category_id = p_category_id)
        AND (p_keyword IS NULL OR p_keyword = '' OR 
             p.display_name ILIKE '%' || p_keyword || '%' OR 
             p.about_me ILIKE '%' || p_keyword || '%' OR
             p.city ILIKE '%' || p_keyword || '%')
    ) p
    ORDER BY 
      CASE 
        WHEN p.listing_type = 'top' AND p.top_ad_until > NOW() THEN 1
        WHEN p.listing_type = 'premium' AND p.premium_until > NOW() THEN 2
        ELSE 3
      END,
      md5(p.id::text || p_rotation_seed::text)
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;
  
  RETURN QUERY SELECT v_profiles, v_total;
END;
$function$;


-- B) search_profiles_by_radius (8 Param, paginiert): 2 Stellen (COUNT + SELECT)
CREATE OR REPLACE FUNCTION public.search_profiles_by_radius(
  user_lat numeric,
  user_lng numeric,
  radius_km numeric,
  filter_category_id uuid DEFAULT NULL,
  filter_keyword text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 24,
  p_rotation_seed bigint DEFAULT 0
)
RETURNS TABLE(
  id uuid, display_name text, age integer, gender text, city text, canton text,
  postal_code text, about_me text, languages text[], status text, listing_type text,
  verified_at timestamptz, premium_until timestamptz, top_ad_until timestamptz,
  created_at timestamptz, updated_at timestamptz, slug text, lat numeric, lng numeric,
  is_adult boolean, availability_status text, distance_km double precision,
  street_address text, show_street boolean, total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offset INT;
  v_total BIGINT;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  SELECT COUNT(DISTINCT p.id) INTO v_total
  FROM profiles p
  LEFT JOIN profile_categories pc ON p.id = pc.profile_id
  WHERE p.status = 'active'
    AND (
      (p.listing_type = 'top' AND p.top_ad_until >= now())
      OR (p.listing_type <> 'top' AND p.premium_until >= now())
    )
    AND p.lat IS NOT NULL 
    AND p.lng IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat)) * 
        cos(radians(p.lng) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) <= radius_km
    AND (filter_category_id IS NULL OR pc.category_id = filter_category_id)
    AND (filter_keyword IS NULL OR filter_keyword = '' OR 
         p.display_name ILIKE '%' || filter_keyword || '%' OR 
         p.about_me ILIKE '%' || filter_keyword || '%' OR
         p.city ILIKE '%' || filter_keyword || '%');

  RETURN QUERY
  SELECT 
    p.id, p.display_name, p.age, p.gender, p.city, p.canton,
    p.postal_code, p.about_me, p.languages, p.status, p.listing_type,
    p.verified_at, p.premium_until, p.top_ad_until, p.created_at,
    p.updated_at, p.slug, p.lat, p.lng, p.is_adult, p.availability_status,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat)) * 
        cos(radians(p.lng) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) as distance_km,
    pco.street_address,
    pco.show_street,
    v_total as total_count
  FROM (
    SELECT DISTINCT ON (pr.id) pr.*
    FROM profiles pr
    LEFT JOIN profile_categories pc ON pr.id = pc.profile_id
    WHERE pr.status = 'active'
      AND (
        (pr.listing_type = 'top' AND pr.top_ad_until >= now())
        OR (pr.listing_type <> 'top' AND pr.premium_until >= now())
      )
      AND pr.lat IS NOT NULL 
      AND pr.lng IS NOT NULL
      AND (
        6371 * acos(
          cos(radians(user_lat)) * cos(radians(pr.lat)) * 
          cos(radians(pr.lng) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(pr.lat))
        )
      ) <= radius_km
      AND (filter_category_id IS NULL OR pc.category_id = filter_category_id)
      AND (filter_keyword IS NULL OR filter_keyword = '' OR 
           pr.display_name ILIKE '%' || filter_keyword || '%' OR 
           pr.about_me ILIKE '%' || filter_keyword || '%' OR
           pr.city ILIKE '%' || filter_keyword || '%')
  ) p
  LEFT JOIN profile_contacts pco ON p.id = pco.profile_id
  ORDER BY 
    CASE 
      WHEN p.listing_type = 'top' AND p.top_ad_until > NOW() THEN 1
      WHEN p.listing_type = 'premium' AND p.premium_until > NOW() THEN 2
      ELSE 3
    END,
    md5(p.id::text || p_rotation_seed::text)
  LIMIT p_page_size
  OFFSET v_offset;
END;
$function$;


-- C) search_profiles_by_radius_v2: 1 Stelle (filtered CTE)
CREATE OR REPLACE FUNCTION public.search_profiles_by_radius_v2(
  user_lat numeric,
  user_lng numeric,
  radius_km numeric,
  filter_category_id uuid DEFAULT NULL,
  filter_keyword text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 24,
  p_rotation_seed bigint DEFAULT 0
)
RETURNS TABLE(
  id uuid, display_name text, age integer, gender text, city text, canton text,
  postal_code text, about_me text, languages text[], status text, listing_type text,
  verified_at timestamptz, premium_until timestamptz, top_ad_until timestamptz,
  created_at timestamptz, updated_at timestamptz, slug text, lat numeric, lng numeric,
  is_adult boolean, availability_status text, distance_km double precision,
  street_address text, show_street boolean, total_count bigint,
  photos jsonb, profile_categories jsonb
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  WITH filtered AS (
    SELECT 
      p.id, p.display_name, p.age, p.gender, p.city, p.canton, 
      p.postal_code, p.about_me, p.languages, p.status, p.listing_type,
      p.verified_at, p.premium_until, p.top_ad_until, p.created_at, 
      p.updated_at, p.slug, p.lat, p.lng, p.is_adult, p.availability_status,
      (6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(p.lat)) * 
          cos(radians(p.lng) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.lat))
        ))
      )) AS distance_km
    FROM profiles p
    WHERE p.status = 'active'
      AND (
        (p.listing_type = 'top' AND p.top_ad_until >= now())
        OR (p.listing_type <> 'top' AND p.premium_until >= now())
      )
      AND p.lat IS NOT NULL 
      AND p.lng IS NOT NULL
      AND (6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * cos(radians(p.lat)) * 
          cos(radians(p.lng) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.lat))
        ))
      )) <= radius_km
      AND (filter_category_id IS NULL OR EXISTS (
        SELECT 1 FROM profile_categories pc 
        WHERE pc.profile_id = p.id AND pc.category_id = filter_category_id
      ))
      AND (filter_keyword IS NULL OR filter_keyword = '' OR 
           p.display_name ILIKE '%' || filter_keyword || '%' OR 
           p.about_me ILIKE '%' || filter_keyword || '%' OR
           p.city ILIKE '%' || filter_keyword || '%')
  ),
  ranked AS (
    SELECT 
      f.*,
      CASE 
        WHEN f.listing_type = 'top' AND f.top_ad_until > NOW() THEN 1
        WHEN f.listing_type = 'premium' AND f.premium_until > NOW() THEN 2
        ELSE 3
      END AS tier_order,
      md5(f.id::text || p_rotation_seed::text) AS rand_key,
      count(*) OVER() AS total_cnt
    FROM filtered f
  ),
  paged AS (
    SELECT *
    FROM ranked
    ORDER BY tier_order, rand_key
    LIMIT p_page_size
    OFFSET (p_page - 1) * p_page_size
  )
  SELECT 
    pg.id, pg.display_name, pg.age, pg.gender, pg.city, pg.canton,
    pg.postal_code, pg.about_me, pg.languages, pg.status, pg.listing_type,
    pg.verified_at, pg.premium_until, pg.top_ad_until, pg.created_at,
    pg.updated_at, pg.slug, pg.lat, pg.lng, pg.is_adult, pg.availability_status,
    pg.distance_km,
    pco.street_address,
    pco.show_street,
    pg.total_cnt AS total_count,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'storage_path', ph.storage_path,
        'is_primary', ph.is_primary,
        'media_type', ph.media_type
      ) ORDER BY ph.is_primary DESC NULLS LAST, ph.created_at)
      FROM photos ph WHERE ph.profile_id = pg.id
    ), '[]'::jsonb) AS photos,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'category_id', pcat.category_id,
        'categories', jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug
        )
      ))
      FROM profile_categories pcat
      JOIN categories c ON c.id = pcat.category_id
      WHERE pcat.profile_id = pg.id
    ), '[]'::jsonb) AS profile_categories
  FROM paged pg
  LEFT JOIN profile_contacts pco ON pco.profile_id = pg.id
  ORDER BY pg.tier_order, pg.rand_key;
$function$;

-- Schema-Cache aktualisieren
NOTIFY pgrst, 'reload schema';
