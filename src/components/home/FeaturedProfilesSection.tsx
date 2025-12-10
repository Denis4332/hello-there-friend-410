/**
 * IMPORTANT: Profile Card Grid Layout Standard
 * Mobile (< 768px): 2 columns (grid-cols-2)
 * Tablet (≥ 768px): 3 columns (md:grid-cols-3)
 * Desktop (≥ 1024px): 4 columns (lg:grid-cols-4)
 * 
 * DO NOT change this to grid-cols-1 on mobile!
 * 
 * NOTE: Profiles are expected to be PRE-SORTED by the parent component.
 * No additional sorting is done here to avoid duplicate sorting overhead.
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
  // Profiles are PRE-SORTED by parent - no sorting here to avoid duplication
  
  // Split profiles into chunks of 8
  const chunkSize = 8;
  const chunks = [];
  for (let i = 0; i < profiles.length; i += chunkSize) {
    chunks.push(profiles.slice(i, i + chunkSize));
  }

  // First 4 profiles get priority loading (above-the-fold on most screens)
  const getPriority = (chunkIndex: number, indexInChunk: number): boolean => {
    return chunkIndex === 0 && indexInChunk < 4;
  };

  // Calculate min-height to prevent CLS: ~500px per row of 2 cards on mobile
  const estimatedRows = Math.ceil(profiles.length / 2);
  const minHeight = isLoading ? 1200 : Math.max(600, estimatedRows * 520);

  return (
    <section 
      className="py-12 bg-muted content-visibility-auto-large"
      style={{ minHeight: `${minHeight}px` }}
    >
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">{title || 'Aktuelle Profile'}</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : profiles.length > 0 ? (
          <div className="space-y-8">
            {chunks.map((chunk, chunkIndex) => (
              <div key={`chunk-${chunkIndex}`}>
                {/* Grid for up to 8 profiles */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {chunk.map((profile, indexInChunk) => (
                    <ProfileCard 
                      key={profile.id} 
                      profile={profile} 
                      priority={getPriority(chunkIndex, indexInChunk)}
                    />
                  ))}
                </div>
                
                {/* Banner AFTER each grid (except the last one) */}
                {chunkIndex < chunks.length - 1 && (
                  <div className="mt-8">
                    <BannerDisplay position="grid" className="w-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">{noProfilesText || 'Keine Profile verfügbar'}</p>
        )}
      </div>
    </section>
  );
};
