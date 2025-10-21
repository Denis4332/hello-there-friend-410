import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    },
  });
};

export const useCategoryBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};