import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DropdownOption {
  id: string;
  category: string;
  value: string;
  label: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
}

export const useDropdownOptions = (category: string) => {
  return useQuery({
    queryKey: ['dropdown-options', category],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('dropdown_options')
        .select('*')
        .eq('category', category)
        .eq('active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as DropdownOption[];
    },
  });
};

export const useAllDropdownOptions = () => {
  return useQuery({
    queryKey: ['dropdown-options-all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('dropdown_options')
        .select('*')
        .order('category')
        .order('sort_order');
      
      if (error) throw error;
      return data as DropdownOption[];
    },
  });
};

export const useCreateDropdownOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (option: Omit<DropdownOption, 'id' | 'created_at'>) => {
      const { error } = await (supabase as any)
        .from('dropdown_options')
        .insert(option);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dropdown-options'] });
      queryClient.invalidateQueries({ queryKey: ['dropdown-options-all'] });
      toast.success('Option erfolgreich erstellt');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    },
  });
};

export const useUpdateDropdownOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DropdownOption> & { id: string }) => {
      const { error } = await (supabase as any)
        .from('dropdown_options')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dropdown-options'] });
      queryClient.invalidateQueries({ queryKey: ['dropdown-options-all'] });
      toast.success('Option erfolgreich aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Aktualisieren: ${error.message}`);
    },
  });
};

export const useDeleteDropdownOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('dropdown_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dropdown-options'] });
      queryClient.invalidateQueries({ queryKey: ['dropdown-options-all'] });
      toast.success('Option erfolgreich gelöscht');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    },
  });
};
