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
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-start gap-4">
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={profile.display_name}
            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
            {profile.display_name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-lg">{profile.display_name}, {profile.age}</h3>
            {profile.verified_at && (
              <Badge variant="outline" className="bg-success/10 text-success border-success">
                Verifiziert
              </Badge>
            )}
            {profile.is_premium && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                VIP
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">
              {profile.city}, {profile.canton}
            </p>
            {distance && (
              <Badge variant="secondary" className="text-xs">
                {distance} km
              </Badge>
            )}
          </div>
          <p className="text-sm mb-3 line-clamp-2">{profile.about_me || 'Keine Beschreibung verfügbar'}</p>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/profil/${profile.slug}`}>
              <button className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-sm hover:bg-primary/90">
                Profil ansehen
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
