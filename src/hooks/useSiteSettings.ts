import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'textarea' | 'color' | 'image' | 'url' | 'boolean';
  category: 'content' | 'design' | 'seo' | 'navigation';
  label: string;
  description?: string;
  updated_at?: string;
  created_at?: string;
}

export const useSiteSettings = (category?: string) => {
  return useQuery({
    queryKey: ['site-settings', category],
    queryFn: async () => {
      let query = supabase.from('site_settings').select('*');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query.order('label');
      
      if (error) throw error;
      return data as SiteSetting[];
    },
  });
};

export const useSiteSetting = (key: string) => {
  return useQuery({
    queryKey: ['site-setting', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();
      
      if (error) throw error;
      return data?.value || '';
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-setting'] });
      toast.success('Einstellung erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });
};
