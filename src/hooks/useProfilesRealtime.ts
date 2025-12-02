import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that listens to realtime changes on the profiles table
 * and invalidates relevant queries to show updates immediately.
 * Use this on pages that display profiles (Index, Search, etc.)
 */
export const useProfilesRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('profiles-realtime-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile realtime update:', payload.eventType, payload);
          
          // Invalidate all profile-related queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['homepage-profiles'] });
          queryClient.invalidateQueries({ queryKey: ['featured-profiles'] });
          queryClient.invalidateQueries({ queryKey: ['search-profiles'] });
          queryClient.invalidateQueries({ queryKey: ['top-profiles'] });
          queryClient.invalidateQueries({ queryKey: ['local-profiles'] });
          queryClient.invalidateQueries({ queryKey: ['city-profiles'] });
          queryClient.invalidateQueries({ queryKey: ['category-profiles'] });
          queryClient.invalidateQueries({ queryKey: ['gps-profiles'] });
        }
      )
      .subscribe((status) => {
        console.log('Profiles realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
