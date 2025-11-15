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
        "relative flex flex-col group overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl active:shadow-md bg-card touch-manipulation",
        isTop && "border-4 border-red-500 shadow-2xl shadow-red-500/50 hover:scale-[1.04] active:scale-[1.02] ring-2 ring-red-300 ring-offset-2",
        isPremium && !isTop && "border-3 border-amber-400 shadow-xl shadow-amber-400/30 hover:scale-[1.03] active:scale-[1.01]",
        isBasic && "border-2 border-blue-400/50 hover:scale-[1.01] active:scale-100",
        !isTop && !isPremium && !isBasic && "border hover:scale-[1.01] active:scale-100"
      )}
    >
      {/* TOP AD Banner - Enhanced */}
      {isTop && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white text-sm font-extrabold py-2 text-center z-20 animate-pulse shadow-lg">
          <span className="inline-flex items-center gap-1.5">
            ⭐ TOP INSERAT ⭐
          </span>
        </div>
      )}
      
      <div className="relative w-full flex-shrink-0" style={{ paddingBottom: '125%' }}>
        {photoUrl ? (
          <ResponsiveImage
            src={photoUrl}
            alt={profile.display_name}
            sizes="(max-width: 640px) 400px, (max-width: 1024px) 600px, 800px"
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
        
        {/* Badges - Top Left */}
        <div className={cn(
          "absolute left-3 flex gap-3 z-10",
          isTop ? "top-9" : "top-3"
        )}>
          {isPremium && (
            <div className={cn(
              "flex items-center gap-1.5 text-white px-5 py-2 rounded-full text-base font-extrabold shadow-2xl border-2",
              isTop 
                ? "bg-gradient-to-r from-red-600 via-red-500 to-pink-600 animate-pulse border-yellow-300" 
                : "bg-gradient-to-r from-amber-400 via-pink-500 to-pink-600 border-amber-200"
            )}>
              <Crown className="h-5 w-5" />
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
