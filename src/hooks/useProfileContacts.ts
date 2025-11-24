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
 * Returns data for all active profiles (public access)
 * SECURITY: Contact data is protected by RLS policies
 */
export const useProfileContacts = (profileId: string | undefined) => {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['profile-contacts', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      // SECURITY: RLS policies ensure data access rules (public for active profiles)
      const { data, error } = await supabase
        .from('profile_contacts' as any)
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        // If error is "not found" or "policy violation", return null
        if (error.code === 'PGRST116' || error.code === '42501') {
          return null;
        }
        throw error;
      }

      return (data as unknown) as ProfileContacts | null;
    },
    enabled: !!profileId, // Run for all users (public access for active profiles)
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
