import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileCardSkeletonComponent = () => {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg border bg-card">
      {/* Image Skeleton - aspect-[4/5] to match ProfileCard */}
      <div className="relative w-full aspect-[4/5] flex-shrink-0">
        <Skeleton className="w-full h-full" />
      </div>
      
      {/* Info Bar Skeleton - h-[200px] to match ProfileCard */}
      <div className="p-4 bg-card flex flex-col gap-3 h-[200px]">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      </div>
    </div>
  );
};

export const ProfileCardSkeleton = memo(ProfileCardSkeletonComponent);
