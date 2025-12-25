import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Advertisement } from '@/types/advertisement';

// PERFORMANCE: Single query for all active ads, filter client-side
export const useAllActiveAdvertisements = () => {
  return useQuery({
    queryKey: ['advertisements', 'all-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });
      if (error) throw error;
      return data as Advertisement[];
    },
    staleTime: 60000, // Cache for 1 minute
  });
};

// Legacy hook - uses cached data from useAllActiveAdvertisements
export const useAdvertisements = (position?: Advertisement['position']) => {
  const { data: allAds, isLoading, error } = useAllActiveAdvertisements();
  
  // Filter client-side instead of separate API call
  const filteredAds = position 
    ? allAds?.filter(ad => ad.position === position) 
    : allAds;
  
  return {
    data: filteredAds,
    isLoading,
    error,
  };
};

export const useTrackImpression = () => {
  return useMutation({
    mutationFn: async (adId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          ad_id: adId,
          event_type: 'impression',
        }),
      });
      if (!response.ok) throw new Error('Failed to track impression');
    },
  });
};

export const useTrackClick = () => {
  return useMutation({
    mutationFn: async (adId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          ad_id: adId,
          event_type: 'click',
        }),
      });
      if (!response.ok) throw new Error('Failed to track click');
    },
  });
};

// Admin hooks
export const useAllAdvertisements = () => {
  return useQuery({
    queryKey: ['admin-advertisements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Advertisement[];
    },
  });
};

export const useCreateAdvertisement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ad: Omit<Advertisement, 'id' | 'clicks' | 'impressions' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('advertisements')
        .insert([ad])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
  });
};

export const useUpdateAdvertisement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Advertisement> & { id: string }) => {
      const { data, error } = await supabase
        .from('advertisements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
  });
};

export const useDeleteAdvertisement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
  });
};

export const useExtendAdvertisement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const { data: ad, error: fetchError } = await supabase
        .from('advertisements')
        .select('end_date')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      const currentEndDate = ad.end_date ? new Date(ad.end_date) : new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { data, error } = await supabase
        .from('advertisements')
        .update({ 
          end_date: newEndDate.toISOString(),
          active: true 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-advertisements'] });
      queryClient.invalidateQueries({ queryKey: ['advertisements'] });
    },
  });
};
