-- Funktion für paginierte Profile mit Tier-Sortierung und seitenunabhängiger Rotation
-- Die Rotation basiert auf md5(id || seed) - identisch zum Frontend MurmurHash-Prinzip
CREATE OR REPLACE FUNCTION get_paginated_profiles(
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 24,
  p_rotation_seed BIGINT DEFAULT 0,
  p_canton TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_keyword TEXT DEFAULT NULL
)
RETURNS TABLE(
  profiles JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT;
  v_total BIGINT;
  v_profiles JSONB;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  
  -- Zähle Gesamtzahl der passenden Profile
  SELECT COUNT(DISTINCT p.id) INTO v_total
  FROM profiles p
  LEFT JOIN profile_categories pc ON p.id = pc.profile_id
  WHERE p.status = 'active'
    AND (p_canton IS NULL OR p.canton = p_canton)
    AND (p_city IS NULL OR p.city = p_city)
    AND (p_category_id IS NULL OR pc.category_id = p_category_id)
    AND (p_keyword IS NULL OR p_keyword = '' OR 
         p.display_name ILIKE '%' || p_keyword || '%' OR 
         p.about_me ILIKE '%' || p_keyword || '%' OR
         p.city ILIKE '%' || p_keyword || '%');
  
  -- Hole paginierte Profile mit Tier-Sortierung und Rotation
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
        AND (p_canton IS NULL OR p.canton = p_canton)
        AND (p_city IS NULL OR p.city = p_city)
        AND (p_category_id IS NULL OR pc.category_id = p_category_id)
        AND (p_keyword IS NULL OR p_keyword = '' OR 
             p.display_name ILIKE '%' || p_keyword || '%' OR 
             p.about_me ILIKE '%' || p_keyword || '%' OR
             p.city ILIKE '%' || p_keyword || '%')
    ) p
    -- Sortierung: Tier-Priorität (TOP > Premium > Basic), dann Rotation innerhalb Tier
    ORDER BY 
      CASE 
        WHEN p.listing_type = 'TOP' AND p.top_ad_until > NOW() THEN 1
        WHEN p.listing_type = 'premium' AND p.premium_until > NOW() THEN 2
        ELSE 3
      END,
      -- Rotation innerhalb jedes Tiers basierend auf md5(id || seed)
      md5(p.id::text || p_rotation_seed::text)
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;
  
  RETURN QUERY SELECT v_profiles, v_total;
END;
$$;