import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch all favorites for current user
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_favorites')
        .select('profile_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data?.map(f => f.profile_id) || [];
    },
    enabled: !!user,
  });
  
  // Toggle favorite (add/remove)
  const toggleFavorite = useMutation({
    mutationFn: async (profileId: string) => {
      if (!user) {
        toast.error('Bitte melde dich an, um Profile zu speichern');
        throw new Error('Not authenticated');
      }
      
      const isFavorite = favorites.includes(profileId);
      
      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('profile_id', profileId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, profile_id: profileId });
        
        if (error) throw error;
      }
      
      return isFavorite;
    },
    onSuccess: (wasRemoved) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(wasRemoved ? 'Favorit entfernt' : 'Zu Favoriten hinzugefügt');
    },
    onError: (error) => {
      console.error('Toggle favorite error:', error);
      toast.error('Fehler beim Speichern');
    },
  });
  
  const isFavorite = (profileId: string) => favorites.includes(profileId);
  
  return { 
    favorites, 
    isLoading,
    toggleFavorite: toggleFavorite.mutate, 
    isFavorite,
    isToggling: toggleFavorite.isPending,
  };
};
