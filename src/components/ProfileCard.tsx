import { memo } from 'react';
import { Link } from 'react-router-dom';
import { usePrefetch } from '@/hooks/usePrefetch';
import { Crown, CheckCircle2, Tag, MapPin, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ResponsiveImage } from '@/components/ResponsiveImage';
import { useFavorites } from '@/hooks/useFavorites';
import type { Profile, Photo } from '@/types/dating';

interface ProfileCardProps {
  profile: Profile & {
    slug?: string;
    photos?: Photo[];
    profile_categories?: Array<{
      categories: {
        name: string;
      };
    }>;
    listing_type?: string;
    premium_until?: string | null;
    top_ad_until?: string | null;
    street_address?: string;
    show_street?: boolean;
    availability_status?: string;
  };
  distance?: number;
}

const ProfileCardComponent = ({ profile, distance }: ProfileCardProps) => {
  const primaryPhoto = profile.photos?.find((p) => p.is_primary) || profile.photos?.[0];
  const photoUrl = primaryPhoto 
    ? supabase.storage.from('profile-photos').getPublicUrl(primaryPhoto.storage_path).data.publicUrl
    : null;
  
  const isTop = profile.listing_type === 'top';
  const isPremium = profile.listing_type === 'premium' || profile.listing_type === 'top';
  const isOnline = profile.availability_status === 'online';

  // Prefetch profile page on hover for faster navigation
  const profileUrl = `/profil/${profile.slug}`;
  const { handleMouseEnter, handleMouseLeave } = usePrefetch([profileUrl], {
    delay: 100,
    onHover: true,
  });

  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(profile.id);
  };

  return (
    <Link 
      to={profileUrl}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex flex-col h-full group overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl active:shadow-md bg-card touch-manipulation",
        isTop && "border-2 border-red-500/60 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:scale-[1.02]",
        isPremium && !isTop && "border-2 border-amber-500/60 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02]",
        !isTop && !isPremium && "border border-border/40 hover:border-primary/40 hover:scale-[1.01]"
      )}
    >
      {/* TOP AD Banner */}
      {isTop && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-bold py-1.5 text-center z-20 animate-pulse">
          ⭐ TOP INSERAT ⭐
        </div>
      )}
      
      <div className="relative w-full flex-shrink-0" style={{ paddingBottom: '125%' }}>
        {photoUrl ? (
          <ResponsiveImage
            src={photoUrl}
            alt={profile.display_name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-muted flex items-center justify-center">
            <span className="text-6xl font-bold text-muted-foreground">
              {profile.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Online Badge - Top Right */}
        {isOnline && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg z-10">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Online
          </div>
        )}

        {/* Favorite Heart - Top Right (below online badge if present) */}
        <button
          onClick={handleFavoriteClick}
          disabled={isToggling}
          className={cn(
            "absolute right-2 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95",
            isOnline ? "top-12" : "top-2"
          )}
          aria-label={isFavorite(profile.id) ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
        >
          <Heart 
            className={cn(
              "h-5 w-5 transition-colors",
              isFavorite(profile.id) ? "fill-red-500 text-red-500" : "text-gray-600"
            )}
          />
        </button>

        {/* Badges - Top Left */}
        <div className={cn(
          "absolute left-3 flex gap-3 z-10",
          isTop ? "top-9" : "top-3"
        )}>
          {isTop && (
            <div className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-xl animate-pulse">
              <Crown className="h-4 w-4" />
              TOP 🔥
            </div>
          )}
          {isPremium && !isTop && (
            <div className="flex items-center gap-1.5 bg-amber-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-xl">
              <Crown className="h-4 w-4" />
              VIP ⭐
            </div>
          )}
          {profile.verified_at && (
            <div className="flex items-center justify-center bg-blue-500 text-white p-1.5 rounded-full shadow-xl">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
      
      {/* White Info Bar */}
      <div className="p-4 bg-card flex flex-col gap-3 min-h-[200px] max-h-[200px] overflow-hidden flex-shrink-0">
        <div className="flex flex-col gap-2">
          {profile.profile_categories?.[0]?.categories && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              <span>{profile.profile_categories[0].categories.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {profile.show_street && profile.street_address 
                ? `${profile.street_address}, ${profile.city}` 
                : `${profile.city}, ${profile.canton}`}
              {distance !== undefined && ` • ${distance.toFixed(1)} km`}
            </span>
          </div>
        </div>
        <h3 className="text-lg font-bold text-foreground line-clamp-1">
          {profile.display_name}
        </h3>
        {profile.about_me && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {profile.about_me}
          </p>
        )}
      </div>
    </Link>
  );
};

export const ProfileCard = memo(ProfileCardComponent);
