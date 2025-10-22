import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { useAllCities } from '@/hooks/useProfiles';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const Cities = () => {
  const { data: cities = [], isLoading } = useAllCities();
  const { data: citiesTitle } = useSiteSetting('cities_title');
  const { data: citiesDescription } = useSiteSetting('cities_description');
  const { data: citiesLoading } = useSiteSetting('cities_loading');
  const { data: citiesEmpty } = useSiteSetting('cities_empty');
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">{citiesTitle || 'Alle Städte'}</h1>
          <p className="text-muted-foreground mb-8 max-w-3xl">
            {citiesDescription || 'Finden Sie verifizierte Anbieter in Ihrer Region. Wählen Sie eine Stadt aus, um alle verfügbaren Profile anzuzeigen.'}
          </p>

          {isLoading ? (
            <p className="text-muted-foreground">{citiesLoading || 'Lade Städte...'}</p>
          ) : cities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cities.map((city) => (
                <Link key={city.slug} to={`/stadt/${city.slug}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-6 text-center">
                      <h3 className="font-bold text-lg">{city.city}</h3>
                      <p className="text-sm text-muted-foreground">{city.canton}</p>
                      <p className="text-xs text-muted-foreground mt-1">{city.count} Profile</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{citiesEmpty || 'Keine Städte verfügbar'}</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cities;
