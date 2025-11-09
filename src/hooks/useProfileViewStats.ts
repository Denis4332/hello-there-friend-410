import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfileViewStat {
  profile_id: string;
  display_name: string;
  city: string;
  total_views: number;
  unique_views: number;
  views_24h: number;
  views_7d: number;
  views_30d: number;
}

export const useProfileViewStats = (limit: number = 20) => {
  return useQuery({
    queryKey: ['profile-view-stats', limit],
    queryFn: async (): Promise<ProfileViewStat[]> => {
      const { data, error } = await supabase
        .from('profile_views')
        .select(`
          profile_id,
          profiles!inner(display_name, city)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate views by profile
      const profileMap = new Map<string, ProfileViewStat>();

      data?.forEach((view: any) => {
        const profileId = view.profile_id;
        const createdAt = new Date(view.created_at);
        const now = new Date();
        const day24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        if (!profileMap.has(profileId)) {
          profileMap.set(profileId, {
            profile_id: profileId,
            display_name: view.profiles.display_name,
            city: view.profiles.city,
            total_views: 0,
            unique_views: 0,
            views_24h: 0,
            views_7d: 0,
            views_30d: 0,
          });
        }

        const stat = profileMap.get(profileId)!;
        stat.total_views++;

        if (createdAt >= day24Ago) stat.views_24h++;
        if (createdAt >= days7Ago) stat.views_7d++;
        if (createdAt >= days30Ago) stat.views_30d++;
      });

      return Array.from(profileMap.values())
        .sort((a, b) => b.total_views - a.total_views)
        .slice(0, limit);
    },
    staleTime: 5 * 60 * 1000,
  });
};
