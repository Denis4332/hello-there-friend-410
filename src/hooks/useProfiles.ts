import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeSlug } from '@/lib/stringUtils';
import { ProfileWithRelations } from '@/types/common';
import { validateProfileResponse, validateProfilesResponse } from '@/lib/typeGuards';

// Cache admin user IDs to avoid repeated queries
let adminUserIdsCache: string[] | null = null;
let adminUserIdsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches and caches admin user IDs to exclude them from public profile queries.
 * Cache expires after 5 minutes.
 * 
 * @returns {Promise<string[]>} Array of admin user IDs
 * @internal
 */
const getAdminUserIds = async (): Promise<string[]> => {
  const now = Date.now();
  if (adminUserIdsCache && now - adminUserIdsCacheTime < CACHE_DURATION) {
    return adminUserIdsCache;
  }

  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');
  
  adminUserIdsCache = adminRoles?.map(r => r.user_id) || [];
  adminUserIdsCacheTime = now;
  return adminUserIdsCache;
};

// Reusable profile select query
const PROFILE_SELECT_QUERY = `
  id, slug, display_name, age, gender, city, canton, postal_code,
  lat, lng, about_me, languages, is_adult, verified_at, status, 
  listing_type, premium_until, top_ad_until, user_id, created_at, updated_at,
  photos(storage_path, is_primary),
  profile_categories(
    categories(id, name, slug)
  )
`;

/**
 * Fetches a limited number of featured active profiles for the homepage.
 * Profiles are sorted by listing_type (premium first) and creation date.
 * Admin profiles are automatically excluded.
 * 
 * @param {number} limit - Maximum number of profiles to return (default: 8)
 * @returns {UseQueryResult<ProfileWithRelations[]>} React Query result with featured profiles
 * 
 * @example
 * ```typescript
 * const { data: profiles, isLoading } = useFeaturedProfiles(12);
 * ```
 */
// TOP-Inserate schweizweit (für Homepage)
export const useTopProfiles = (limit: number = 3) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['top-profiles', limit],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const adminUserIds = await getAdminUserIds();
      
      let query = supabase
        .from('profiles')
        .select(PROFILE_SELECT_QUERY)
        .eq('status', 'active')
        .eq('listing_type', 'top');
      
      if (adminUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminUserIds.map(id => `"${id}"`).join(',')})`);
      }
      
      const result = await query
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (result.error) throw result.error;
      
      return validateProfilesResponse(result.data || []);
    },
  });
};

// Premium/Basic Inserate lokal (nach Kanton)
export const useLocalProfiles = (canton: string | null, limit: number = 5) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['local-profiles', canton, limit],
    staleTime: 5 * 60 * 1000,
    enabled: !!canton,
    queryFn: async () => {
      if (!canton) return [];
      
      const adminUserIds = await getAdminUserIds();
      
      let query = supabase
        .from('profiles')
        .select(PROFILE_SELECT_QUERY)
        .eq('status', 'active')
        .eq('canton', canton)
        .in('listing_type', ['premium', 'basic']);
      
      if (adminUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminUserIds.map(id => `"${id}"`).join(',')})`);
      }
      
      const result = await query
        .order('listing_type', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (result.error) throw result.error;
      
      return validateProfilesResponse(result.data || []);
    },
  });
};

// Fallback: Alle Profile schweizweit (wenn keine Geo-Detection)
export const useFeaturedProfiles = (limit: number = 8) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['featured-profiles', limit, 'v5'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const adminUserIds = await getAdminUserIds();
      
      let query = supabase
        .from('profiles')
        .select(PROFILE_SELECT_QUERY)
        .eq('status', 'active');
      
      if (adminUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminUserIds.map(id => `"${id}"`).join(',')})`);
      }
      
      const result = await query
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (result.error) throw result.error;
      
      return validateProfilesResponse(result.data || []);
    },
  });
};

export const useSearchProfiles = (filters: {
  location?: string;
  categoryId?: string;
  keyword?: string;
  enabled?: boolean;
}) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['search-profiles', filters, 'v7'],
    staleTime: 1 * 60 * 1000,
    enabled: filters.enabled ?? true,
    queryFn: async () => {
      const adminUserIds = await getAdminUserIds();
      
      let query = supabase
        .from('profiles')
        .select(PROFILE_SELECT_QUERY)
        .eq('status', 'active');
      
      if (adminUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminUserIds.map(id => `"${id}"`).join(',')})`);
      }
      
      if (filters.location) {
        const isCantonCode = /^[A-Z]{2,3}$/.test(filters.location);
        
        if (isCantonCode) {
          query = query.eq('canton', filters.location);
        } else {
          query = query.or(`city.ilike.%${filters.location}%,postal_code.ilike.%${filters.location}%`);
        }
      }
      
      if (filters.categoryId) {
        query = query.contains('profile_categories', [{ category_id: filters.categoryId }]);
      }
      
      if (filters.keyword) {
        query = query.or(`display_name.ilike.%${filters.keyword}%,about_me.ilike.%${filters.keyword}%`);
      }
      
      const result = await query;
      if (result.error) throw result.error;
      return validateProfilesResponse(result.data || []);
    },
  });
};

/**
 * Fetches a single active profile by its unique slug.
 * Returns null if profile is not found or inactive.
 * 
 * @param {string} [slug] - Profile slug (URL-friendly identifier)
 * @returns {UseQueryResult<ProfileWithRelations | null>} React Query result with profile or null
 * 
 * @example
 * ```typescript
 * const { data: profile, isLoading } = useProfileBySlug("anna-zurich-123");
 * if (profile) {
 *   console.log(profile.display_name);
 * }
 * ```
 */
export const useProfileBySlug = (slug: string | undefined) => {
  return useQuery<ProfileWithRelations | null>({
    queryKey: ['profile', slug, 'v4'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      if (!slug) return null;
      
      const normalizedSlug = normalizeSlug(slug);
      
      const result = await supabase
        .from('profiles')
        .select(PROFILE_SELECT_QUERY)
        .eq('slug', normalizedSlug)
        .eq('status', 'active')
        .maybeSingle();
      
      if (result.error) throw result.error;
      return validateProfileResponse(result.data);
    },
    enabled: !!slug,
  });
};

/**
 * Fetches all active profiles for a specific city.
 * Uses case-insensitive matching.
 * 
 * @param {string} [cityName] - City name (e.g., "Zürich", "Basel")
 * @returns {UseQueryResult<ProfileWithRelations[]>} React Query result with city profiles
 * 
 * @example
 * ```typescript
 * const { data: profiles } = useCityProfiles("Zürich");
 * ```
 */
export const useCityProfiles = (cityName: string | undefined) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['city-profiles', cityName, 'v4'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      if (!cityName) return [];
      
      const adminUserIds = await getAdminUserIds();
      
      let query = supabase
        .from('profiles')
        .select(PROFILE_SELECT_QUERY)
        .eq('status', 'active')
        .ilike('city', cityName);
      
      if (adminUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminUserIds.map(id => `"${id}"`).join(',')})`);
      }
      
      const result = await query;
      if (result.error) throw result.error;
      return validateProfilesResponse(result.data || []);
    },
    enabled: !!cityName,
  });
};

/**
 * Fetches all active profiles associated with a specific category.
 * 
 * @param {string} [categoryId] - Category UUID
 * @returns {UseQueryResult<ProfileWithRelations[]>} React Query result with category profiles
 * 
 * @example
 * ```typescript
 * const { data: profiles } = useCategoryProfiles("category-uuid");
 * ```
 */
export const useCategoryProfiles = (categoryId: string | undefined) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['category-profiles', categoryId, 'v4'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      if (!categoryId) return [];
      
      const adminUserIds = await getAdminUserIds();
      
      const result = await supabase
        .from('profile_categories')
        .select(`
          profile_id,
          profiles!inner(
            id, slug, display_name, age, gender, city, canton, postal_code,
            lat, lng, about_me, languages, is_adult, verified_at, status, 
            listing_type, premium_until, top_ad_until, user_id, created_at, updated_at,
            photos(storage_path, is_primary)
          )
        `)
        .eq('category_id', categoryId)
        .eq('profiles.status', 'active');
      
      if (result.error) throw result.error;
      
      let profiles = result.data?.map((p: any) => ({
        ...p.profiles,
        profile_categories: [{ category_id: categoryId }]
      })) || [];
      
      if (adminUserIds.length > 0) {
        profiles = profiles.filter((p) => !adminUserIds.includes(p.user_id));
      }
      
      return validateProfilesResponse(profiles);
    },
    enabled: !!categoryId,
  });
};

/**
 * Aggregates and returns the most popular cities by profile count.
 * 
 * @param {number} limit - Maximum number of cities to return (default: 4)
 * @returns {UseQueryResult<Array<{city: string, canton: string, count: number, slug: string}>>}
 * 
 * @example
 * ```typescript
 * const { data: topCities } = useTopCities(10);
 * topCities?.forEach(city => {
 *   console.log(`${city.city}: ${city.count} profiles`);
 * });
 * ```
 */
export const useTopCities = (limit: number = 4) => {
  return useQuery({
    queryKey: ['top-cities', limit, 'v4'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('city, canton')
        .eq('status', 'active');
      
      if (error) throw error;
      if (!data) return [];
      
      const cityMap = new Map<string, { city: string; canton: string; count: number; slug: string }>();
      data.forEach((p) => {
        const key = `${p.city}-${p.canton}`;
        if (!cityMap.has(key)) {
          cityMap.set(key, {
            city: p.city,
            canton: p.canton,
            count: 1,
            slug: normalizeSlug(p.city),
          });
        } else {
          cityMap.get(key)!.count++;
        }
      });
      
      return Array.from(cityMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
  });
};

/**
 * Fetches all unique cities with active profiles, sorted by profile count.
 * 
 * @returns {UseQueryResult<Array<{city: string, canton: string, count: number, slug: string}>>}
 * 
 * @example
 * ```typescript
 * const { data: allCities } = useAllCities();
 * ```
 */
export const useAllCities = () => {
  return useQuery({
    queryKey: ['all-cities', 'v4'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('city, canton')
        .eq('status', 'active');
      
      if (error) throw error;
      if (!data) return [];
      
      const cityMap = new Map<string, { city: string; canton: string; count: number; slug: string }>();
      data.forEach((p) => {
        const key = `${p.city}-${p.canton}`;
        if (!cityMap.has(key)) {
          cityMap.set(key, {
            city: p.city,
            canton: p.canton,
            count: 1,
            slug: normalizeSlug(p.city),
          });
        } else {
          cityMap.get(key)!.count++;
        }
      });
      
      return Array.from(cityMap.values())
        .sort((a, b) => b.count - a.count);
    },
  });
};

/**
 * GPS-based profile search using the Haversine distance formula.
 * Searches within a specified radius and optionally filters by category/keyword.
 * Uses the `search_profiles_by_radius` RPC function in Supabase.
 * 
 * @param {number | null} userLat - User's latitude coordinate
 * @param {number | null} userLng - User's longitude coordinate
 * @param {number} radiusKm - Search radius in kilometers
 * @param {object} filters - Additional filters
 * @param {string} [filters.categoryId] - Category UUID to filter by
 * @param {string} [filters.keyword] - Keyword to search in display_name and about_me
 * @returns {UseQueryResult<(ProfileWithRelations & {distance_km: number})[]>}
 * 
 * @example
 * ```typescript
 * const { data: profiles } = useProfilesByRadius(47.3769, 8.5417, 10, {
 *   categoryId: "category-uuid"
 * });
 * profiles?.forEach(p => {
 *   console.log(`${p.display_name} - ${p.distance_km.toFixed(1)} km entfernt`);
 * });
 * ```
 */
export const useProfilesByRadius = (
  userLat: number | null,
  userLng: number | null,
  radiusKm: number,
  filters: {
    categoryId?: string;
    keyword?: string;
  }
) => {
  return useQuery<(ProfileWithRelations & { distance_km: number })[]>({
    queryKey: ['profiles-by-radius', userLat, userLng, radiusKm, filters, 'v4'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      if (!userLat || !userLng) return [];
      
      const adminUserIds = await getAdminUserIds();
      
      const { data, error } = await supabase.rpc('search_profiles_by_radius', {
        user_lat: userLat,
        user_lng: userLng,
        radius_km: radiusKm,
        filter_category_id: filters.categoryId || null,
        filter_keyword: filters.keyword || null,
      });
      
      if (error) throw error;
      
      let filteredData = data || [];
      if (adminUserIds.length > 0) {
        filteredData = filteredData.filter((p) => !adminUserIds.includes(p.user_id));
      }
      
      // Fetch photos and categories for each profile
      const profilesWithRelations = await Promise.all(
        filteredData.map(async (profile) => {
          const [photosResult, categoriesResult] = await Promise.all([
            supabase
              .from('photos')
              .select('storage_path, is_primary')
              .eq('profile_id', profile.id),
            supabase
              .from('profile_categories')
              .select('category_id')
              .eq('profile_id', profile.id),
          ]);
          
          return {
            ...profile,
            photos: photosResult.data || [],
            profile_categories: categoriesResult.data || [],
          };
        })
      );
      
      return validateProfilesResponse(profilesWithRelations) as (ProfileWithRelations & { distance_km: number })[];
    },
    enabled: !!userLat && !!userLng,
  });
};