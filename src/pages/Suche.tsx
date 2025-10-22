import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { Pagination } from '@/components/Pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchProfiles } from '@/hooks/useProfiles';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const Suche = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [location, setLocation] = useState(searchParams.get('ort') || '');
  const [radius, setRadius] = useState(searchParams.get('umkreis') || '25');
  const [category, setCategory] = useState(searchParams.get('kategorie') || '');
  const [keyword, setKeyword] = useState(searchParams.get('stichwort') || '');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: categories = [] } = useCategories();
  const { data: profiles = [], isLoading } = useSearchProfiles({
    location: searchParams.get('ort') || undefined,
    categoryId: searchParams.get('kategorie') || undefined,
    keyword: searchParams.get('stichwort') || undefined,
  });

  const { data: searchTitle } = useSiteSetting('search_title');
  const { data: searchLocationLabel } = useSiteSetting('search_location_label');
  const { data: searchLocationPlaceholder } = useSiteSetting('search_location_placeholder');
  const { data: searchRadiusLabel } = useSiteSetting('search_radius_label');
  const { data: searchCategoryLabel } = useSiteSetting('search_category_label');
  const { data: searchCategoryAll } = useSiteSetting('search_category_all');
  const { data: searchKeywordLabel } = useSiteSetting('search_keyword_label');
  const { data: searchKeywordPlaceholder } = useSiteSetting('search_keyword_placeholder');
  const { data: searchButton } = useSiteSetting('search_button');
  const { data: searchResultsSingle } = useSiteSetting('search_results_single');
  const { data: searchResultsPlural } = useSiteSetting('search_results_plural');
  const { data: searchSortLabel } = useSiteSetting('search_sort_label');
  const { data: searchSortNewest } = useSiteSetting('search_sort_newest');
  const { data: searchSortVerified } = useSiteSetting('search_sort_verified');
  const { data: searchNoResults } = useSiteSetting('search_no_results');
  const { data: searchResetButton } = useSiteSetting('search_reset_button');
  const { data: searchLoading } = useSiteSetting('search_loading');

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">{searchTitle || 'Suche'}</h1>
          
          <form onSubmit={handleSearch} className="bg-card border rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="q_location" className="block text-sm font-medium mb-1">
                  {searchLocationLabel || 'Ort/PLZ'}
                </label>
                <Input
                  id="q_location"
                  placeholder={searchLocationPlaceholder || 'PLZ oder Ort'}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
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
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
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
                  <option value="">{searchCategoryAll || 'Alle Kategorien'}</option>
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
                  placeholder={searchKeywordPlaceholder || 'Name, Service...'}
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
              {sortedProfiles.length} {sortedProfiles.length === 1 ? (searchResultsSingle || 'Ergebnis') : (searchResultsPlural || 'Ergebnisse')}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="q_sort" className="text-sm">
                {searchSortLabel || 'Sortierung:'}
              </label>
              <select
                id="q_sort"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="newest">{searchSortNewest || 'Neueste'}</option>
                <option value="verified">{searchSortVerified || 'Verifiziert'}</option>
                <option value="price-asc">Preis ↑</option>
                <option value="price-desc">Preis ↓</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-12">{searchLoading || 'Lade Ergebnisse...'}</p>
          ) : paginatedProfiles.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {paginatedProfiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
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
              <p className="text-muted-foreground mb-4">{searchNoResults || 'Keine Treffer gefunden'}</p>
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