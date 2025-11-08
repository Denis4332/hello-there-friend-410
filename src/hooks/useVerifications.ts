import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useVerifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: verifications, isLoading } = useQuery({
    queryKey: ['verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_submissions')
        .select(`
          *,
          profiles(id, display_name, city, user_id)
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ submissionId, profileId }: { submissionId: string; profileId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update submission status
      const { error: submissionError } = await supabase
        .from('verification_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', submissionId);
      
      if (submissionError) throw submissionError;
      
      // Mark profile as verified
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', profileId);
      
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      toast({ title: 'Verifizierung genehmigt', description: 'Das Profil wurde erfolgreich verifiziert.' });
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ submissionId, note }: { submissionId: string; note?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('verification_submissions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_note: note
        })
        .eq('id', submissionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Verifizierung abgelehnt', description: 'Die Verifizierung wurde abgelehnt.' });
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    }
  });

  return {
    verifications,
    isLoading,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending
  };
};
