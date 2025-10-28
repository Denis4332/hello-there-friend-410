import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Explicit types to avoid "Type instantiation is excessively deep" error
type ProfileWithRelations = any;

// Helper: Load all Admin User IDs
const getAdminUserIds = async (): Promise<string[]> => {
  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');
  
  return adminRoles?.map(r => r.user_id) || [];
};

export const useFeaturedProfiles = (limit: number = 8) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['featured-profiles', limit],
    queryFn: async () => {
      const adminUserIds = await getAdminUserIds();
      
      let query = (supabase as any)
        .from('profiles')
        .select(`
          *,
          photos(storage_path, is_primary),
          profile_categories(category_id)
        `)
        .eq('status', 'active');
      
      if (adminUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminUserIds.join(',')})`);
      }
      
      const result = await query
        .order('is_premium', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (result.error) throw result.error;
      return (result.data || []) as ProfileWithRelations[];
    },
  });
};

export const useSearchProfiles = (filters: {
  location?: string;
  categoryId?: string;
  keyword?: string;
}) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['search-profiles', filters],
    queryFn: async () => {
      const adminUserIds = await getAdminUserIds();
      
      let query = (supabase as any)
        .from('profiles')
        .select(`
          *,
          photos(storage_path, is_primary),
          profile_categories(category_id)
        `)
        .eq('status', 'active');
      
      if (adminUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminUserIds.join(',')})`);
      }
      
      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,postal_code.ilike.%${filters.location}%`);
      }
      
      if (filters.categoryId) {
        query = query.contains('profile_categories', [{ category_id: filters.categoryId }]);
      }
      
      if (filters.keyword) {
        query = query.or(`display_name.ilike.%${filters.keyword}%,about_me.ilike.%${filters.keyword}%`);
      }
      
      const result = await query;
      if (result.error) throw result.error;
      return (result.data || []) as ProfileWithRelations[];
    },
  });
};

export const useProfileBySlug = (slug: string | undefined) => {
  return useQuery<ProfileWithRelations | null>({
    queryKey: ['profile', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const result = await (supabase as any)
        .from('profiles')
        .select('*, photos(storage_path, is_primary), profile_categories(category_id)')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();
      
      if (result.error) throw result.error;
      return result.data as ProfileWithRelations | null;
    },
    enabled: !!slug,
  });
};

export const useCityProfiles = (cityName: string | undefined) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['city-profiles', cityName],
    queryFn: async () => {
      if (!cityName) return [];
      
      const adminUserIds = await getAdminUserIds();
      
      let query = (supabase as any)
        .from('profiles')
        .select(`
          *,
          photos(storage_path, is_primary),
          profile_categories(category_id)
        `)
        .eq('status', 'active')
        .ilike('city', cityName);
      
      if (adminUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminUserIds.join(',')})`);
      }
      
      const result = await query;
      if (result.error) throw result.error;
      return (result.data || []) as ProfileWithRelations[];
    },
    enabled: !!cityName,
  });
};

export const useCategoryProfiles = (categoryId: string | undefined) => {
  return useQuery<ProfileWithRelations[]>({
    queryKey: ['category-profiles', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const adminUserIds = await getAdminUserIds();
      
      const result = await (supabase as any)
        .from('profile_categories')
        .select(`
          profile_id,
          profiles!inner(
            *,
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
        profiles = profiles.filter((p: any) => !adminUserIds.includes(p.user_id));
      }
      
      return profiles as ProfileWithRelations[];
    },
    enabled: !!categoryId,
  });
};

export const useTopCities = (limit: number = 4) => {
  return useQuery({
    queryKey: ['top-cities', limit],
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
            slug: p.city.toLowerCase().replace(/ü/g, 'ue').replace(/ö/g, 'oe').replace(/ä/g, 'ae'),
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

export const useAllCities = () => {
  return useQuery({
    queryKey: ['all-cities'],
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
            slug: p.city.toLowerCase().replace(/ü/g, 'ue').replace(/ö/g, 'oe').replace(/ä/g, 'ae'),
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
    queryKey: ['profiles-by-radius', userLat, userLng, radiusKm, filters],
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
        filteredData = filteredData.filter((p: any) => !adminUserIds.includes(p.user_id));
      }
      
      // Fetch photos and categories for each profile
      const profilesWithRelations = await Promise.all(
        filteredData.map(async (profile: any) => {
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
      
      return profilesWithRelations as (ProfileWithRelations & { distance_km: number })[];
    },
    enabled: !!userLat && !!userLng,
  });
};