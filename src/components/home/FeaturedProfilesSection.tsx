/**
 * IMPORTANT: Profile Card Grid Layout Standard
 * Mobile (< 768px): 2 columns (grid-cols-2)
 * Tablet (≥ 768px): 3 columns (md:grid-cols-3)
 * Desktop (≥ 1024px): 4 columns (lg:grid-cols-4)
 * 
 * DO NOT change this to grid-cols-1 on mobile!
 */
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { BannerDisplay } from '@/components/BannerDisplay';
import { ProfileWithRelations } from '@/types/common';

interface FeaturedProfilesSectionProps {
  profiles: ProfileWithRelations[];
  isLoading: boolean;
  title?: string;
  loadingText?: string;
  noProfilesText?: string;
}

export const FeaturedProfilesSection = ({
  profiles,
  isLoading,
  title,
  noProfilesText,
}: FeaturedProfilesSectionProps) => {
  return (
    <section className="py-12 bg-muted content-visibility-auto">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">{title || 'Aktuelle Profile'}</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-fr">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : profiles.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-fr">
            {profiles.map((profile, index) => (
              <>
                <ProfileCard key={profile.id} profile={profile} />
                {(index + 1) % 8 === 0 && (
                  <div className="col-span-2 md:col-span-3 lg:col-span-4">
                    <BannerDisplay position="grid" className="w-full" />
                  </div>
                )}
              </>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{noProfilesText || 'Keine Profile verfügbar'}</p>
        )}
      </div>
    </section>
  );
};
