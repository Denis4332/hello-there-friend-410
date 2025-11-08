import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Canton {
  id: string;
  name: string;
  abbreviation: string;
  slug?: string;
}

export const useCantons = () => {
  return useQuery({
    queryKey: ['cantons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cantons')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Canton[];
    },
  });
};
