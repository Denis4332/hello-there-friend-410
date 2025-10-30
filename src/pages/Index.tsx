import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useFeaturedProfiles } from '@/hooks/useProfiles';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { useCantons, useCitiesByCantonSlim } from '@/hooks/useCitiesByCantonSlim';
import { SEO } from '@/components/SEO';
import { MapPin } from 'lucide-react';
import { detectLocation } from '@/lib/geolocation';
import { toast } from 'sonner';

const Index = () => {
  useDesignSettings(); // Apply design settings
  
  const navigate = useNavigate();
  const [canton, setCanton] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [radius, setRadius] = useState(25);
  const [useGPS, setUseGPS] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const { data: featuredProfiles = [], isLoading: loadingProfiles } = useFeaturedProfiles(8);
  const { data: categories = [] } = useCategories();
  const { data: cantons = [] } = useCantons();
  const { data: cities = [] } = useCitiesByCantonSlim(canton);
  
  const { data: siteTitle } = useSiteSetting('site_title');
  const { data: heroSubtitle } = useSiteSetting('hero_subtitle');
  const { data: searchLocationPlaceholder } = useSiteSetting('search_location_placeholder');
  const { data: searchKeywordPlaceholder } = useSiteSetting('search_keyword_placeholder');
  const { data: searchButtonText } = useSiteSetting('search_button_text');
  const { data: metaDescription } = useSiteSetting('meta_description');
  const { data: heroImageUrl } = useSiteSetting('design_hero_image_url');
  const { data: heroOverlayOpacity } = useSiteSetting('design_hero_overlay_opacity');
  const { data: featuredProfilesTitle } = useSiteSetting('home_featured_profiles_title');
  const { data: loadingProfilesText } = useSiteSetting('home_loading_profiles_text');
  const { data: noProfilesText } = useSiteSetting('home_no_profiles_text');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (canton) params.set('kanton', canton);
    if (city) params.set('stadt', city);
    if (category) params.set('kategorie', category);
    if (keyword) params.set('stichwort', keyword);
    navigate(`/suche?${params.toString()}`);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const result = await detectLocation();
      
      const matchingCanton = cantons.find(
        (c) => c.name.toLowerCase() === result.canton.toLowerCase() ||
               c.abbreviation.toLowerCase() === result.canton.toLowerCase()
      );
      
      if (matchingCanton) {
        setUseGPS(true);
        setCanton(matchingCanton.abbreviation);
        setCity(result.city);
        toast.success(`GPS-Suche aktiviert: ${result.city}, ${matchingCanton.abbreviation}`);
      } else {
        toast.error('Kanton konnte nicht zugeordnet werden');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Standort konnte nicht ermittelt werden');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={siteTitle || "Verifizierte Anbieter in der Schweiz"}
        description={metaDescription || "Finde verifizierte Begleitservice-Anbieter in deiner Nähe. Escort Services in Zürich, Bern, Basel und weiteren Schweizer Städten."}
        url="https://escoria.ch"
      />
      <Header />
      <main className="flex-1">
        <section 
          className="relative py-16"
          style={{
            backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: heroImageUrl ? undefined : 'hsl(var(--muted))',
          }}
        >
          {heroImageUrl && (
            <div 
              className="absolute inset-0 bg-background"
              style={{ opacity: heroOverlayOpacity || '0.7' }}
            />
          )}
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
              {siteTitle || "Verifizierte Anbieter in der Schweiz"}
            </h1>
            {heroSubtitle && (
              <p className="text-center text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                {heroSubtitle}
              </p>
            )}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto bg-card border rounded-lg p-6">
              <Button
                type="button"
                size="lg"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="w-full mb-6 gap-2"
              >
                <MapPin className="h-5 w-5" />
                {isDetectingLocation ? 'Erkenne Standort...' : 'In meiner Nähe suchen'}
              </Button>
              
              {useGPS && (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <label className="text-sm font-medium block mb-2">
                    Umkreis: {radius} km
                  </label>
                  <Slider
                    value={[radius]}
                    onValueChange={([value]) => setRadius(value)}
                    min={5}
                    max={100}
                    step={5}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 km</span>
                    <span>100 km</span>
                  </div>
                </div>
              )}
              
              {!useGPS && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="q_canton" className="block text-sm font-medium mb-1">
                    Kanton
                  </label>
                  <select
                    id="q_canton"
                    value={canton}
                    onChange={(e) => {
                      setCanton(e.target.value);
                      setCity(''); // Reset city when canton changes
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Alle Kantone</option>
                    {cantons.map((c) => (
                      <option key={c.id} value={c.abbreviation}>
                        {c.name} ({c.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="q_city" className="block text-sm font-medium mb-1">
                    Stadt {!canton && <span className="text-xs text-muted-foreground">(wähle zuerst Kanton)</span>}
                  </label>
                  <select
                    id="q_city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!canton}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  >
                    <option value="">Alle Städte</option>
                    {cities.map((c) => (
                      <option key={c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
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
                    placeholder={searchKeywordPlaceholder || "Name, Service..."}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>
              )}
              
              {!useGPS && (
                <Button type="submit" className="w-full" size="lg">
                  {searchButtonText || "Suchen"}
                </Button>
              )}
            </form>
          </div>
        </section>

        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">{featuredProfilesTitle || 'Aktuelle Profile'}</h2>
            {loadingProfiles ? (
              <p className="text-muted-foreground">{loadingProfilesText || 'Lade Profile...'}</p>
            ) : featuredProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProfiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">{noProfilesText || 'Keine Profile verfügbar'}</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
