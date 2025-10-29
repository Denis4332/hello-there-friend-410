import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCitiesByCantonSlim = (cantonAbbreviation: string | undefined) => {
  return useQuery({
    queryKey: ['cities-by-canton', cantonAbbreviation],
    queryFn: async () => {
      if (!cantonAbbreviation) return [];
      
      const { data: cantonData, error: cantonError } = await supabase
        .from('cantons')
        .select('id')
        .eq('abbreviation', cantonAbbreviation)
        .single();
      
      if (cantonError || !cantonData) return [];
      
      const { data, error } = await supabase
        .from('cities')
        .select('name, slug')
        .eq('canton_id', cantonData.id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!cantonAbbreviation,
  });
};

export const useCantons = () => {
  return useQuery({
    queryKey: ['cantons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cantons')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });
};
