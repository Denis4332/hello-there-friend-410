import { useState } from 'react';
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
import { AdvertisementCTA } from '@/components/AdvertisementCTA';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';

const Stadt = () => {
  const { slug } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: city, isLoading: loadingCity } = useCityBySlug(slug || '');
  const { data: cityProfiles = [], isLoading: loadingProfiles } = useCityProfiles(city?.name);

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

  // Pagination (24 items per page)
  const ITEMS_PER_PAGE = 24;
  const totalPages = Math.ceil(cityProfiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = cityProfiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={`Escort ${city.name} - Verifizierte Profile & Agenturen`}
        description={city.intro_text || `Finde verifizierte Profile in ${city.name}`}
        url={`https://escoria.ch/stadt/${slug}`}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
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
