import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useFeaturedProfiles } from '@/hooks/useProfiles';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { useCantons } from '@/hooks/useCitiesByCantonSlim';
import { SEO } from '@/components/SEO';
import { MapPin, Tag, ChevronDown, Search, X } from 'lucide-react';
import { detectLocation } from '@/lib/geolocation';
import { toast } from 'sonner';
import { BannerDisplay } from '@/components/BannerDisplay';
import { AdvertisementCTA } from '@/components/AdvertisementCTA';

const Index = () => {
  useDesignSettings(); // Apply design settings
  
  const navigate = useNavigate();
  const [canton, setCanton] = useState('');
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [radius, setRadius] = useState(25);
  const [useGPS, setUseGPS] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [cantonOpen, setCantonOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryGpsOpen, setCategoryGpsOpen] = useState(false);
  
  const { data: featuredProfiles = [], isLoading: loadingProfiles } = useFeaturedProfiles(8);
  const { data: categories = [] } = useCategories();
  const { data: cantons = [] } = useCantons();
  
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

  const handleResetFilters = () => {
    setCanton('');
    setCategory('');
    setKeyword('');
    setUseGPS(false);
  };

  const activeFiltersCount = useMemo(() => {
    return [
      canton && 1,
      category && 1,
      keyword && 1,
      useGPS && 1
    ].filter(Boolean).length;
  }, [canton, category, keyword, useGPS]);

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
              <div className="sticky top-0 z-10 bg-card pb-4 -mt-6 pt-6 -mx-6 px-6 mb-4 flex items-center justify-between border-b md:border-0">
                <h2 className="text-lg font-semibold">Suche</h2>
                {activeFiltersCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {activeFiltersCount} Filter aktiv
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="h-8"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Zurücksetzen
                    </Button>
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="lg"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="w-full mb-6 gap-2 text-lg h-14"
              >
                <MapPin className="h-5 w-5" />
                {isDetectingLocation ? 'Erkenne Standort...' : 'In meiner Nähe suchen'}
              </Button>
              
              {useGPS ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">
                        Umkreis: {radius} km
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUseGPS(false)}
                      >
                        Zurück zur Ortsauswahl
                      </Button>
                    </div>
                    <Slider
                      value={[radius]}
                      onValueChange={([value]) => setRadius(value)}
                      min={5}
                      max={100}
                      step={5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>5 km</span>
                      <span>25 km</span>
                      <span>50 km</span>
                      <span>100 km</span>
                    </div>
                  </div>

                  <Popover open={categoryGpsOpen} onOpenChange={setCategoryGpsOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-12">
                        <Tag className="h-4 w-4" />
                        {category ? categories.find(c => c.id === category)?.name : 'Alle Kategorien'}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-2 max-h-[400px] overflow-y-auto">
                      <div className="space-y-1">
                        <Button
                          type="button"
                          variant={!category ? "default" : "ghost"}
                          onClick={() => {
                            setCategory('');
                            setCategoryGpsOpen(false);
                          }}
                          className="w-full justify-start"
                        >
                          Alle Kategorien
                        </Button>
                        {categories.map((cat) => (
                          <Button
                            key={cat.id}
                            type="button"
                            variant={category === cat.id ? "default" : "ghost"}
                            onClick={() => {
                              setCategory(cat.id);
                              setCategoryGpsOpen(false);
                            }}
                            className="w-full justify-start"
                          >
                            {cat.name}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Input
                    placeholder={searchKeywordPlaceholder || "Stichwort eingeben..."}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="h-12"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Popover open={cantonOpen} onOpenChange={setCantonOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-12">
                          <MapPin className="h-4 w-4" />
                          {canton || 'Kanton wählen'}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-2 max-h-[400px] overflow-y-auto" align="start">
                        <div className="grid grid-cols-3 gap-1.5">
                          <Button
                            type="button"
                            variant={!canton ? "default" : "ghost"}
                            onClick={() => {
                              setCanton('');
                              setCantonOpen(false);
                            }}
                            size="sm"
                            className="h-9"
                          >
                            Alle
                          </Button>
                          {cantons.map((c) => (
                            <Button
                              key={c.id}
                              type="button"
                              variant={canton === c.abbreviation ? "default" : "ghost"}
                              onClick={() => {
                                setCanton(c.abbreviation);
                                setCantonOpen(false);
                              }}
                              size="sm"
                              className="h-9"
                            >
                              {c.abbreviation}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between h-12">
                          <Tag className="h-4 w-4" />
                          {category ? categories.find(c => c.id === category)?.name : 'Alle Kategorien'}
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-2 max-h-[400px] overflow-y-auto">
                        <div className="space-y-1">
                          <Button
                            type="button"
                            variant={!category ? "default" : "ghost"}
                            onClick={() => {
                              setCategory('');
                              setCategoryOpen(false);
                            }}
                            className="w-full justify-start"
                          >
                            Alle Kategorien
                          </Button>
                          {categories.map((cat) => (
                            <Button
                              key={cat.id}
                              type="button"
                              variant={category === cat.id ? "default" : "ghost"}
                              onClick={() => {
                                setCategory(cat.id);
                                setCategoryOpen(false);
                              }}
                              className="w-full justify-start"
                            >
                              {cat.name}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder={searchKeywordPlaceholder || "Stichwort eingeben..."}
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="flex-1 h-12"
                    />
                    <Button type="submit" className="h-12 px-8">
                      <Search className="h-4 w-4 mr-2" />
                      {searchButtonText || "Suchen"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* Top Banner */}
        <BannerDisplay position="top" className="container mx-auto px-4 py-8" />

        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">{featuredProfilesTitle || 'Aktuelle Profile'}</h2>
            {loadingProfiles ? (
              <p className="text-muted-foreground">{loadingProfilesText || 'Lade Profile...'}</p>
            ) : featuredProfiles.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {featuredProfiles.map((profile, index) => (
                  <>
                    <ProfileCard key={profile.id} profile={profile} />
                    {(index + 1) % 8 === 0 && (
                      <div className="col-span-2 lg:col-span-3">
                        <BannerDisplay position="grid" className="w-full" />
                      </div>
                    )}
                  </>
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
