
-- Drop the OLD get_paginated_profiles (has p_rotation_seed integer, p_page_size default 20, different param order)
DROP FUNCTION IF EXISTS public.get_paginated_profiles(integer, integer, text, text, uuid, text, integer);

-- Drop the OLD search_profiles_by_radius with radius_km integer (no pagination)
DROP FUNCTION IF EXISTS public.search_profiles_by_radius(numeric, numeric, integer, uuid, text);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
