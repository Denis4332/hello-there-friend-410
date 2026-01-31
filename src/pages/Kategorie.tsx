import { useState, useEffect } from 'react';
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
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { useRotationKey } from '@/hooks/useRotationKey';

const ITEMS_PER_PAGE = 24;

const Kategorie = () => {
  // Realtime entfernt - Snapshot reicht für Kategorie-Seiten (SAFE WIN aus Audit)
  const rotationKey = useRotationKey();
  const { slug } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: category, isLoading: loadingCategory } = useCategoryBySlug(slug);
  
  // Server-side pagination mit Rotation
  const { data: categoryData, isLoading: loadingProfiles } = useCategoryProfiles(
    category?.id,
    currentPage,
    ITEMS_PER_PAGE,
    rotationKey
  );
  
  const profiles = categoryData?.profiles ?? [];
  const totalCount = categoryData?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Reset auf Seite 1 bei Rotation-Änderung
  useEffect(() => {
    setCurrentPage(1);
  }, [rotationKey]);

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

          {loadingProfiles ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProfileCardSkeleton key={i} />
              ))}
            </div>
          ) : profiles.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
                {profiles.map((profile, index) => (
                  <ProfileCard key={profile.id} profile={profile} priority={index < 4} />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
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
