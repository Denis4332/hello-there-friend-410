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

interface HeroSectionProps {
  siteTitle?: string;
  heroSubtitle?: string;
  searchLocationPlaceholder?: string;
  searchKeywordPlaceholder?: string;
  searchButtonText?: string;
  heroImageUrl?: string;
  heroOverlayOpacity?: string;
  cantons: Canton[];
  categories: Array<{ id: string; name: string; slug: string }>;
}

export const HeroSection = ({
  siteTitle,
  heroSubtitle,
  searchKeywordPlaceholder,
  searchButtonText,
  heroImageUrl,
  heroOverlayOpacity,
  cantons,
  categories,
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

  useEffect(() => {
    supportsWebP().then(setWebpSupported);
  }, []);

  // Optimize and preload hero image with aggressive optimization
  useEffect(() => {
    if (!heroImageUrl) return;

    const isMobile = window.innerWidth < 768;
    const optimizedImageUrl = getOptimizedImageUrl(heroImageUrl, {
      width: isMobile ? 640 : 1200, // Smaller sizes for faster load
      quality: isMobile ? 75 : 85,
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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const optimizedBgUrl = heroImageUrl && imageLoaded 
    ? optimizedHeroImage
    : undefined;

  return (
    <section 
      className="relative py-16"
      aria-label="Hero-Bereich mit Suchfunktion"
    >
      {optimizedHeroImage && (
        <>
          <img
            src={optimizedHeroImage}
            alt="Hero background"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            fetchPriority="high"
            loading="eager"
          />
          <div 
            className="absolute inset-0 bg-background"
            style={{ opacity: heroOverlayOpacity || '0.7' }}
          />
        </>
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
        
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto bg-card border rounded-lg p-6" role="search" aria-label="Hauptsuche">
          <div className="sticky top-0 z-10 bg-card pb-4 -mt-6 pt-6 -mx-6 px-6 mb-4 flex items-center justify-between border-b md:border-0">
            <h2 className="text-lg font-semibold" id="hero-search-heading">Suche</h2>
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
            aria-label="Standort automatisch erkennen"
          >
            <MapPin className="h-5 w-5" aria-hidden="true" />
            {isDetectingLocation ? 'Erkenne Standort...' : 'In meiner Nähe suchen'}
          </Button>
          
          {useGPS ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="hero-radius-slider" className="text-sm font-medium">
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
                  id="hero-radius-slider"
                  value={[radius]}
                  onValueChange={([value]) => setRadius(value)}
                  min={5}
                  max={100}
                  step={5}
                  className="mt-2"
                  aria-label={`Suchradius einstellen, aktuell ${radius} Kilometer`}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>5 km</span>
                  <span>25 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
              </div>

              <FilterPopover
                trigger={{ icon: <Tag className="h-4 w-4" />, label: 'Alle Kategorien' }}
                items={categories.map(c => ({ id: c.id, label: c.name }))}
                selected={category}
                onSelect={setCategory}
                open={categoryGpsOpen}
                onOpenChange={setCategoryGpsOpen}
                allLabel="Alle Kategorien"
              />

              <Input
                placeholder={searchKeywordPlaceholder || "Stichwort eingeben..."}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-12"
                aria-label="Suchbegriff eingeben"
              />

              <Button 
                type="submit" 
                className="w-full h-12 mt-4"
                aria-label="Suche starten"
              >
                <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                {searchButtonText || "Suchen"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FilterPopover
                  trigger={{ icon: <MapPin className="h-4 w-4" />, label: 'Kanton wählen' }}
                  items={cantons.map(c => ({ id: c.abbreviation, label: c.abbreviation }))}
                  selected={canton}
                  onSelect={setCanton}
                  open={cantonOpen}
                  onOpenChange={setCantonOpen}
                  allLabel="Alle"
                  layout="grid"
                />

                <FilterPopover
                  trigger={{ icon: <Tag className="h-4 w-4" />, label: 'Alle Kategorien' }}
                  items={categories.map(c => ({ id: c.id, label: c.name }))}
                  selected={category}
                  onSelect={setCategory}
                  open={categoryOpen}
                  onOpenChange={setCategoryOpen}
                  allLabel="Alle Kategorien"
                />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder={searchKeywordPlaceholder || "Stichwort eingeben..."}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="flex-1 h-12"
                  aria-label="Suchbegriff eingeben"
                />
                <Button type="submit" className="h-12 px-8" aria-label="Suche starten">
                  <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                  {searchButtonText || "Suchen"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
};
