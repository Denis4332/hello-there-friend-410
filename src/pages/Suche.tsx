import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { Pagination } from '@/components/Pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchProfiles, useProfilesByRadius } from '@/hooks/useProfiles';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { detectLocation } from '@/lib/geolocation';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

const Suche = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [location, setLocation] = useState(searchParams.get('ort') || '');
  const [radius, setRadius] = useState(searchParams.get('umkreis') || '25');
  const [category, setCategory] = useState(searchParams.get('kategorie') || '');
  const [keyword, setKeyword] = useState(searchParams.get('stichwort') || '');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  const { data: categories = [] } = useCategories();
  const { data: radiusOptions = [] } = useDropdownOptions('radius');
  
  // GPS-based search
  const { data: gpsProfiles = [], isLoading: isLoadingGps } = useProfilesByRadius(
    userLat,
    userLng,
    parseInt(radius) || 25,
    {
      categoryId: category || undefined,
      keyword: keyword || undefined,
    }
  );
  
  // Text-based search
  const { data: textProfiles = [], isLoading: isLoadingText } = useSearchProfiles({
    location: searchParams.get('ort') || undefined,
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
    if (location) params.set('ort', location);
    if (radius) params.set('umkreis', radius);
    if (category) params.set('kategorie', category);
    if (keyword) params.set('stichwort', keyword);
    setSearchParams(params);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const result = await detectLocation();
      setUserLat(result.lat);
      setUserLng(result.lng);
      setLocation(`${result.city}, ${result.postalCode}`);
      toast.success(`Standort erkannt: ${result.city}`);
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
          
          <form onSubmit={handleSearch} className="bg-card border rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="q_location" className="block text-sm font-medium mb-1">
                  {searchLocationLabel || 'Standort'}
                </label>
                <div className="flex gap-2">
                  <Input
                    id="q_location"
                    placeholder="Stadt oder PLZ"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setUserLat(null);
                      setUserLng(null);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    title="Standort ermitteln"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <label htmlFor="q_radius" className="block text-sm font-medium mb-1">
                  {searchRadiusLabel || 'Umkreis'}
                </label>
                <select
                  id="q_radius"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {radiusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="q_category" className="block text-sm font-medium mb-1">
                  {searchCategoryLabel || 'Kategorie'}
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
                  {searchKeywordLabel || 'Stichwort'}
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
              <div className="grid md:grid-cols-2 gap-4">
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
                setLocation('');
                setCategory('');
                setKeyword('');
                setCurrentPage(1);
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