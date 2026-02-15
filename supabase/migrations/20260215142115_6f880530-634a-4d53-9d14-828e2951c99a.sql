
-- Remove old integer-based duplicate functions
DROP FUNCTION IF EXISTS get_paginated_profiles(integer, integer, integer, text, text, uuid, text);
DROP FUNCTION IF EXISTS search_profiles_by_radius(numeric, numeric, numeric, uuid, text, integer, integer, integer);
DROP FUNCTION IF EXISTS search_profiles_by_radius_v2(numeric, numeric, numeric, uuid, text, integer, integer, integer);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
