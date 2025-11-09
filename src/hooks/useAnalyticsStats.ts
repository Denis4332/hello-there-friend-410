import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsStats {
  totalViews24h: number;
  totalViews7d: number;
  totalViews30d: number;
  totalSearches24h: number;
  totalSearches7d: number;
  totalSearches30d: number;
  totalProfiles: number;
  activeProfiles: number;
  totalEvents24h: number;
}

export const useAnalyticsStats = () => {
  return useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async (): Promise<AnalyticsStats> => {
      const now = new Date();
      const day24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Total page views
      const { data: views24h } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
        .gte('created_at', day24Ago.toISOString());

      const { data: views7d } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
        .gte('created_at', days7Ago.toISOString());

      const { data: views30d } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
        .gte('created_at', days30Ago.toISOString());

      // Total searches
      const { data: searches24h } = await supabase
        .from('search_queries')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', day24Ago.toISOString());

      const { data: searches7d } = await supabase
        .from('search_queries')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', days7Ago.toISOString());

      const { data: searches30d } = await supabase
        .from('search_queries')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', days30Ago.toISOString());

      // Total profiles
      const { count: totalProfiles } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      const { count: activeProfiles } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Total events 24h
      const { data: events24h } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', day24Ago.toISOString());

      return {
        totalViews24h: views24h?.length || 0,
        totalViews7d: views7d?.length || 0,
        totalViews30d: views30d?.length || 0,
        totalSearches24h: searches24h?.length || 0,
        totalSearches7d: searches7d?.length || 0,
        totalSearches30d: searches30d?.length || 0,
        totalProfiles: totalProfiles || 0,
        activeProfiles: activeProfiles || 0,
        totalEvents24h: events24h?.length || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
