import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCantons } from '@/hooks/useCitiesByCantonSlim';
import { useAllCities } from '@/hooks/useProfiles';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { MapPin, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const Kantone = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: cantons = [] } = useCantons();
  const { getSetting } = useSiteSettingsContext();
  const seoTitle = getSetting('seo_kantone_title', 'Kantone');
  const seoDescription = getSetting('seo_kantone_description', 'Durchsuchen Sie Profile nach Schweizer Kantonen');

  // Einfache Zählung der Profile pro Kanton direkt aus der DB
  const { data: profileCounts = {} } = useQuery({
    queryKey: ['canton-profile-counts'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('canton')
        .eq('status', 'active');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((p) => {
        const canton = p.canton?.toUpperCase();
        if (canton) {
          counts[canton] = (counts[canton] || 0) + 1;
        }
      });
      return counts;
    },
  });

  // Count profiles per canton
  const cantonCounts = useMemo(() => {
    return cantons.map((canton) => ({
      ...canton,
      profileCount: profileCounts[canton.abbreviation.toUpperCase()] || 0,
    }));
  }, [cantons, profileCounts]);

  const filteredCantons = cantonCounts.filter((canton) =>
    canton.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    canton.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={seoTitle || 'Kantone'} 
        description={seoDescription || 'Durchsuchen Sie Profile nach Schweizer Kantonen'}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Kantone durchsuchen</h1>
          <p className="text-muted-foreground mb-6">
            Finden Sie Profile in allen Schweizer Kantonen
          </p>

          <div className="relative mb-8 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kanton suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredCantons.map((canton) => (
              <Link
                key={canton.id}
                to={`/suche?kanton=${canton.abbreviation}`}
              >
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
                    <MapPin className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{canton.abbreviation}</h3>
                      <p className="text-sm text-muted-foreground">{canton.name}</p>
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {canton.profileCount} {canton.profileCount === 1 ? 'Profil' : 'Profile'}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredCantons.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              Keine Kantone gefunden.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Kantone;
