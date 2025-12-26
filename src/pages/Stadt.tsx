import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { useCityProfiles } from '@/hooks/useProfiles';
import { useCityBySlug } from '@/hooks/useCities';
import { SEO } from '@/components/SEO';
import { BannerDisplay } from '@/components/BannerDisplay';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { useRotationKey } from '@/hooks/useRotationKey';
import { useProfilesRealtime } from '@/hooks/useProfilesRealtime';
import { useAdvertisementsRealtime } from '@/hooks/useAdvertisementsRealtime';

const ITEMS_PER_PAGE = 24;

const Stadt = () => {
  useProfilesRealtime();
  useAdvertisementsRealtime();
  const rotationKey = useRotationKey();
  const { slug } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: city, isLoading: loadingCity } = useCityBySlug(slug || '');
  
  // Server-side pagination mit Rotation
  const { data: cityData, isLoading: loadingProfiles } = useCityProfiles(
    city?.name,
    currentPage,
    ITEMS_PER_PAGE,
    rotationKey
  );
  
  const profiles = cityData?.profiles ?? [];
  const totalCount = cityData?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Reset auf Seite 1 bei Rotation-Änderung
  useEffect(() => {
    setCurrentPage(1);
  }, [rotationKey]);

  if (loadingCity || !city) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {loadingCity ? (
              <p className="text-muted-foreground">Lade Stadt...</p>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-4">Stadt nicht gefunden</h1>
                <Link to="/staedte">
                  <Button>Alle Städte anzeigen</Button>
                </Link>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={`${city.name} - Verifizierte Profile & Agenturen`}
        description={city.intro_text || `Finde verifizierte Profile in ${city.name}`}
        url={`https://escoria.ch/stadt/${slug}`}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
          <Breadcrumbs 
            items={[
              { label: 'Städte', href: '/staedte' },
              { label: city.name }
            ]}
          />
          <h1 className="text-3xl font-bold mb-4">
            Anbieter in {city.name} – verifizierte Profile & Agenturen
          </h1>
          {city.intro_text && (
            <p className="text-muted-foreground mb-8 max-w-3xl">{city.intro_text}</p>
          )}

          <BannerDisplay position="top" className="mb-8" />

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
              Derzeit keine Profile in {city.name} verfügbar.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Stadt;
