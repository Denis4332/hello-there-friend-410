import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFeaturedProfiles = (limit: number = 8) => {
  return useQuery({
    queryKey: ['featured-profiles', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          photos(storage_path, is_primary),
          profile_categories(category_id)
        `)
        .eq('status', 'active')
        .order('is_premium', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useSearchProfiles = (filters: {
  location?: string;
  categoryId?: string;
  keyword?: string;
}) => {
  return useQuery({
    queryKey: ['search-profiles', filters],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          photos(storage_path, is_primary),
          profile_categories(category_id)
        `)
        .eq('status', 'active');
      
      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,postal_code.ilike.%${filters.location}%`);
      }
      
      if (filters.categoryId) {
        query = query.contains('profile_categories', [{ category_id: filters.categoryId }]);
      }
      
      if (filters.keyword) {
        query = query.or(`display_name.ilike.%${filters.keyword}%,about_me.ilike.%${filters.keyword}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

export const useProfileBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['profile', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, photos(storage_path, is_primary), profile_categories(category_id)')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

export const useCityProfiles = (cityName: string | undefined) => {
  return useQuery({
    queryKey: ['city-profiles', cityName],
    queryFn: async () => {
      if (!cityName) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          photos(storage_path, is_primary),
          profile_categories(category_id)
        `)
        .eq('status', 'active')
        .ilike('city', cityName);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!cityName,
  });
};

export const useCategoryProfiles = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['category-profiles', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data: profiles, error } = await supabase
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
      
      if (error) throw error;
      return profiles?.map(p => ({
        ...p.profiles,
        profile_categories: [{ category_id: categoryId }]
      })) || [];
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