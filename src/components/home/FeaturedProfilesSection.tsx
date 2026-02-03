/**
 * IMPORTANT: Profile Card Grid Layout Standard
 * Mobile (< 768px): 2 columns (grid-cols-2)
 * Tablet (≥ 768px): 3 columns (md:grid-cols-3)
 * Desktop (≥ 1024px): 4 columns (lg:grid-cols-4)
 * XL Desktop (≥ 1280px): 5 columns (xl:grid-cols-5)
 * 2XL Desktop (≥ 1536px): 6 columns (2xl:grid-cols-6)
 * 
 * DO NOT change this to grid-cols-1 on mobile!
 * 
 * NOTE: Profiles are expected to be PRE-SORTED by the parent component.
 * No additional sorting is done here to avoid duplicate sorting overhead.
 * 
 * PERFORMANCE: useFavorites is called ONCE here instead of 24x in ProfileCard
 */
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { Pagination } from '@/components/Pagination';
import { ProfileWithRelations } from '@/types/common';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

interface FeaturedProfilesSectionProps {
  profiles: ProfileWithRelations[];
  isLoading: boolean;
  title?: string;
  loadingText?: string;
  noProfilesText?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const FeaturedProfilesSection = ({
  profiles,
  isLoading,
  title,
  noProfilesText,
  currentPage,
  totalPages,
  onPageChange,
}: FeaturedProfilesSectionProps) => {
  // PERFORMANCE: Single hook call for all 24 cards instead of 24 separate calls
  const { favorites, toggleFavorite, isToggling } = useFavorites();
  const { user } = useAuth();
  
  // Profiles are PRE-SORTED by parent - no sorting here to avoid duplication

  // First 4 profiles get priority loading (above-the-fold on most screens)
  const getPriority = (index: number): boolean => {
    return index < 4;
  };

  return (
    <section 
      className="py-12 bg-muted"
    >
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
        <h2 className="text-2xl font-bold mb-6">{title || 'Aktuelle Profile'}</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : profiles.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
              {profiles.map((profile, index) => (
                <ProfileCard 
                  key={profile.id} 
                  profile={profile} 
                  priority={getPriority(index)}
                  isFavorite={favorites.includes(profile.id)}
                  onToggleFavorite={toggleFavorite}
                  isTogglingFavorite={isToggling}
                  currentUserId={user?.id}
                />
              ))}
            </div>
            
            {/* Pagination - nur wenn mehr als 1 Seite */}
            {totalPages && totalPages > 1 && onPageChange && (
              <Pagination
                currentPage={currentPage || 1}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">{noProfilesText || 'Keine Profile verfügbar'}</p>
        )}
      </div>
    </section>
  );
};
