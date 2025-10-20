import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { mockProfiles } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Suche = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [location, setLocation] = useState(searchParams.get('ort') || '');
  const [radius, setRadius] = useState(searchParams.get('umkreis') || '25');
  const [category, setCategory] = useState(searchParams.get('kategorie') || '');
  const [keyword, setKeyword] = useState(searchParams.get('stichwort') || '');
  const [sort, setSort] = useState('newest');

  // TODO backend: Filter-Parameter an API übergeben und Ergebnisse rendern
  // TODO distance: Haversine oder Google Places Integration
  // TODO sort: serverseitig unterstützen

  const filteredProfiles = mockProfiles.filter((profile) => {
    if (category && !profile.categories.some(c => c.toLowerCase() === category.toLowerCase())) {
      return false;
    }
    if (keyword && !profile.display_name.toLowerCase().includes(keyword.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('ort', location);
    if (radius) params.set('umkreis', radius);
    if (category) params.set('kategorie', category);
    if (keyword) params.set('stichwort', keyword);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Suche</h1>
          
          <form onSubmit={handleSearch} className="bg-card border rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
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
                  <option value="freelancer">Freelancer</option>
                  <option value="agenturen">Agenturen</option>
                  <option value="studios">Studios</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="events">Events</option>
                  <option value="service">Service</option>
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
          </form>

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredProfiles.length} {filteredProfiles.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="q_sort" className="text-sm">
                Sortierung:
              </label>
              <select
                id="q_sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="newest">Neueste</option>
                <option value="verified">Verifiziert</option>
                <option value="price-asc">Preis ↑</option>
                <option value="price-desc">Preis ↓</option>
              </select>
            </div>
          </div>

          {filteredProfiles.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Keine Treffer gefunden</p>
              <Button variant="outline" onClick={() => {
                setLocation('');
                setCategory('');
                setKeyword('');
                setSearchParams({});
              }}>
                Filter zurücksetzen
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Suche;
