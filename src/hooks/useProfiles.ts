import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizeSlug } from '@/lib/stringUtils';
import { ProfileWithRelations } from '@/types/common';
import { validateProfileResponse, validateProfilesResponse } from '@/lib/typeGuards';

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
 * Paginierte Homepage-Profile mit Server-Side Rotation
 * Nutzt die DB-Funktion get_paginated_profiles für optimale Performance
 */
export const useHomepageProfiles = (
  page: number = 1,
  pageSize: number = 24,
  rotationSeed: number = 0
) => {
  return useQuery({
    queryKey: ['homepage-profiles-paginated', page, pageSize, rotationSeed],
    staleTime: 5 * 60 * 1000, // 5 min cache
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_paginated_profiles', {
        p_page: page,
        p_page_size: pageSize,
        p_rotation_seed: rotationSeed,
        p_canton: null,
        p_city: null,
        p_category_id: null,
        p_keyword: null,
      });
      
      if (error) throw error;
      
      // Die Funktion gibt {profiles: JSONB[], total_count: BIGINT} zurück
      const result = data?.[0] || { profiles: [], total_count: 0 };
      const profiles = validateProfilesResponse(result.profiles || []);
      
      return {
        profiles,
        totalCount: Number(result.total_count) || 0,
        // Legacy-Kompatibilität
        topProfiles: profiles,
        localProfiles: [],
        newestProfiles: profiles,
        allProfiles: profiles,
      };
    },
  });
};

/**
 * Paginierte Such-Profile mit Server-Side Rotation
 */
export const useSearchProfiles = (filters: {
  location?: string;
  categoryId?: string;
  keyword?: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
  rotationSeed?: number;
}) => {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 24;
  const rotationSeed = filters.rotationSeed || 0;

  return useQuery<{ profiles: ProfileWithRelations[]; totalCount: number }>({
    queryKey: ['search-profiles-paginated', filters.location, filters.categoryId, filters.keyword, page, rotationSeed],
    staleTime: 30 * 1000, // 30 seconds cache to prevent flickering on filter changes
    placeholderData: (previousData) => previousData, // Keep old results visible during refetch
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    enabled: filters.enabled ?? true,
    queryFn: async () => {
      // Canton-Name Lookup falls nötig
      let cantonName: string | null = null;
      if (filters.location) {
        const isCantonCode = /^[A-Z]{2,3}$/.test(filters.location);
        if (isCantonCode) {
          const { data: cantonData } = await supabase
            .from('cantons')
            .select('name')
            .eq('abbreviation', filters.location)
            .maybeSingle();
          cantonName = cantonData?.name || filters.location;
        }
      }
      
      const { data, error } = await supabase.rpc('get_paginated_profiles', {
        p_page: page,
        p_page_size: pageSize,
        p_rotation_seed: rotationSeed,
        p_canton: cantonName,
        p_city: null,
        p_category_id: filters.categoryId || null,
        p_keyword: filters.keyword || null,
      });
      
      if (error) throw error;
      
      const result = data?.[0] || { profiles: [], total_count: 0 };
      const profiles = validateProfilesResponse(result.profiles || []);
      
      return {
        profiles,
        totalCount: Number(result.total_count) || 0,
      };
    },
  });
};

/**
 * Fetches a single active profile by its unique slug.
 */
export const useProfileBySlug = (slug: string | undefined) => {
  return useQuery<ProfileWithRelations | null>({
    queryKey: ['profile', slug, 'v4'],
    staleTime: 5 * 60 * 1000,
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
 * Paginierte Stadt-Profile mit Server-Side Rotation
 */
export const useCityProfiles = (
  cityName: string | undefined,
  page: number = 1,
  pageSize: number = 24,
  rotationSeed: number = 0
) => {
  return useQuery<{ profiles: ProfileWithRelations[]; totalCount: number }>({
    queryKey: ['city-profiles-paginated', cityName, page, rotationSeed],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!cityName) return { profiles: [], totalCount: 0 };
      
      const { data, error } = await supabase.rpc('get_paginated_profiles', {
        p_page: page,
        p_page_size: pageSize,
        p_rotation_seed: rotationSeed,
        p_canton: null,
        p_city: cityName,
        p_category_id: null,
        p_keyword: null,
      });
      
      if (error) throw error;
      
      const result = data?.[0] || { profiles: [], total_count: 0 };
      const profiles = validateProfilesResponse(result.profiles || []);
      
      return {
        profiles,
        totalCount: Number(result.total_count) || 0,
      };
    },
    enabled: !!cityName,
  });
};

/**
 * Paginierte Kategorie-Profile mit Server-Side Rotation
 */
export const useCategoryProfiles = (
  categoryId: string | undefined,
  page: number = 1,
  pageSize: number = 24,
  rotationSeed: number = 0
) => {
  return useQuery<{ profiles: ProfileWithRelations[]; totalCount: number }>({
    queryKey: ['category-profiles-paginated', categoryId, page, rotationSeed],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!categoryId) return { profiles: [], totalCount: 0 };
      
      const { data, error } = await supabase.rpc('get_paginated_profiles', {
        p_page: page,
        p_page_size: pageSize,
        p_rotation_seed: rotationSeed,
        p_canton: null,
        p_city: null,
        p_category_id: categoryId,
        p_keyword: null,
      });
      
      if (error) throw error;
      
      const result = data?.[0] || { profiles: [], total_count: 0 };
      const profiles = validateProfilesResponse(result.profiles || []);
      
      return {
        profiles,
        totalCount: Number(result.total_count) || 0,
      };
    },
    enabled: !!categoryId,
  });
};

/**
 * GPS-basierte Suche mit Server-Side Rotation und Pagination
 */
export const useProfilesByRadius = (
  userLat: number | null,
  userLng: number | null,
  radiusKm: number,
  filters: {
    categoryId?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
    rotationSeed?: number;
  }
) => {
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 24;
  const rotationSeed = filters.rotationSeed || 0;

  return useQuery<{ profiles: (ProfileWithRelations & { distance_km: number })[]; totalCount: number }>({
    queryKey: ['profiles-by-radius-paginated', userLat, userLng, radiusKm, filters.categoryId, filters.keyword, page, rotationSeed],
    staleTime: 10 * 1000, // 10 seconds cache to reduce flickering
    gcTime: 30 * 1000, // Keep in cache for 30 seconds
    refetchOnMount: true, // Refetch on mount but not 'always'
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    placeholderData: (previousData) => previousData, // Keep old results visible during refetch
    queryFn: async () => {
      if (!userLat || !userLng) return { profiles: [], totalCount: 0 };
      
      const { data, error } = await supabase.rpc('search_profiles_by_radius', {
        user_lat: userLat,
        user_lng: userLng,
        radius_km: radiusKm,
        filter_category_id: filters.categoryId || null,
        filter_keyword: filters.keyword || null,
        p_page: page,
        p_page_size: pageSize,
        p_rotation_seed: rotationSeed,
      });
      
      if (error) throw error;
      
      const rawProfiles = data || [];
      const totalCount = rawProfiles.length > 0 ? Number(rawProfiles[0].total_count) : 0;
      
      // Fetch photos and categories for each profile
      const profilesWithRelations = await Promise.all(
        rawProfiles.map(async (profile: any) => {
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
      
      const profiles = validateProfilesResponse(profilesWithRelations) as (ProfileWithRelations & { distance_km: number })[];
      
      return { profiles, totalCount };
    },
    enabled: !!userLat && !!userLng,
  });
};

/**
 * Aggregates and returns the most popular cities by profile count.
 */
export const useTopCities = (limit: number = 4) => {
  return useQuery({
    queryKey: ['top-cities', limit, 'v4'],
    staleTime: 5 * 60 * 1000,
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
 */
export const useAllCities = () => {
  return useQuery({
    queryKey: ['all-cities', 'v4'],
    staleTime: 5 * 60 * 1000,
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

// ============ DEPRECATED EXPORTS (für Abwärtskompatibilität) ============

/** @deprecated Use useHomepageProfiles instead */
export const useTopProfiles = (limit: number = 3) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['top-profiles', limit],
    staleTime: 15 * 60 * 1000,
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

/** @deprecated Use useHomepageProfiles instead */
export const useLocalProfiles = (canton: string | null, limit: number = 5) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['local-profiles', canton, limit],
    staleTime: 15 * 60 * 1000,
    enabled: !!canton,
    queryFn: async () => {
      if (!canton) return [];
      
      const result = await supabase
        .from('public_profiles')
        .select(PROFILE_SELECT_QUERY)
        .in('listing_type', ['premium', 'basic'])
        .eq('canton', canton)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (result.error) throw result.error;
      return validateProfilesResponse(result.data || []);
    },
  });
};

/** @deprecated Use useHomepageProfiles instead */
export const useFeaturedProfiles = (limit: number = 8) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['featured-profiles', limit],
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
