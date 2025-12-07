import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { useCities } from '@/hooks/useCities';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SEO } from '@/components/SEO';

const Cities = () => {
  const { data: cities = [], isLoading } = useCities();
  const { getSetting } = useSiteSettingsContext();

  const seoTitle = getSetting('seo_cities_title');
  const seoDescription = getSetting('seo_cities_description');
  const pageTitle = getSetting('cities_page_title');
  const pageDescription = getSetting('cities_page_subtitle');
  const loadingText = getSetting('cities_loading_text');
  const emptyText = getSetting('cities_empty_text');
  
  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={seoTitle || pageTitle || 'Alle Städte'}
        description={seoDescription || pageDescription || 'Finden Sie verifizierte Anbieter in Ihrer Region'}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Städte' }]} />
          <h1 className="text-3xl font-bold mb-4">{pageTitle || 'Alle Städte'}</h1>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            {pageDescription || 'Finden Sie verifizierte Anbieter in Ihrer Region. Wählen Sie eine Stadt aus, um alle verfügbaren Profile anzuzeigen.'}
          </p>

          {isLoading ? (
            <p className="text-muted-foreground">{loadingText || 'Lade Städte...'}</p>
          ) : cities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cities.map((city) => (
                <Link key={city.slug} to={`/stadt/${city.slug}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-6 text-center">
                      <h3 className="font-bold text-lg">{city.name}</h3>
                      <p className="text-sm text-muted-foreground">{city.canton?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{city.postal_code || '-'}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{emptyText || 'Keine Städte verfügbar'}</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cities;