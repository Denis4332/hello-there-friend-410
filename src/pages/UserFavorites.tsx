import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { useFavorites } from '@/hooks/useFavorites';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const UserFavorites = () => {
  const { user } = useAuth();
  const { getSetting } = useSiteSettingsContext();
  const seoTitle = getSetting('seo_favorites_title', 'Favoriten');
  const { favorites, toggleFavorite, isToggling } = useFavorites();
  
  const { data: favoriteProfiles = [], isLoading } = useQuery({
    queryKey: ['favorite-profiles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: favorites, error: favError } = await supabase
        .from('user_favorites')
        .select('profile_id')
        .eq('user_id', user.id);
      
      if (favError) throw favError;
      if (!favorites || favorites.length === 0) return [];
      
      const profileIds = favorites.map(f => f.profile_id);
      
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select(`
          id, slug, display_name, age, gender, city, canton, postal_code,
          lat, lng, about_me, languages, verified_at, status, 
          listing_type, premium_until, top_ad_until, created_at,
          photos(storage_path, is_primary),
          profile_categories(
            categories(id, name, slug)
          )
        `)
        .in('id', profileIds)
        .eq('status', 'active');
      
      if (profError) throw profError;
      return profiles || [];
    },
    enabled: !!user,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <SEO title={seoTitle || 'Favoriten'} description="Deine gespeicherten Profile" />
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            <h1 className="text-3xl font-bold">Meine Favoriten</h1>
          </div>
          <p className="text-muted-foreground">
            Hier findest du alle Profile, die du gespeichert hast
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : favoriteProfiles.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Noch keine Favoriten</h2>
            <p className="text-muted-foreground mb-6">
              Speichere Profile, indem du auf das Herz-Icon klickst
            </p>
            <Button asChild>
              <Link to="/suche">Profile durchsuchen</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favoriteProfiles.map((profile: any) => (
              <ProfileCard 
                key={profile.id} 
                profile={profile}
                isFavorite={favorites.includes(profile.id)}
                onToggleFavorite={toggleFavorite}
                isTogglingFavorite={isToggling}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default UserFavorites;
