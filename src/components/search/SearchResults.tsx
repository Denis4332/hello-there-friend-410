import { memo, useMemo } from 'react';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { Pagination } from '@/components/Pagination';
import { BannerDisplay } from '@/components/BannerDisplay';
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
  // Split profiles into chunks of 8 with grid banner between
  const profileChunks = useMemo(() => {
    const chunks: ProfileWithRelations[][] = [];
    for (let i = 0; i < profiles.length; i += 8) {
      chunks.push(profiles.slice(i, i + 8));
    }
    return chunks;
  }, [profiles]);

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
      {profileChunks.map((chunk, chunkIndex) => (
        <div key={chunkIndex}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {chunk.map((profile, index) => (
              <ProfileCard 
                key={profile.id} 
                profile={profile} 
                priority={chunkIndex === 0 && index < 4} 
              />
            ))}
          </div>
          
          {/* Grid banner after every 8 profiles (except after the last chunk) */}
          {chunkIndex < profileChunks.length - 1 && (
            <BannerDisplay position="grid" className="my-6" />
          )}
        </div>
      ))}
      
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
