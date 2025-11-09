import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';

export const PageSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    <div className="h-16 bg-muted animate-pulse" />
    <div className="flex-1 container mx-auto px-4 py-8">
      <div className="h-8 bg-muted rounded w-1/3 mb-4 animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProfileCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);
