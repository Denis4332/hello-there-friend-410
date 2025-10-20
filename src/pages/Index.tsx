import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { CityCard } from '@/components/CityCard';
import { mockProfiles } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState('25');
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');

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
              <p className="text-xs text-muted-foreground mt-2">
                Umkreissuche benötigt Standortfreigabe oder Google Places API (folgt).
              </p>
            </form>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Top-Städte</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CityCard name="Zürich" slug="zuerich" />
              <CityCard name="Basel" slug="basel" />
              <CityCard name="Bern" slug="bern" />
              <CityCard name="Genf" slug="genf" />
            </div>
          </div>
        </section>

        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Aktuelle Profile</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {mockProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
