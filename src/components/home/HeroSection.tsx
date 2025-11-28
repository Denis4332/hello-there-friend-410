import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MapPin, Tag, Search, X } from 'lucide-react';
import { FilterPopover } from '@/components/search/FilterPopover';
import { detectLocation } from '@/lib/geolocation';
import { getOptimizedImageUrl, supportsWebP } from '@/utils/imageOptimization';
import { toast } from 'sonner';
import { Canton } from '@/types/common';
import { useSiteSetting } from '@/hooks/useSiteSettings';
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
  const [webpSupported, setWebpSupported] = useState(false);
  const [optimizedHeroImage, setOptimizedHeroImage] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  // CMS Settings
  const {
    data: heroSearchTitle
  } = useSiteSetting('hero_search_title');
  const {
    data: heroResetButton
  } = useSiteSetting('hero_reset_button');
  const {
    data: heroFiltersActive
  } = useSiteSetting('hero_filters_active');
  const {
    data: heroGpsButton
  } = useSiteSetting('hero_gps_button');
  const {
    data: heroGpsDetecting
  } = useSiteSetting('hero_gps_detecting');
  const {
    data: heroRadiusLabel
  } = useSiteSetting('hero_radius_label');
  const {
    data: heroBackToLocation
  } = useSiteSetting('hero_back_to_location');
  const {
    data: heroCantonPlaceholder
  } = useSiteSetting('hero_canton_placeholder');
  const {
    data: heroCategoryPlaceholder
  } = useSiteSetting('hero_category_placeholder');
  useEffect(() => {
    supportsWebP().then(setWebpSupported);
  }, []);

  // Optimize and preload hero image with aggressive optimization
  useEffect(() => {
    if (!heroImageUrl) return;
    const isMobile = window.innerWidth < 768;
    const optimizedImageUrl = getOptimizedImageUrl(heroImageUrl, {
      width: isMobile ? 640 : 1200,
      // Smaller sizes for faster load
      quality: isMobile ? 65 : 70,
      // Lower quality for better compression
      format: webpSupported ? 'webp' : 'origin'
    });
    setOptimizedHeroImage(optimizedImageUrl);

    // Preload with high priority
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = optimizedImageUrl;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
    const img = new Image();
    img.src = optimizedImageUrl;
    img.onload = () => {
      setImageLoaded(true);
    };
    return () => {
      document.head.removeChild(link);
    };
  }, [heroImageUrl, webpSupported]);
  const activeFiltersCount = useMemo(() => {
    if (useGPS) {
      // GPS-Modus: GPS zählt als 1, plus optionale Filter
      let count = 1; // GPS = 1
      if (category) count++;
      if (keyword) count++;
      return count;
    } else {
      // Normal-Modus: Canton, Category, Keyword zählen
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
    
    // GPS-Modus: Pass GPS coordinates to search page
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
      if (matchingCanton) {
        setUseGPS(true);
        setCanton(matchingCanton.abbreviation);
        setUserLat(result.lat);
        setUserLng(result.lng);
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
    setUserLat(null);
    setUserLng(null);
  };
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const optimizedBgUrl = heroImageUrl && imageLoaded ? optimizedHeroImage : undefined;
  return <section className="relative py-16" aria-label="Hero-Bereich mit Suchfunktion">
      {optimizedHeroImage && <>
          <img src={optimizedHeroImage} alt="Hero background" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700" style={{
        opacity: imageLoaded ? 1 : 0
      }} fetchPriority="high" loading="eager" />
          <div className="absolute inset-0 bg-background" style={{
        opacity: heroOverlayOpacity || '0.7'
      }} />
        </>}
      <div className="container mx-auto px-4 relative z-10">
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto bg-card border rounded-lg p-6" role="search" aria-label="Hauptsuche">
          {activeFiltersCount > 0 && <div className="flex items-center justify-end gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} {heroFiltersActive || 'Filter aktiv'}
              </Badge>
              <Button type="button" variant="ghost" size="sm" onClick={handleResetFilters} className="h-8">
                <X className="h-4 w-4 mr-1" />
                {heroResetButton || 'Zurücksetzen'}
              </Button>
            </div>}
          
          <Button type="button" size="lg" onClick={handleDetectLocation} disabled={isDetectingLocation} className="w-full mb-6 gap-2 text-lg h-14" aria-label="Standort automatisch erkennen">
            <MapPin className="h-5 w-5" aria-hidden="true" />
            {isDetectingLocation ? heroGpsDetecting || 'Erkenne Standort...' : heroGpsButton || 'In meiner Nähe suchen'}
          </Button>
          
          {useGPS ? <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="hero-radius-slider" className="text-sm font-medium">
                    {heroRadiusLabel || 'Umkreis'}: {radius} km
                  </label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setUseGPS(false)}>
                    {heroBackToLocation || 'Zurück zur Ortsauswahl'}
                  </Button>
                </div>
                <Slider id="hero-radius-slider" value={[radius]} onValueChange={([value]) => setRadius(value)} min={5} max={100} step={5} className="mt-2" aria-label={`Suchradius einstellen, aktuell ${radius} Kilometer`} />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>5 km</span>
                  <span>25 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
              </div>

              <FilterPopover trigger={{
            icon: <Tag className="h-4 w-4" />,
            label: heroCategoryPlaceholder || 'Alle Kategorien'
          }} items={categories.map(c => ({
            id: c.id,
            label: c.name
          }))} selected={category} onSelect={setCategory} open={categoryGpsOpen} onOpenChange={setCategoryGpsOpen} allLabel={heroCategoryPlaceholder || 'Alle Kategorien'} />

              <Button type="submit" className="w-full h-12 mt-4" aria-label="Suche starten">
                <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                {searchButtonText || "Suchen"}
              </Button>
            </div> : <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FilterPopover trigger={{
              icon: <MapPin className="h-4 w-4" />,
              label: heroCantonPlaceholder || 'Kanton wählen'
            }} items={cantons.map(c => ({
              id: c.abbreviation,
              label: c.abbreviation
            }))} selected={canton} onSelect={setCanton} open={cantonOpen} onOpenChange={setCantonOpen} allLabel="Alle" layout="grid" />

                <FilterPopover trigger={{
              icon: <Tag className="h-4 w-4" />,
              label: heroCategoryPlaceholder || 'Alle Kategorien'
            }} items={categories.map(c => ({
              id: c.id,
              label: c.name
            }))} selected={category} onSelect={setCategory} open={categoryOpen} onOpenChange={setCategoryOpen} allLabel={heroCategoryPlaceholder || 'Alle Kategorien'} />
              </div>

              <Button type="submit" className="w-full h-12 mt-4" aria-label="Suche starten">
                <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                {searchButtonText || "Suchen"}
              </Button>
            </div>}
        </form>
      </div>
    </section>;
};