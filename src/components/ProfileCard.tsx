import { memo } from 'react';
import { Link } from 'react-router-dom';
import { usePrefetch } from '@/hooks/usePrefetch';
import { Crown, CheckCircle2, Tag, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ResponsiveImage } from '@/components/ResponsiveImage';
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
    street_address?: string;
    show_street?: boolean;
  };
  distance?: number;
}

const ProfileCardComponent = ({ profile, distance }: ProfileCardProps) => {
  const primaryPhoto = profile.photos?.find((p) => p.is_primary) || profile.photos?.[0];
  const photoUrl = primaryPhoto 
    ? supabase.storage.from('profile-photos').getPublicUrl(primaryPhoto.storage_path).data.publicUrl
    : null;
  
  const listingType = profile.listing_type || 'basic';
  const isTop = listingType === 'top';
  const isPremium = listingType === 'premium' || isTop;
  const isBasic = listingType === 'basic';

  // Prefetch profile page on hover for faster navigation
  const profileUrl = `/profil/${profile.slug}`;
  const { handleMouseEnter, handleMouseLeave } = usePrefetch([profileUrl], {
    delay: 100,
    onHover: true,
  });

  return (
    <Link 
      to={profileUrl}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex flex-col h-full group overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl active:shadow-md bg-card touch-manipulation",
        isTop && "border-2 border-red-500 shadow-lg shadow-red-500/30 hover:scale-[1.03] active:scale-[1.01]",
        isPremium && !isTop && "border-2 border-amber-400 shadow-lg shadow-amber-400/20 hover:scale-[1.02] active:scale-100",
        isBasic && "border-2 border-blue-400/50 hover:scale-[1.01] active:scale-100",
        !isTop && !isPremium && !isBasic && "border hover:scale-[1.01] active:scale-100"
      )}
    >
      {/* TOP AD Banner */}
      {isTop && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-bold py-1.5 text-center z-20 animate-pulse">
          ⭐ TOP INSERAT ⭐
        </div>
      )}
      
      <div className={cn(
        "relative w-full aspect-[4/5] flex-shrink-0",
        isTop && "mt-6"
      )}>
        {photoUrl ? (
          <ResponsiveImage
            src={photoUrl}
            alt={profile.display_name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-6xl font-bold text-muted-foreground">
              {profile.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 flex gap-3 z-10">
          {isPremium && (
            <div className={cn(
              "flex items-center gap-1.5 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-xl",
              isTop 
                ? "bg-gradient-to-r from-red-600 to-pink-600 animate-pulse" 
                : "bg-gradient-to-r from-amber-400 via-pink-500 to-pink-600 animate-pulse"
            )}>
              <Crown className="h-4 w-4" />
              {isTop ? 'TOP' : 'VIP'}
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
      <div className="p-4 bg-card flex-1 flex flex-col justify-between min-h-[120px]">
        <div className="flex flex-col gap-2 mb-2">
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
        <h3 className="text-lg font-bold text-foreground mb-1">
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
