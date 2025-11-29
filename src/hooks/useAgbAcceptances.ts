import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AgbAcceptance {
  id: string;
  user_id: string | null;
  email: string;
  profile_id: string | null;
  accepted_at: string;
  acceptance_type: 'registration' | 'profile_creation' | 'admin_created';
  ip_address: string | null;
  user_agent: string | null;
  agb_version: string;
  created_by_admin: boolean;
}

export const useAgbAcceptances = (profileId?: string) => {
  return useQuery({
    queryKey: ['agb-acceptances', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('agb_acceptances')
        .select('*')
        .eq('profile_id', profileId)
        .order('accepted_at', { ascending: false });
      
      if (error) throw error;
      return data as AgbAcceptance[];
    },
    enabled: !!profileId,
  });
};

export const useAgbAcceptancesByUserId = (userId?: string) => {
  return useQuery({
    queryKey: ['agb-acceptances-user', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('agb_acceptances')
        .select('*')
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false });
      
      if (error) throw error;
      return data as AgbAcceptance[];
    },
    enabled: !!userId,
  });
};

// Helper function to record AGB acceptance
export const recordAgbAcceptance = async (params: {
  userId?: string;
  email: string;
  profileId?: string;
  acceptanceType: 'registration' | 'profile_creation' | 'admin_created';
  createdByAdmin?: boolean;
  agbVersion?: string;
}) => {
  const { data, error } = await supabase
    .from('agb_acceptances')
    .insert({
      user_id: params.userId || null,
      email: params.email,
      profile_id: params.profileId || null,
      acceptance_type: params.acceptanceType,
      created_by_admin: params.createdByAdmin || false,
      agb_version: params.agbVersion || '1.0',
      user_agent: navigator.userAgent,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
