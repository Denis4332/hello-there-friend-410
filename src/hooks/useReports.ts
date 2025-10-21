import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCreateReport = () => {
  return useMutation({
    mutationFn: async ({
      profileId,
      reason,
      message,
    }: {
      profileId: string;
      reason: string;
      message: string;
    }) => {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          profile_id: profileId,
          reporter_user_id: null, // Anonymous reports allowed
          reason,
          message,
          status: 'open',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Meldung wurde erfolgreich eingereicht');
    },
    onError: (error) => {
      console.error('Report error:', error);
      toast.error('Fehler beim Absenden der Meldung');
    },
  });
};