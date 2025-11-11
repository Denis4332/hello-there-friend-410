import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileContacts {
  id: string;
  profile_id: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
  website?: string;
  street_address?: string;
  show_street: boolean;
}

/**
 * Hook to fetch contact information for a profile
 * Only returns data if user is the owner or an admin
 * SECURITY: Contact data is protected by RLS policies
 */
export const useProfileContacts = (profileId: string | undefined) => {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['profile-contacts', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      // SECURITY: RLS policies ensure only owner/admin can access contact data
      const { data, error } = await supabase
        .from('profile_contacts' as any)
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        // If error is "not found" or "policy violation", user is not authorized
        if (error.code === 'PGRST116' || error.code === '42501') {
          return null;
        }
        throw error;
      }

      return (data as unknown) as ProfileContacts | null;
    },
    enabled: !!profileId, // Run for all visitors to show contact data
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
