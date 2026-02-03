import { memo } from 'react';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { Pagination } from '@/components/Pagination';
import type { ProfileWithRelations } from '@/types/common';

interface SearchResultsProps {
  profiles: ProfileWithRelations[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  noResultsText?: string;
}

const SearchResultsComponent = ({
  profiles,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  noResultsText,
}: SearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {Array.from({ length: 24 }).map((_, i) => (
          <ProfileCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          {noResultsText || 'Keine Profile gefunden. Versuche es mit anderen Suchkriterien.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {profiles.map((profile, index) => (
          <ProfileCard 
            key={profile.id} 
            profile={profile} 
            priority={index < 4}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
};

export const SearchResults = memo(SearchResultsComponent);
