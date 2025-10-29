import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCardProps {
  profile: any; // Using any for now since we get DB schema
  distance?: number; // Distance in km (from GPS search)
}

export const ProfileCard = ({ profile, distance }: ProfileCardProps) => {
  // Get primary photo
  const primaryPhoto = profile.photos?.find((p: any) => p.is_primary) || profile.photos?.[0];
  const photoUrl = primaryPhoto 
    ? supabase.storage.from('profile-photos').getPublicUrl(primaryPhoto.storage_path).data.publicUrl
    : null;
  
  return (
    <Link to={`/profil/${profile.slug}`} className="block group">
      <div className="bg-card border rounded-lg p-4 hover:shadow-lg transition-all duration-200 group-hover:scale-[1.01]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-shrink-0 mx-auto md:mx-0">
            {photoUrl ? (
              <img 
                src={photoUrl} 
                alt={profile.display_name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-lg object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 bg-muted rounded-lg flex items-center justify-center text-3xl font-bold">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {profile.verified_at && (
                <Badge variant="secondary" className="bg-blue-500 text-white text-xs shadow-md">
                  ✓ Verifiziert
                </Badge>
              )}
              {profile.is_premium && (
                <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs shadow-md">
                  ⭐ VIP
                </Badge>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="mb-2">
              <h3 className="font-bold text-xl truncate">
                {profile.display_name}, {profile.age}
              </h3>
              <p className="text-sm text-muted-foreground">
                📍 {profile.city}, {profile.canton}
                {distance !== undefined && ` • ${distance.toFixed(1)} km entfernt`}
              </p>
            </div>
            {profile.about_me && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                {profile.about_me}
              </p>
            )}
            <button className="w-full mt-auto bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90 transition-colors">
              Profil ansehen
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};
