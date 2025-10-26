import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface City {
  id: string;
  name: string;
  slug: string;
  canton_id: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
  canton?: {
    id: string;
    name: string;
    abbreviation: string;
  };
}

export const useCities = () => {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          canton:cantons(id, name, abbreviation)
        `)
        .order('name');

      if (error) throw error;
      return data as City[];
    },
  });
};

export const useCityBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['city', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          canton:cantons(id, name, abbreviation)
        `)
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data as City;
    },
    enabled: !!slug,
  });
};
