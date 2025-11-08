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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Sie müssen angemeldet sein, um eine Meldung zu erstellen');
      }

      const { data, error } = await supabase
        .from('reports')
        .insert({
          profile_id: profileId,
          reporter_user_id: user.id,
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
    onError: (error: Error) => {
      const errorMessage = error.message === 'Sie müssen angemeldet sein, um eine Meldung zu erstellen'
        ? error.message
        : 'Fehler beim Absenden der Meldung';
      toast.error(errorMessage);
    },
  });
};