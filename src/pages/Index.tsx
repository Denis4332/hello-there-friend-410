import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { CityCard } from '@/components/CityCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFeaturedProfiles, useTopCities } from '@/hooks/useProfiles';
import { useCategories } from '@/hooks/useCategories';
import { SEO } from '@/components/SEO';

const Index = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState('25');
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  
  const { data: featuredProfiles = [], isLoading: loadingProfiles } = useFeaturedProfiles(8);
  const { data: topCities = [], isLoading: loadingCities } = useTopCities(4);
  const { data: categories = [] } = useCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('ort', location);
    if (radius) params.set('umkreis', radius);
    if (category) params.set('kategorie', category);
    if (keyword) params.set('stichwort', keyword);
    navigate(`/suche?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Verifizierte Anbieter in der Schweiz"
        description="Finde verifizierte Begleitservice-Anbieter in deiner Nähe. Escort Services in Zürich, Bern, Basel und weiteren Schweizer Städten."
        url="https://escoria.ch"
      />
      <Header />
      <main className="flex-1">
        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
              Verifizierte Anbieter in der Schweiz
            </h1>
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto bg-card border rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="q_location" className="block text-sm font-medium mb-1">
                    Ort/PLZ
                  </label>
                  <Input
                    id="q_location"
                    placeholder="PLZ oder Ort"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="q_radius" className="block text-sm font-medium mb-1">
                    Umkreis
                  </label>
                  <select
                    id="q_radius"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="25">25 km</option>
                    <option value="50">50 km</option>
                    <option value="100">100 km</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="q_category" className="block text-sm font-medium mb-1">
                    Kategorie
                  </label>
                  <select
                    id="q_category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Alle Kategorien</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="q_keyword" className="block text-sm font-medium mb-1">
                    Stichwort
                  </label>
                  <Input
                    id="q_keyword"
                    placeholder="Name, Service..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Suchen
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Umkreissuche benötigt Standortfreigabe oder Google Places API (folgt).
              </p>
            </form>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Top-Städte</h2>
            {loadingCities ? (
              <p className="text-muted-foreground">Lade Städte...</p>
            ) : topCities.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {topCities.map((city) => (
                  <CityCard key={city.slug} name={city.city} slug={city.slug} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Keine Städte verfügbar</p>
            )}
          </div>
        </section>

        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Aktuelle Profile</h2>
            {loadingProfiles ? (
              <p className="text-muted-foreground">Lade Profile...</p>
            ) : featuredProfiles.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {featuredProfiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Keine Profile verfügbar</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
