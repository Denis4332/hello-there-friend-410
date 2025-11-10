/**
 * IMPORTANT: Profile Card Grid Layout Standard
 * Mobile (< 768px): 2 columns (grid-cols-2)
 * Tablet (≥ 768px): 3 columns (md:grid-cols-3)
 * Desktop (≥ 1024px): 4 columns (lg:grid-cols-4)
 * 
 * DO NOT change this to grid-cols-1 on mobile!
 */
import { memo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { Pagination } from '@/components/Pagination';
import type { ProfileWithRelations } from '@/types/common';

interface SearchResultsVirtualizedProps {
  profiles: ProfileWithRelations[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  noResultsText?: string;
}

/**
 * Virtualized search results for better performance with large lists
 * Uses @tanstack/react-virtual for efficient rendering
 */
const SearchResultsVirtualizedComponent = ({
  profiles,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  noResultsText,
}: SearchResultsVirtualizedProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Calculate columns based on viewport
  const getColumnCount = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 768) return 2; // mobile: 2 columns
    if (width < 1024) return 3; // tablet: 3 columns
    return 4; // desktop: 4 columns
  };

  const columnCount = getColumnCount();
  const rowCount = Math.ceil(profiles.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 450, // Estimated row height (card height + gap)
    overscan: 2, // Render 2 extra rows above and below viewport
  });

  // Scroll to top when page changes
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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

  // For small lists (< 50 profiles), use normal rendering
  if (profiles.length < 50) {
    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
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
  }

  // Virtual scrolling for large lists (≥ 50 profiles)
  return (
    <>
      <div
        ref={parentRef}
        className="h-[calc(100vh-300px)] overflow-auto"
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * columnCount;
            const rowProfiles = profiles.slice(startIndex, startIndex + columnCount);

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 px-4">
                  {rowProfiles.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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

export const SearchResultsVirtualized = memo(SearchResultsVirtualizedComponent);
