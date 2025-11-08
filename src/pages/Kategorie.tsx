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
import { AdvertisementCTA } from '@/components/AdvertisementCTA';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const Kategorie = () => {
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

  // Pagination (24 items per page)
  const ITEMS_PER_PAGE = 24;
  const totalPages = Math.ceil(categoryProfiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = categoryProfiles.slice(
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
        <div className="container mx-auto px-4">
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

          <AdvertisementCTA position="grid" className="mb-8" />

          {loadingProfiles ? (
            <div className="grid md:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProfileCardSkeleton key={i} />
              ))}
            </div>
          ) : paginatedProfiles.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {paginatedProfiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
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
