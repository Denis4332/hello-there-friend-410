import { Link } from 'react-router-dom';
import { Profile } from '@/types/escoria';
import { Badge } from '@/components/ui/badge';

interface ProfileCardProps {
  profile: Profile;
}

export const ProfileCard = ({ profile }: ProfileCardProps) => {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
          {profile.display_name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-lg">{profile.display_name}, {profile.age}</h3>
            {profile.verified && (
              <Badge variant="outline" className="bg-success/10 text-success border-success">
                Verifiziert
              </Badge>
            )}
            {profile.vip && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                VIP
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {profile.city}, {profile.canton}
          </p>
          <p className="text-sm mb-3 line-clamp-2">{profile.short_bio}</p>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/profil/${profile.slug}`}>
              <button className="bg-primary text-primary-foreground px-4 py-1.5 rounded text-sm hover:bg-primary/90">
                Profil ansehen
              </button>
            </Link>
            {profile.contact_phone && (
              <a href={`tel:${profile.contact_phone}`}>
                <button className="border border-input px-4 py-1.5 rounded text-sm hover:bg-accent">
                  Anrufen
                </button>
              </a>
            )}
            {profile.contact_whatsapp && (
              <a 
                href={`https://wa.me/${profile.contact_whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="border border-input px-4 py-1.5 rounded text-sm hover:bg-accent">
                  WhatsApp
                </button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
