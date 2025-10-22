import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { useCategoryProfiles } from '@/hooks/useProfiles';
import { useCategoryBySlug } from '@/hooks/useCategories';
import { SEO } from '@/components/SEO';

const categoryData: Record<string, { name: string; intro: string }> = {
  freelancer: {
    name: 'Freelancer',
    intro: 'Unabhängige Freelancer mit verifizierten Profilen. Direkte Kontaktaufnahme, flexible Terminvereinbarung und höchste Diskretion garantiert.',
  },
  agenturen: {
    name: 'Agenturen',
    intro: 'Professionelle Agenturen mit geprüften Referenzen. Zuverlässige Vermittlung und qualifizierte Beratung für Ihre Bedürfnisse.',
  },
  studios: {
    name: 'Studios',
    intro: 'Etablierte Studios mit verifizierten Standorten. Gepflegte Räumlichkeiten und professioneller Service in diskreter Atmosphäre.',
  },
  lifestyle: {
    name: 'Lifestyle',
    intro: 'Lifestyle-Angebote für besondere Anlässe. Von Event-Begleitung bis zu persönlichen Services – stilvoll und seriös.',
  },
  events: {
    name: 'Events',
    intro: 'Event-Begleitung für private und geschäftliche Anlässe. Kompetente und stilvolle Begleitung für jeden Anlass.',
  },
  service: {
    name: 'Service',
    intro: 'Vielfältige Service-Angebote mit Qualitätsgarantie. Von individueller Betreuung bis zu massgeschneiderten Lösungen.',
  },
};

const Kategorie = () => {
  const { slug } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: category, isLoading: loadingCategory } = useCategoryBySlug(slug);
  const { data: categoryProfiles = [], isLoading: loadingProfiles } = useCategoryProfiles(category?.id);
  
  // Fallback to hardcoded intro texts
  const data = slug && categoryData[slug] ? categoryData[slug] : null;

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
        title={`${category?.name || data?.name} - Verifizierte Profile in der Schweiz`}
        description={data?.intro || `Finde verifizierte ${category?.name || data?.name} Profile in der Schweiz`}
        url={`https://escoria.ch/kategorie/${slug}`}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">
            Kategorie: {category?.name || data?.name} – verifizierte Profile
          </h1>
          <p className="text-muted-foreground mb-8 max-w-3xl">{data?.intro}</p>

          {loadingProfiles ? (
            <p className="text-center text-muted-foreground py-12">Lade Profile...</p>
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
