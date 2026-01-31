import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Advertisement, BannerPosition, BANNER_CONFIG } from '@/types/advertisement';
import { queueAdEvent } from '@/lib/adEventQueue';
import { useMemo } from 'react';

// Weighted random selection based on priority (1-100)
function selectWeightedRandom<T extends { priority: number }>(items: T[]): T | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  
  const totalWeight = items.reduce((sum, item) => sum + (item.priority || 50), 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.priority || 50;
    if (random <= 0) return item;
  }
  
  return items[0];
}

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

// Returns ONE rotating banner for a specific position using weighted random
export const useAdvertisement = (position: BannerPosition) => {
  const { data: allAds, isLoading, error } = useAllActiveAdvertisements();
  
  const ad = useMemo(() => {
    if (!allAds) return null;
    const positionAds = allAds.filter(a => a.position === position);
    return selectWeightedRandom(positionAds);
  }, [allAds, position]);
  
  return {
    ad,
    isLoading,
    error,
  };
};

// Legacy hook - returns all ads for a position (for backwards compatibility)
export const useAdvertisements = (position?: BannerPosition | 'top' | 'grid') => {
  const { data: allAds, isLoading, error } = useAllActiveAdvertisements();
  
  // Map legacy positions to new positions
  const mappedPosition = useMemo(() => {
    if (!position) return undefined;
    if (position === 'top') return 'header_banner';
    if (position === 'grid') return 'in_grid';
    return position as BannerPosition;
  }, [position]);
  
  // Filter client-side instead of separate API call
  const filteredAds = mappedPosition 
    ? allAds?.filter(ad => ad.position === mappedPosition) 
    : allAds;
  
  return {
    data: filteredAds,
    isLoading,
    error,
  };
};

// Count active ads per position for slot management
export const useBannerSlotCounts = () => {
  const { data: allAds } = useAllActiveAdvertisements();
  
  const counts = useMemo(() => {
    const result: Record<BannerPosition, { used: number; max: number }> = {
      header_banner: { used: 0, max: BANNER_CONFIG.header_banner.maxSlots },
      in_content: { used: 0, max: BANNER_CONFIG.in_content.maxSlots },
      in_grid: { used: 0, max: BANNER_CONFIG.in_grid.maxSlots },
      footer_banner: { used: 0, max: BANNER_CONFIG.footer_banner.maxSlots },
      popup: { used: 0, max: BANNER_CONFIG.popup.maxSlots },
    };
    
    if (allAds) {
      for (const ad of allAds) {
        if (result[ad.position as BannerPosition]) {
          result[ad.position as BannerPosition].used++;
        }
      }
    }
    
    return result;
  }, [allAds]);
  
  return counts;
};

// Check if position has available slots
export const usePositionAvailable = (position: BannerPosition) => {
  const counts = useBannerSlotCounts();
  return counts[position].used < counts[position].max;
};

// FIRE-AND-FORGET: Uses queue for batched sending
export const useTrackImpression = () => {
  return useMutation({
    mutationFn: async (adId: string) => {
      queueAdEvent(adId, 'impression');
    },
  });
};

export const useTrackClick = () => {
  return useMutation({
    mutationFn: async (adId: string) => {
      queueAdEvent(adId, 'click');
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
