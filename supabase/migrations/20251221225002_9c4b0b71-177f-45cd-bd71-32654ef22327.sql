-- Performance Index: Composite index for common homepage/search queries
-- This index optimizes queries that filter by listing_type and status, then sort by created_at

-- Drop existing index if it exists (to avoid conflicts)
DROP INDEX IF EXISTS idx_profiles_listing_status_created;

-- Create composite index for optimized homepage queries
CREATE INDEX idx_profiles_listing_status_created 
ON profiles(listing_type, status, created_at DESC);

-- Create index for city searches (case-insensitive)
DROP INDEX IF EXISTS idx_profiles_city_lower;
CREATE INDEX idx_profiles_city_lower 
ON profiles(lower(city));

-- Create index for canton searches
DROP INDEX IF EXISTS idx_profiles_canton;
CREATE INDEX idx_profiles_canton 
ON profiles(canton);

-- Create index for category lookups
DROP INDEX IF EXISTS idx_profile_categories_category;
CREATE INDEX idx_profile_categories_category 
ON profile_categories(category_id);

-- Analyze tables to update statistics for query planner
ANALYZE profiles;
ANALYZE profile_categories;