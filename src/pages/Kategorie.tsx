import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { useCategoryProfiles } from '@/hooks/useProfiles';
import { useCategoryBySlug } from '@/hooks/useCategories';
import { SEO } from '@/components/SEO';
import { BannerDisplay } from '@/components/BannerDisplay';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { sortProfilesByListingType } from '@/lib/profileUtils';
import { useRotationKey } from '@/hooks/useRotationKey';
import { useProfilesRealtime } from '@/hooks/useProfilesRealtime';
import { useAdvertisementsRealtime } from '@/hooks/useAdvertisementsRealtime';

const Kategorie = () => {
  useProfilesRealtime(); // Listen for realtime profile changes
  useAdvertisementsRealtime(); // Listen for realtime banner changes
  const rotationKey = useRotationKey(); // Auto-rotate every 30 minutes
  const { slug } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: category, isLoading: loadingCategory } = useCategoryBySlug(slug);
  const { data: categoryProfiles = [], isLoading: loadingProfiles } = useCategoryProfiles(category?.id);

  if (!category && !loadingCategory) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Kategorie nicht gefunden</h1>
            <Link to="/kategorien">
              <Button>Alle Kategorien anzeigen</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Sort profiles: TOP > Premium > Basic > Verified > Newest (rotates every 30min)
  const sortedProfiles = useMemo(() => {
    return sortProfilesByListingType(categoryProfiles, rotationKey);
  }, [categoryProfiles, rotationKey]);

  // Pagination (24 items per page)
  const ITEMS_PER_PAGE = 24;
  const totalPages = Math.ceil(sortedProfiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = sortedProfiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={`${category?.name} - Verifizierte Profile in der Schweiz`}
        description={category?.intro_text || `Finde verifizierte ${category?.name} Profile in der Schweiz`}
        url={`https://escoria.ch/kategorie/${slug}`}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
          <Breadcrumbs 
            items={[
              { label: 'Kategorien', href: '/kategorien' },
              { label: category?.name || '' }
            ]}
          />
          <h1 className="text-3xl font-bold mb-4">
            Kategorie: {category?.name} – verifizierte Profile
          </h1>
          {category?.intro_text && (
            <p className="text-muted-foreground mb-8 max-w-3xl">{category.intro_text}</p>
          )}

          <BannerDisplay position="top" className="mb-8" />

          {loadingProfiles ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProfileCardSkeleton key={i} />
              ))}
            </div>
          ) : paginatedProfiles.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                {paginatedProfiles.map((profile, index) => (
                  <ProfileCard key={profile.id} profile={profile} priority={index < 4} />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              Derzeit keine Profile in dieser Kategorie verfügbar.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Kategorie;
