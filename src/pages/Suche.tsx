import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { Pagination } from '@/components/Pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useSearchProfiles, useProfilesByRadius } from '@/hooks/useProfiles';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { useCantons, useCitiesByCantonSlim } from '@/hooks/useCitiesByCantonSlim';
import { detectLocation } from '@/lib/geolocation';
import { toast } from 'sonner';
import { MapPin, Building2, Tag, ChevronDown, Search, RefreshCw, X } from 'lucide-react';

const Suche = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [canton, setCanton] = useState(searchParams.get('kanton') || '');
  const [radius, setRadius] = useState(parseInt(searchParams.get('umkreis') || '25'));
  const [category, setCategory] = useState(searchParams.get('kategorie') || '');
  const [keyword, setKeyword] = useState(searchParams.get('stichwort') || '');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [cantonOpen, setCantonOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryGpsOpen, setCategoryGpsOpen] = useState(false);
  
  const { data: categories = [] } = useCategories();
  const { data: cantons = [] } = useCantons();
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
  
  // Text-based search - canton only
  const { data: textProfiles = [], isLoading: isLoadingText } = useSearchProfiles({
    location: canton || searchParams.get('ort') || undefined,
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
    if (radius) params.set('umkreis', radius.toString());
    if (category) params.set('kategorie', category);
    if (keyword) params.set('stichwort', keyword);
    setSearchParams(params);
    setCurrentPage(1);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            
            setUserLat(lat);
            setUserLng(lng);
            setLocationAccuracy(accuracy);

            // Get location name via reverse geocoding
            const result = await detectLocation();
            
            const matchingCanton = cantons.find(
              (c) => c.name.toLowerCase() === result.canton.toLowerCase() ||
                     c.abbreviation.toLowerCase() === result.canton.toLowerCase()
            );
            
            if (matchingCanton) {
              setCanton(matchingCanton.abbreviation);
              toast.success(`GPS-Suche aktiviert: ${result.city}, ${matchingCanton.abbreviation} (±${Math.round(accuracy)}m)`);
            } else {
              toast.error('Kanton konnte nicht zugeordnet werden');
            }

            setIsDetectingLocation(false);
          },
          (error) => {
            toast.error('Standort konnte nicht ermittelt werden');
            setIsDetectingLocation(false);
          },
          { enableHighAccuracy: true }
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Standort konnte nicht ermittelt werden');
      setIsDetectingLocation(false);
    }
  };

  const handleResetFilters = () => {
    setCanton('');
    setCategory('');
    setKeyword('');
    setCurrentPage(1);
    setUserLat(null);
    setUserLng(null);
    setLocationAccuracy(null);
    setSearchParams({});
  };

  const activeFiltersCount = useMemo(() => {
    return [
      canton && 1,
      category && 1,
      keyword && 1,
      (userLat && userLng) && 1
    ].filter(Boolean).length;
  }, [canton, category, keyword, userLat, userLng]);

  // Dynamic radius adjustment based on GPS accuracy
  useEffect(() => {
    if (locationAccuracy && locationAccuracy > 500) {
      setRadius(20);
      toast.info('GPS-Signal schwach - Suchradius auf 20km erhöht');
    }
  }, [locationAccuracy]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">{searchTitle || 'Profile durchsuchen'}</h1>
          {searchSubtitle && <p className="text-muted-foreground mb-6">{searchSubtitle}</p>}
          
          <form onSubmit={handleSearch} className="bg-card border rounded-lg p-6 mb-6">
            <div className="sticky top-0 z-10 bg-card pb-4 -mt-6 pt-6 -mx-6 px-6 mb-4 flex items-center justify-between border-b md:border-0">
              <h2 className="text-lg font-semibold">Filter</h2>
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount} aktiv
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
            
            {userLat && userLng ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">
                      Umkreis: {radius} km
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="h-8"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                        Neu erkennen
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUserLat(null);
                          setUserLng(null);
                          setLocationAccuracy(null);
                        }}
                        className="h-8"
                      >
                        Ortsauswahl
                      </Button>
                    </div>
                  </div>

                  {locationAccuracy && (
                    <div className={`text-sm mb-2 flex items-center gap-2 ${locationAccuracy > 100 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      <MapPin className="h-3 w-3" />
                      Genauigkeit: ±{Math.round(locationAccuracy)}m
                      {locationAccuracy > 100 && (
                        <span className="text-amber-600 text-xs">
                          ⚠️ Ungenau - größerer Radius empfohlen
                        </span>
                      )}
                    </div>
                  )}

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
                  <PopoverContent className="w-[280px] p-2 max-h-[400px] overflow-y-auto" align="start">
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
                  placeholder={searchKeywordLabel || "Stichwort eingeben..."}
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
                    <PopoverContent className="w-[280px] p-2 max-h-[400px] overflow-y-auto" align="start">
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
                    placeholder="Stichwort eingeben..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-1 h-12"
                  />
                  <Button type="submit" className="h-12 px-8">
                    <Search className="h-4 w-4 mr-2" />
                    {searchButton || 'Suchen'}
                  </Button>
                </div>
              </div>
            )}
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