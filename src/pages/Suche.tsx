import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { Pagination } from '@/components/Pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSearchProfiles, useProfilesByRadius } from '@/hooks/useProfiles';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { useCantons, useCitiesByCantonSlim } from '@/hooks/useCitiesByCantonSlim';
import { detectLocation } from '@/lib/geolocation';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

const Suche = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [canton, setCanton] = useState(searchParams.get('kanton') || '');
  const [city, setCity] = useState(searchParams.get('stadt') || '');
  const [radius, setRadius] = useState(parseInt(searchParams.get('umkreis') || '25'));
  const [category, setCategory] = useState(searchParams.get('kategorie') || '');
  const [keyword, setKeyword] = useState(searchParams.get('stichwort') || '');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const topCities = ['Zürich', 'Genf', 'Basel', 'Bern', 'Lausanne', 'Winterthur', 'Luzern', 'St. Gallen', 'Lugano', 'Thun'];

  const toggleCity = (cityName: string) => {
    setSelectedCities(prev => 
      prev.includes(cityName) 
        ? prev.filter(c => c !== cityName)
        : [...prev, cityName]
    );
  };
  
  const { data: categories = [] } = useCategories();
  const { data: cantons = [] } = useCantons();
  const { data: cities = [] } = useCitiesByCantonSlim(canton);
  const { data: radiusOptions = [] } = useDropdownOptions('radius');
  
  // GPS-based search
  const { data: gpsProfiles = [], isLoading: isLoadingGps } = useProfilesByRadius(
    userLat,
    userLng,
    radius,
    {
      categoryId: category || undefined,
      keyword: keyword || undefined,
    }
  );
  
  // Text-based search
  const searchLocation = city || (canton ? `${canton}` : searchParams.get('ort') || undefined);
  const { data: textProfiles = [], isLoading: isLoadingText } = useSearchProfiles({
    location: searchLocation,
    categoryId: searchParams.get('kategorie') || undefined,
    keyword: searchParams.get('stichwort') || undefined,
  });
  
  // Use GPS profiles if available, otherwise text search
  const profiles = userLat && userLng ? gpsProfiles : textProfiles;
  const isLoading = userLat && userLng ? isLoadingGps : isLoadingText;

  const { data: searchTitle } = useSiteSetting('search_page_title');
  const { data: searchSubtitle } = useSiteSetting('search_page_subtitle');
  const { data: searchLocationLabel } = useSiteSetting('search_filter_label_location');
  const { data: searchRadiusLabel } = useSiteSetting('search_filter_label_radius');
  const { data: searchCategoryLabel } = useSiteSetting('search_filter_label_category');
  const { data: searchKeywordLabel } = useSiteSetting('search_filter_label_keyword');
  const { data: searchButton } = useSiteSetting('search_button_text');
  const { data: searchResetButton } = useSiteSetting('search_button_reset');
  const { data: searchNoResults } = useSiteSetting('search_no_results_text');

  // Sort profiles (client-side for now)
  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      switch (sort) {
        case 'verified':
          const aVerified = a.verified_at ? 1 : 0;
          const bVerified = b.verified_at ? 1 : 0;
          return bVerified - aVerified;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [profiles, sort]);

  // Pagination (24 items per page)
  const ITEMS_PER_PAGE = 24;
  const totalPages = Math.ceil(sortedProfiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = sortedProfiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (canton) params.set('kanton', canton);
    if (selectedCities.length > 0) params.set('stadt', selectedCities[0]);
    if (city) params.set('stadt', city);
    if (radius) params.set('umkreis', radius.toString());
    if (category) params.set('kategorie', category);
    if (keyword) params.set('stichwort', keyword);
    setSearchParams(params);
    setCurrentPage(1);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const result = await detectLocation();
      setUserLat(result.lat);
      setUserLng(result.lng);
      
      // Find matching canton
      const matchingCanton = cantons.find(
        (c) => c.name.toLowerCase() === result.canton.toLowerCase() ||
               c.abbreviation.toLowerCase() === result.canton.toLowerCase()
      );
      
      if (matchingCanton) {
        setCanton(matchingCanton.abbreviation);
        setCity(result.city);
        toast.success(`GPS-Suche aktiviert: ${result.city}, ${matchingCanton.abbreviation} (${radius}km Radius)`);
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
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">{searchTitle || 'Profile durchsuchen'}</h1>
          {searchSubtitle && <p className="text-muted-foreground mb-6">{searchSubtitle}</p>}
          
          <form onSubmit={handleSearch} className="bg-card border rounded-lg p-8 mb-6">
            <Button
              type="button"
              size="lg"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="w-full mb-8 gap-2 text-lg h-14"
            >
              <MapPin className="h-5 w-5" />
              {isDetectingLocation ? 'Erkenne Standort...' : 'In meiner Nähe suchen'}
            </Button>
            
            {userLat && userLng ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">
                      Umkreis: {radius} km
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUserLat(null);
                        setUserLng(null);
                      }}
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

                <div>
                  <h3 className="text-sm font-medium mb-3">Kategorien</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant={!category || category === 'all' ? "default" : "outline"}
                      onClick={() => setCategory('all')}
                      size="lg"
                    >
                      Alle
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat.id}
                        type="button"
                        variant={category === cat.id ? "default" : "outline"}
                        onClick={() => setCategory(cat.id)}
                        size="lg"
                      >
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <Input
                  placeholder={searchKeywordLabel || "Stichwort eingeben..."}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-12"
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Kategorien</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant={!category || category === 'all' ? "default" : "outline"}
                      onClick={() => setCategory('all')}
                      size="lg"
                    >
                      Alle
                    </Button>
                    {categories.map((cat) => (
                      <Button
                        key={cat.id}
                        type="button"
                        variant={category === cat.id ? "default" : "outline"}
                        onClick={() => setCategory(cat.id)}
                        size="lg"
                      >
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Beliebte Städte</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {topCities.map((cityName) => (
                      <Button
                        key={cityName}
                        type="button"
                        variant={selectedCities.includes(cityName) ? "default" : "outline"}
                        onClick={() => toggleCity(cityName)}
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        {cityName}
                      </Button>
                    ))}
                  </div>
                </div>

                <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="w-full">
                      {showAdvancedFilters ? 'Erweiterte Filter ausblenden' : 'Erweiterte Filter anzeigen'}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div>
                      <label htmlFor="q_canton" className="block text-sm font-medium mb-1">
                        Kanton
                      </label>
                      <select
                        id="q_canton"
                        value={canton}
                        onChange={(e) => {
                          setCanton(e.target.value);
                          setCity('');
                        }}
                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                        Stadt {!canton && <span className="text-xs text-muted-foreground">(Kanton wählen)</span>}
                      </label>
                      <select
                        id="q_city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!canton}
                        className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
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
                      <label htmlFor="q_keyword" className="block text-sm font-medium mb-1">
                        {searchKeywordLabel || 'Stichwort'}
                      </label>
                      <Input
                        id="q_keyword"
                        placeholder="Name, Service..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
            
            <Button type="submit" className="w-full mt-6 h-12" size="lg">
              {searchButton || 'Suchen'}
            </Button>
          </form>

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {sortedProfiles.length} {sortedProfiles.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
            </p>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">Lade Ergebnisse...</p>
          ) : paginatedProfiles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedProfiles.map((profile) => (
                  <ProfileCard 
                    key={profile.id} 
                    profile={profile} 
                    distance={(profile as any).distance_km}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{searchNoResults || 'Keine Profile gefunden. Versuche es mit anderen Suchkriterien.'}</p>
              <Button variant="outline" onClick={() => {
                setCanton('');
                setCity('');
                setCategory('');
                setKeyword('');
                setCurrentPage(1);
                setUserLat(null);
                setUserLng(null);
                setSearchParams({});
              }}>
                {searchResetButton || 'Filter zurücksetzen'}
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