import { Skeleton } from '@/components/ui/skeleton';

export const ProfileDetailSkeleton = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Photo Gallery - Left Column */}
      <div className="lg:col-span-3">
        <div className="bg-card border rounded-lg overflow-hidden">
          <Skeleton className="w-full aspect-[3/4]" />
          <div className="p-4">
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
        </div>
      </div>

      {/* Profile Info - Right Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-5 w-64 mt-2" />
        </div>

        {/* About Me */}
        <div className="bg-card border rounded-lg p-6">
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </div>

        {/* Categories */}
        <div className="bg-card border rounded-lg p-6">
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="flex gap-2 flex-wrap">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>

        {/* Languages */}
        <div className="bg-card border rounded-lg p-6">
          <Skeleton className="h-6 w-24 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card border rounded-lg p-6">
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
};
