import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MapPin, Tag, Search, X } from 'lucide-react';
import { FilterPopover } from '@/components/search/FilterPopover';
import { detectLocation } from '@/lib/geolocation';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import { toast } from 'sonner';
import { Canton } from '@/types/common';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

interface HeroSectionProps {
  siteTitle?: string;
  heroSubtitle?: string;
  searchLocationPlaceholder?: string;
  searchKeywordPlaceholder?: string;
  searchButtonText?: string;
  heroImageUrl?: string;
  heroOverlayOpacity?: string;
  cantons: Canton[];
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export const HeroSection = ({
  siteTitle,
  heroSubtitle,
  searchKeywordPlaceholder,
  searchButtonText,
  heroImageUrl,
  heroOverlayOpacity,
  cantons,
  categories
}: HeroSectionProps) => {
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

  // Single batch load instead of 9 individual API calls
  const { getSetting } = useSiteSettingsContext();
  
  const heroSearchTitle = getSetting('hero_search_title');
  const heroResetButton = getSetting('hero_reset_button', 'Zurücksetzen');
  const heroFiltersActive = getSetting('hero_filters_active', 'Filter aktiv');
  const heroGpsButton = getSetting('hero_gps_button', 'In meiner Nähe suchen');
  const heroGpsDetecting = getSetting('hero_gps_detecting', 'Erkenne Standort...');
  const heroRadiusLabel = getSetting('hero_radius_label', 'Umkreis');
  const heroBackToLocation = getSetting('hero_back_to_location', 'Zurück zur Ortsauswahl');
  const heroCantonPlaceholder = getSetting('hero_canton_placeholder', 'Kanton wählen');
  const heroCategoryPlaceholder = getSetting('hero_category_placeholder', 'Alle Kategorien');
  
  // Compute optimized hero image URL synchronously for immediate render
  const optimizedHeroImage = heroImageUrl ? getOptimizedImageUrl(heroImageUrl, {
    width: 1200,
    quality: 70,
    format: 'webp'
  }) : '';

  const activeFiltersCount = useMemo(() => {
    if (useGPS) {
      let count = 1; // GPS = 1
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
  }, [canton, category, keyword, useGPS]);

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (useGPS && userLat && userLng) {
      params.set('lat', userLat.toString());
      params.set('lng', userLng.toString());
      params.set('radius', radius.toString());
    } else if (canton) {
      params.set('kanton', canton);
    }
    
    if (category) params.set('kategorie', category);
    if (keyword) params.set('stichwort', keyword);
    navigate(`/suche?${params.toString()}`);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const result = await detectLocation();
      const matchingCanton = cantons.find(c => c.name.toLowerCase() === result.canton.toLowerCase() || c.abbreviation.toLowerCase() === result.canton.toLowerCase());
      
      const params = new URLSearchParams();
      params.set('lat', result.lat.toString());
      params.set('lng', result.lng.toString());
      params.set('radius', radius.toString());
      params.set('location', `${result.city}, ${matchingCanton?.abbreviation || result.canton}`);
      if (category) params.set('kategorie', category);
      
      navigate(`/suche?${params.toString()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Standort konnte nicht ermittelt werden');
      setIsDetectingLocation(false);
    }
  };

  const handleResetFilters = () => {
    setCanton('');
    setCategory('');
    setKeyword('');
    setUseGPS(false);
    setUserLat(null);
    setUserLng(null);
  };

  return (
    <section className="relative py-8" aria-label="Hero-Bereich mit Suchfunktion">
      {optimizedHeroImage && (
        <>
          <img 
            src={optimizedHeroImage} 
            alt="Hero background" 
            className="absolute inset-0 w-full h-full object-cover" 
            fetchPriority="high" 
            loading="eager" 
          />
          <div className="absolute inset-0 bg-background" style={{
            opacity: heroOverlayOpacity || '0.7'
          }} />
        </>
      )}
      <div className="container mx-auto px-4 relative z-10">
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto bg-card border rounded-lg p-6" role="search" aria-label="Hauptsuche">
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-end gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} {heroFiltersActive}
              </Badge>
              <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters} className="h-8">
                <X className="h-4 w-4 mr-1" />
                {heroResetButton}
              </Button>
            </div>
          )}
          
          <Button type="button" size="lg" onClick={handleDetectLocation} disabled={isDetectingLocation} className="w-full mb-6 gap-2 text-lg h-14" aria-label="Standort automatisch erkennen">
            <MapPin className="h-5 w-5" aria-hidden="true" />
            {isDetectingLocation ? heroGpsDetecting : heroGpsButton}
          </Button>
          
          {useGPS ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="hero-radius-slider" className="text-sm font-medium">
                    {heroRadiusLabel}: {radius} km
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setUseGPS(false)}>
                    {heroBackToLocation}
                  </Button>
                </div>
                <Slider id="hero-radius-slider" value={[radius]} onValueChange={([value]) => setRadius(value)} min={5} max={100} step={5} className="mt-2" aria-label={`Suchradius einstellen, aktuell ${radius} Kilometer`} />
                <div className="relative w-full text-xs text-muted-foreground mt-2 h-4">
                  <span className="absolute left-0">5 km</span>
                  <span className="absolute" style={{ left: 'calc(21% - 10px)' }}>25 km</span>
                  <span className="absolute" style={{ left: 'calc(47% - 12px)' }}>50 km</span>
                  <span className="absolute right-0">100 km</span>
                </div>
              </div>

              <FilterPopover 
                trigger={{
                  icon: <Tag className="h-4 w-4" />,
                  label: heroCategoryPlaceholder
                }} 
                items={categories.map(c => ({
                  id: c.id,
                  label: c.name
                }))} 
                selected={category} 
                onSelect={setCategory} 
                open={categoryGpsOpen} 
                onOpenChange={setCategoryGpsOpen} 
                allLabel={heroCategoryPlaceholder} 
              />

              <Button type="submit" className="w-full h-12 mt-4" aria-label="Suche starten">
                <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                {searchButtonText || "Suchen"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FilterPopover 
                  trigger={{
                    icon: <MapPin className="h-4 w-4" />,
                    label: heroCantonPlaceholder
                  }} 
                  items={cantons.map(c => ({
                    id: c.abbreviation,
                    label: c.abbreviation
                  }))} 
                  selected={canton} 
                  onSelect={setCanton} 
                  open={cantonOpen} 
                  onOpenChange={setCantonOpen} 
                  allLabel="Alle" 
                  layout="grid" 
                />

                <FilterPopover 
                  trigger={{
                    icon: <Tag className="h-4 w-4" />,
                    label: heroCategoryPlaceholder
                  }} 
                  items={categories.map(c => ({
                    id: c.id,
                    label: c.name
                  }))} 
                  selected={category} 
                  onSelect={setCategory} 
                  open={categoryOpen} 
                  onOpenChange={setCategoryOpen} 
                  allLabel={heroCategoryPlaceholder} 
                />
              </div>

              <Button type="submit" className="w-full h-12 mt-4" aria-label="Suche starten">
                <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                {searchButtonText || "Suchen"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
};
