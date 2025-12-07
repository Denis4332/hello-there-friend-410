import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettingsMap {
  [key: string]: string;
}

/**
 * Fetches ALL site_settings in a single query and caches for 30 minutes.
 * Use getSetting(key) to retrieve individual values with fallback support.
 */
export const useBatchSiteSettings = () => {
  const query = useQuery({
    queryKey: ['batch-site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');
      
      if (error) throw error;
      
      // Convert array to key-value map for O(1) lookups
      const settingsMap: SiteSettingsMap = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      
      return settingsMap;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes cache
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  /**
   * Get a single setting value by key with optional fallback
   */
  const getSetting = (key: string, fallback: string = ''): string => {
    return query.data?.[key] ?? fallback;
  };

  return {
    settings: query.data || {},
    getSetting,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
