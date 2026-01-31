import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useSearchProfiles, useProfilesByRadius } from '@/hooks/useProfiles';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { useCantons } from '@/hooks/useCitiesByCantonSlim';
import { detectLocation } from '@/lib/geolocation';
import { toast } from 'sonner';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchResults } from '@/components/search/SearchResults';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SEO } from '@/components/SEO';
import { useRotationKey } from '@/hooks/useRotationKey';
// Realtime hooks removed from /suche for performance - not needed for search snapshots

const ITEMS_PER_PAGE = 24;
const DEBOUNCE_MS = 300; // Debounce for GPS radius/filter changes

const Suche = () => {
  // Realtime hooks removed - /suche shows snapshot data, realtime not needed here
  const rotationKey = useRotationKey();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [canton, setCanton] = useState(searchParams.get('kanton') || '');
  const [radius, setRadius] = useState(parseInt(searchParams.get('radius') || '25'));
  const [category, setCategory] = useState(searchParams.get('kategorie') || '');
  const [keyword, setKeyword] = useState(searchParams.get('stichwort') || '');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Initialize GPS coords from URL params (coming from HeroSection)
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');
  const urlLocation = searchParams.get('location');
  const [userLat, setUserLat] = useState<number | null>(urlLat ? parseFloat(urlLat) : null);
  const [userLng, setUserLng] = useState<number | null>(urlLng ? parseFloat(urlLng) : null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(urlLocation);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [cantonOpen, setCantonOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryGpsOpen, setCategoryGpsOpen] = useState(false);
  
  const { data: categories = [] } = useCategories();
  const { data: cantons = [] } = useCantons();
  const { getSetting } = useSiteSettingsContext();
  
  // GPS-based search mit Server-Side Pagination
  const { 
    data: gpsData,
    isLoading: isLoadingGps,
    refetch: refetchGpsProfiles 
  } = useProfilesByRadius(
    userLat,
    userLng,
    radius,
    {
      categoryId: category || undefined,
      keyword: keyword || undefined,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
      rotationSeed: rotationKey,
    }
  );
  
  // Text-based search mit Server-Side Pagination (only when GPS not active)
  const { data: textData, isLoading: isLoadingText } = useSearchProfiles({
    location: canton || undefined,
    categoryId: category || undefined,
    keyword: keyword || undefined,
    enabled: !userLat && !userLng,
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    rotationSeed: rotationKey,
  });
  
  // Debounced refetch for GPS results when radius or category changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedGpsRefetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      refetchGpsProfiles();
    }, DEBOUNCE_MS);
  }, [refetchGpsProfiles]);
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Auto-refetch GPS results when radius or category changes (debounced)
  useEffect(() => {
    if (userLat && userLng) {
      const params = new URLSearchParams();
      params.set('radius', radius.toString());
      params.set('lat', userLat.toString());
      params.set('lng', userLng.toString());
      if (detectedLocation) params.set('location', detectedLocation);
      if (category) params.set('kategorie', category);
      setSearchParams(params, { replace: true });
      debouncedGpsRefetch();
    }
  }, [radius, category, userLat, userLng, debouncedGpsRefetch]);
  
  // GPS active: ONLY show profiles within radius
  // GPS inactive: Show canton-based text search results
  const profiles = useMemo(() => {
    if (userLat && userLng) {
      return gpsData?.profiles ?? [];
    }
    return textData?.profiles ?? [];
  }, [userLat, userLng, gpsData, textData]);
  
  const totalCount = useMemo(() => {
    if (userLat && userLng) {
      return gpsData?.totalCount ?? 0;
    }
    return textData?.totalCount ?? 0;
  }, [userLat, userLng, gpsData, textData]);
  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const isLoading = userLat && userLng ? isLoadingGps : isLoadingText;

  const searchTitle = getSetting('search_page_title', 'Profile durchsuchen');
  const searchSubtitle = getSetting('search_page_subtitle', 'Durchsuchen Sie alle verifizierten Profile in der Schweiz');
  const searchKeywordLabel = getSetting('search_filter_label_keyword', 'Stichwort');
  const searchButton = getSetting('search_button_text', 'Suchen');
  const searchNoResults = getSetting('search_no_results_text', 'Keine Profile gefunden');

  // Reset auf Seite 1 bei Filter-Änderung
  useEffect(() => {
    setCurrentPage(1);
  }, [canton, category, keyword, rotationKey]);

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
            
            queryClient.removeQueries({ queryKey: ['search-profiles-paginated'] });
            queryClient.removeQueries({ queryKey: ['profiles-by-radius-paginated'] });
            
            setCanton('');
            setSearchParams({});
            
            setUserLat(lat);
            setUserLng(lng);
            setLocationAccuracy(accuracy);
            setCurrentPage(1);
            
            setTimeout(() => {
              refetchGpsProfiles();
            }, 100);

            const result = await detectLocation();
            
            const matchingCanton = cantons.find(
              (c) => c.name.toLowerCase() === result.canton.toLowerCase() ||
                     c.abbreviation.toLowerCase() === result.canton.toLowerCase()
            );
            
            if (matchingCanton) {
              setDetectedLocation(`${result.city}, ${matchingCanton.abbreviation}`);
              toast.success(`GPS-Suche aktiviert: ${result.city}, ${matchingCanton.abbreviation} (±${Math.round(accuracy)}m)`);
            } else {
              setDetectedLocation(result.city);
              toast.success(`GPS-Suche aktiviert: ${result.city} (±${Math.round(accuracy)}m)`);
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
    setDetectedLocation(null);
    setRadius(25);
    setSearchParams({});
  };

  const activeFiltersCount = useMemo(() => {
    if (userLat && userLng) {
      let count = 1;
      if (category) count++;
      if (keyword) count++;
      return count;
    } else {
      let count = 0;
      if (canton) count++;
      if (category) count++;
      if (keyword) count++;
      return count;
    }
  }, [canton, category, keyword, userLat, userLng]);

  useEffect(() => {
    if (locationAccuracy && locationAccuracy > 500) {
      toast.info('GPS-Signal schwach (±' + Math.round(locationAccuracy) + 'm) - ggf. Radius erhöhen');
    }
  }, [locationAccuracy]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={searchTitle || 'Profile durchsuchen'}
        description={searchSubtitle || 'Durchsuchen Sie alle verifizierten Profile in der Schweiz'}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
          <Breadcrumbs items={[{ label: 'Suche' }]} />
          <h1 className="text-3xl font-bold mb-2">{searchTitle || 'Profile durchsuchen'}</h1>
          {searchSubtitle && <p className="text-muted-foreground mb-6">{searchSubtitle}</p>}
          
          <SearchFilters
            canton={canton}
            category={category}
            keyword={keyword}
            radius={radius}
            userLat={userLat}
            userLng={userLng}
            locationAccuracy={locationAccuracy}
            detectedLocation={detectedLocation}
            isDetectingLocation={isDetectingLocation}
            activeFiltersCount={activeFiltersCount}
            cantons={cantons}
            categories={categories}
            onCantonChange={setCanton}
            onCategoryChange={setCategory}
            onKeywordChange={setKeyword}
            onRadiusChange={setRadius}
            onDetectLocation={handleDetectLocation}
            onResetFilters={handleResetFilters}
            onResetGPS={() => {
              setUserLat(null);
              setUserLng(null);
              setLocationAccuracy(null);
              setDetectedLocation(null);
            }}
            onSubmit={handleSearch}
            searchButtonText={searchButton}
            searchKeywordLabel={searchKeywordLabel}
            cantonOpen={cantonOpen}
            categoryOpen={categoryOpen}
            categoryGpsOpen={categoryGpsOpen}
            setCantonOpen={setCantonOpen}
            setCategoryOpen={setCategoryOpen}
            setCategoryGpsOpen={setCategoryGpsOpen}
          />

          {!userLat && !userLng && !canton && !category && !keyword && (
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Zeigt TOP-Profile schweizweit.</span>{' '}
                Wähle einen Kanton oder aktiviere GPS für mehr Ergebnisse.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? 'Ergebnis' : 'Ergebnisse'}
              {!userLat && !userLng && !canton && !category && !keyword && ' (Top zuerst)'}
            </p>
          </div>

          <SearchResults
            profiles={profiles}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            noResultsText={searchNoResults}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Suche;
