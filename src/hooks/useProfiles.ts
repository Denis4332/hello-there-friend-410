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

// Reusable profile select query (without user_id for security)
const PROFILE_SELECT_QUERY = `
  id, slug, display_name, age, gender, city, canton, postal_code,
  lat, lng, about_me, languages, is_adult, verified_at, status, 
  listing_type, premium_until, top_ad_until, created_at, updated_at,
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
/**
 * OPTIMIZED: Fetches all homepage profiles in a single query for better performance.
 * Returns profiles grouped by listing type for easy filtering on client-side.
 * Cache time increased to 15 minutes for homepage.
 * 
 * @param {number} topLimit - Max TOP profiles (default: 3)
 * @param {number} localLimit - Max local profiles (default: 5)
 * @param {number} newestLimit - Max newest profiles (default: 8)
 * @param {string | null} canton - Canton for local profiles
 * @returns {UseQueryResult} React Query result with all homepage profiles
 */
export const useHomepageProfiles = (
  topLimit: number = 3,
  localLimit: number = 5, 
  newestLimit: number = 8,
  canton: string | null = null
) => {
  return useQuery({
    queryKey: ['homepage-profiles', topLimit, localLimit, newestLimit, canton, 'v2'],
    staleTime: 15 * 60 * 1000, // 15 minutes cache for homepage
    queryFn: async () => {
      // ROBUST FIX: Get full canton name if abbreviation provided
      let cantonFullName: string | null = null;
      if (canton) {
        const { data: cantonData } = await supabase
          .from('cantons')
          .select('name')
          .eq('abbreviation', canton)
          .maybeSingle();
        cantonFullName = cantonData?.name || null;
      }
      
      // Use public_profiles view (no user_id exposure)
      const result = await supabase
        .from('public_profiles')
        .select(PROFILE_SELECT_QUERY)
      .order('created_at', { ascending: false })
      .limit(500); // Fetch enough for all TOP ads
      
      if (result.error) throw result.error;
      
      const allProfiles = validateProfilesResponse(result.data || []);
      
      // Client-side filtering and limiting
      const topProfiles = allProfiles
        .filter(p => p.listing_type === 'top')
        .slice(0, topLimit);
      
      // ROBUST FIX: Filter for BOTH abbreviation AND full canton name
      const localProfiles = canton 
        ? allProfiles
            .filter(p => 
              (p.canton === canton || p.canton === cantonFullName) && 
              ['premium', 'basic'].includes(p.listing_type || '')
            )
            .slice(0, localLimit)
        : [];
        
      const newestProfiles = allProfiles.slice(0, newestLimit);
      
      return {
        topProfiles,
        localProfiles,
        newestProfiles,
        allProfiles, // For future use
      };
    },
  });
};

// TOP-Inserate schweizweit (für Homepage) - DEPRECATED: Use useHomepageProfiles instead
export const useTopProfiles = (limit: number = 3) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['top-profiles', limit],
    staleTime: 15 * 60 * 1000, // Increased from 5min to 15min
    queryFn: async () => {
      const result = await supabase
        .from('public_profiles')
        .select(PROFILE_SELECT_QUERY)
        .eq('listing_type', 'top')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (result.error) throw result.error;
      
      return validateProfilesResponse(result.data || []);
    },
  });
};

// Premium/Basic Inserate lokal (nach Kanton) - DEPRECATED: Use useHomepageProfiles instead
export const useLocalProfiles = (canton: string | null, limit: number = 5) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['local-profiles', canton, limit, 'v2'],
    staleTime: 15 * 60 * 1000, // Increased from 5min to 15min
    enabled: !!canton,
    queryFn: async () => {
      if (!canton) return [];
      
      // ROBUST FIX: Get full canton name to search both
      const { data: cantonData } = await supabase
        .from('cantons')
        .select('name')
        .eq('abbreviation', canton)
        .maybeSingle();
      
      let query = supabase
        .from('public_profiles')
        .select(PROFILE_SELECT_QUERY)
        .in('listing_type', ['premium', 'basic'])
        .order('listing_type', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // Search for BOTH abbreviation AND full name
      if (cantonData?.name) {
        query = query.or(`canton.eq.${canton},canton.eq.${cantonData.name}`);
      } else {
        query = query.eq('canton', canton);
      }
      
      const result = await query;
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
      const result = await supabase
        .from('public_profiles')
        .select(PROFILE_SELECT_QUERY)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (result.error) throw result.error;
      
      return validateProfilesResponse(result.data || []);
    },
  });
};

/**
 * Helper function to get canton full name from abbreviation
 */
const getCantonFullName = async (abbreviation: string): Promise<string | null> => {
  const { data } = await supabase
    .from('cantons')
    .select('name')
    .eq('abbreviation', abbreviation)
    .maybeSingle();
  return data?.name || null;
};

export const useSearchProfiles = (filters: {
  location?: string;
  categoryId?: string;
  keyword?: string;
  enabled?: boolean;
}) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['search-profiles', filters, 'v9'],
    staleTime: 0, // No caching - always fetch fresh data for filters
    enabled: filters.enabled ?? true,
    queryFn: async () => {
      let query = supabase
        .from('public_profiles')
        .select(PROFILE_SELECT_QUERY);
      
      // NEUE LOGIK: Ohne Filter (kein Kanton, keine Kategorie, kein Keyword) → NUR TOP-Profile
      const hasNoFilters = !filters.location && !filters.categoryId && !filters.keyword;
      if (hasNoFilters) {
        query = query.eq('listing_type', 'top');
      }
      
      if (filters.location) {
        const isCantonCode = /^[A-Z]{2,3}$/.test(filters.location);
        
        if (isCantonCode) {
          // ROBUST FIX: Search for BOTH abbreviation AND full canton name
          const fullName = await getCantonFullName(filters.location);
          if (fullName) {
            query = query.or(`canton.eq.${filters.location},canton.eq.${fullName}`);
          } else {
            query = query.eq('canton', filters.location);
          }
        } else {
          query = query.or(`city.ilike.%${filters.location}%,postal_code.ilike.%${filters.location}%`);
        }
      }
      
      if (filters.categoryId) {
        // Get profile IDs that have this category
        const { data: profileIds, error: categoryError } = await supabase
          .from('profile_categories')
          .select('profile_id')
          .eq('category_id', filters.categoryId);
        
        if (categoryError) throw categoryError;
        
        if (profileIds && profileIds.length > 0) {
          const ids = profileIds.map(p => p.profile_id);
          query = query.in('id', ids);
        } else {
          // No profiles with this category - return empty array
          return [];
        }
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
        .from('public_profiles')
        .select(PROFILE_SELECT_QUERY)
        .eq('slug', normalizedSlug)
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
      
      const result = await supabase
        .from('public_profiles')
        .select(PROFILE_SELECT_QUERY)
        .ilike('city', cityName);
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
      
      const result = await supabase
        .from('profile_categories')
        .select(`
          profile_id,
          profiles!inner(
            id, slug, display_name, age, gender, city, canton, postal_code,
            lat, lng, about_me, languages, is_adult, verified_at, status, 
            listing_type, premium_until, top_ad_until, created_at, updated_at,
            photos(storage_path, is_primary)
          )
        `)
        .eq('category_id', categoryId)
        .eq('profiles.status', 'active');
      
      if (result.error) throw result.error;
      
      const profiles = result.data?.map((p: any) => ({
        ...p.profiles,
        profile_categories: [{ category_id: categoryId }]
      })) || [];
      
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
    staleTime: 0, // Always fetch fresh data for GPS search
    gcTime: 0, // Prevent garbage collection of query data
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
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
      
      const filteredData = data || [];
      
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
              .select('category_id, categories(id, name, slug)')
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