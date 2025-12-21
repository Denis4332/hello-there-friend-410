/**
 * VirtualizedProfileGrid Component
 * 
 * Performance-optimized profile grid using @tanstack/react-virtual
 * Only renders visible profiles to reduce DOM nodes and improve performance
 * 
 * Grid layout:
 * Mobile (< 768px): 2 columns
 * Tablet (≥ 768px): 3 columns
 * Desktop (≥ 1024px): 4 columns
 * XL Desktop (≥ 1280px): 5 columns
 * 2XL Desktop (≥ 1536px): 6 columns
 */
import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ProfileCard } from '@/components/ProfileCard';
import { BannerDisplay } from '@/components/BannerDisplay';
import { ProfileWithRelations } from '@/types/common';
import { useIsMobile } from '@/hooks/use-mobile';

interface VirtualizedProfileGridProps {
  profiles: ProfileWithRelations[];
  title?: string;
  noProfilesText?: string;
}

// Get number of columns based on screen width
const useColumns = () => {
  const isMobile = useIsMobile();
  
  // For SSR/initial render, check window width
  if (typeof window === 'undefined') return 2;
  
  const width = window.innerWidth;
  if (width >= 1536) return 6; // 2xl
  if (width >= 1280) return 5; // xl
  if (width >= 1024) return 4; // lg
  if (width >= 768) return 3;  // md
  return 2; // mobile
};

export const VirtualizedProfileGrid = ({
  profiles,
  title,
  noProfilesText,
}: VirtualizedProfileGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = useColumns();
  
  // Calculate rows from profiles
  const rows = useMemo(() => {
    const result: Array<{ type: 'profiles' | 'banner'; profiles?: ProfileWithRelations[] }> = [];
    const chunkSize = 8; // Show banner every 8 profiles
    
    for (let i = 0; i < profiles.length; i += chunkSize) {
      const chunk = profiles.slice(i, i + chunkSize);
      
      // Split chunk into rows based on columns
      for (let j = 0; j < chunk.length; j += columns) {
        result.push({
          type: 'profiles',
          profiles: chunk.slice(j, j + columns),
        });
      }
      
      // Add banner after each chunk (except the last)
      if (i + chunkSize < profiles.length) {
        result.push({ type: 'banner' });
      }
    }
    
    return result;
  }, [profiles, columns]);
  
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => rows[index].type === 'banner' ? 120 : 650, // Profile card height + gap
    overscan: 3, // Render 3 extra rows above/below viewport
  });

  if (profiles.length === 0) {
    return (
      <section className="py-12 bg-muted">
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
          <h2 className="text-2xl font-bold mb-6">{title || 'Aktuelle Profile'}</h2>
          <p className="text-muted-foreground">{noProfilesText || 'Keine Profile verfügbar'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-muted">
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
        <h2 className="text-2xl font-bold mb-6">{title || 'Aktuelle Profile'}</h2>
        
        <div
          ref={parentRef}
          className="w-full overflow-auto"
          style={{ height: Math.min(rows.length * 650, 2000) }} // Cap max height
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              
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
                  {row.type === 'banner' ? (
                    <div className="py-4">
                      <BannerDisplay position="grid" className="w-full" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                      {row.profiles?.map((profile, idx) => (
                        <ProfileCard
                          key={profile.id}
                          profile={profile}
                          priority={virtualRow.index === 0 && idx < 4}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
