import { Link } from 'react-router-dom';
import { Crown, CheckCircle2, Tag, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCardProps {
  profile: any;
  distance?: number;
}

export const ProfileCard = ({ profile, distance }: ProfileCardProps) => {
  const primaryPhoto = profile.photos?.find((p: any) => p.is_primary) || profile.photos?.[0];
  const photoUrl = primaryPhoto 
    ? supabase.storage.from('profile-photos').getPublicUrl(primaryPhoto.storage_path).data.publicUrl
    : null;
  
  return (
    <Link 
      to={`/profil/${profile.slug}`} 
      className="block group relative overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    >
      <div className="relative w-full aspect-[3/4]">
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
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          {profile.is_premium && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              <Crown className="h-3 w-3" />
              VIP
            </div>
          )}
          {profile.verified_at && (
            <div className="flex items-center gap-1 bg-blue-400 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              <CheckCircle2 className="h-3 w-3" />
            </div>
          )}
        </div>
        
        {/* Content - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
          <div className="flex flex-col gap-1.5 mb-2">
            {profile.profile_categories?.[0]?.categories && (
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <Tag className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-blue-400">{profile.profile_categories[0].categories.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <MapPin className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-blue-400">
                {profile.city}, {profile.canton}
                {distance !== undefined && ` • ${distance.toFixed(1)} km`}
              </span>
            </div>
          </div>
          <h3 className="text-xl font-bold mb-1.5">
            {profile.display_name}
          </h3>
          {profile.about_me && (
            <p className="text-xs opacity-90 line-clamp-2">
              {profile.about_me}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
