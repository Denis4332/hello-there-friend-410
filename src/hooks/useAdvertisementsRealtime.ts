import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that listens to realtime changes on the advertisements table
 * and invalidates relevant queries to show updates immediately.
 * Use this on pages that display banners (Index, Search, Stadt, Kategorie, etc.)
 */
export const useAdvertisementsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('advertisements-realtime-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'advertisements'
        },
        (payload) => {
          console.log('Advertisement realtime update:', payload.eventType, payload);
          
          // Invalidate all advertisement-related queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['advertisements'] });
        }
      )
      .subscribe((status) => {
        console.log('Advertisements realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
