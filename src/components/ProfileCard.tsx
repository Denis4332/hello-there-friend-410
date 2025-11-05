import { Link } from 'react-router-dom';
import { Crown, CheckCircle2, Tag, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  profile: any;
  distance?: number;
}

export const ProfileCard = ({ profile, distance }: ProfileCardProps) => {
  const primaryPhoto = profile.photos?.find((p: any) => p.is_primary) || profile.photos?.[0];
  const photoUrl = primaryPhoto 
    ? supabase.storage.from('profile-photos').getPublicUrl(primaryPhoto.storage_path).data.publicUrl
    : null;
  
  const listingType = profile.listing_type || 'free';
  const isTop = listingType === 'top';
  const isPremium = listingType === 'premium' || isTop;
  const isBasic = listingType === 'basic';

  return (
    <Link 
      to={`/profil/${profile.slug}`} 
      className={cn(
        "block group overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl bg-card",
        isTop && "border-2 border-red-500 shadow-lg shadow-red-500/30 hover:scale-[1.03]",
        isPremium && !isTop && "border-2 border-amber-400 shadow-lg shadow-amber-400/20 hover:scale-[1.02]",
        isBasic && "border-2 border-blue-400/50 hover:scale-[1.01]",
        !isTop && !isPremium && !isBasic && "border hover:scale-[1.01]"
      )}
    >
      {/* TOP AD Banner */}
      {isTop && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs font-bold py-1.5 text-center z-20 animate-pulse">
          ⭐ TOP INSERAT ⭐
        </div>
      )}
      
      <div className={cn(
        "relative w-full aspect-[4/5]",
        isTop && "mt-6"
      )}>
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={profile.display_name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
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
            <div className="flex items-center gap-1.5 bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-xl">
              <CheckCircle2 className="h-4 w-4" />
              VERIFIZIERT
            </div>
          )}
        </div>
      </div>
      
      {/* White Info Bar */}
      <div className="p-3 bg-card">
        <div className="flex flex-col gap-1.5 mb-2">
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
