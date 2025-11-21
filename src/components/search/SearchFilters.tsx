import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MapPin, Tag, X, RefreshCw, Search } from 'lucide-react';
import { FilterPopover } from './FilterPopover';

interface SearchFiltersProps {
  canton: string;
  category: string;
  keyword: string;
  radius: number;
  tempRadius: number;
  userLat: number | null;
  userLng: number | null;
  locationAccuracy: number | null;
  isDetectingLocation: boolean;
  activeFiltersCount: number;
  cantons: Array<{ id: string; name: string; abbreviation: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  onCantonChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onRadiusChange: (value: number) => void;
  onApplyRadius: () => void;
  onDetectLocation: () => void;
  onResetFilters: () => void;
  onResetGPS: () => void;
  onSubmit: (e: React.FormEvent) => void;
  searchButtonText?: string;
  searchKeywordLabel?: string;
  cantonOpen: boolean;
  categoryOpen: boolean;
  categoryGpsOpen: boolean;
  setCantonOpen: (open: boolean) => void;
  setCategoryOpen: (open: boolean) => void;
  setCategoryGpsOpen: (open: boolean) => void;
  onlineOnly?: boolean;
  onOnlineOnlyChange?: (value: boolean) => void;
}

export const SearchFilters = ({
  canton,
  category,
  keyword,
  radius,
  tempRadius,
  userLat,
  userLng,
  locationAccuracy,
  isDetectingLocation,
  activeFiltersCount,
  cantons,
  categories,
  onCantonChange,
  onCategoryChange,
  onKeywordChange,
  onRadiusChange,
  onApplyRadius,
  onDetectLocation,
  onResetFilters,
  onResetGPS,
  onSubmit,
  searchButtonText,
  searchKeywordLabel,
  cantonOpen,
  categoryOpen,
  categoryGpsOpen,
  setCantonOpen,
  setCategoryOpen,
  setCategoryGpsOpen,
  onlineOnly = false,
  onOnlineOnlyChange,
}: SearchFiltersProps) => {
  return (
    <form onSubmit={onSubmit} className="bg-card border rounded-lg p-6 mb-6" role="search" aria-label="Suchfilter">
      <div className="sticky top-0 z-10 bg-card pb-4 -mt-6 pt-6 -mx-6 px-6 mb-4 flex items-center justify-between border-b md:border-0">
        <h2 className="text-lg font-semibold" id="filter-heading">Filter</h2>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} aktiv
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-8"
              aria-label="Alle Filter zurücksetzen"
            >
              <X className="h-4 w-4 mr-1" aria-hidden="true" />
              Zurücksetzen
            </Button>
          </div>
        )}
      </div>
      
      <Button
        type="button"
        size="lg"
        onClick={onDetectLocation}
        disabled={isDetectingLocation}
        className="w-full mb-6 gap-2 text-lg h-14"
        aria-label="Standort automatisch erkennen"
      >
        <MapPin className="h-5 w-5" aria-hidden="true" />
        {isDetectingLocation ? 'Erkenne Standort...' : 'In meiner Nähe suchen'}
      </Button>
      
      {userLat && userLng ? (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="radius-slider" className="text-sm font-medium">
                Umkreis: {tempRadius} km
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onDetectLocation}
                  disabled={isDetectingLocation}
                  className="h-8"
                  aria-label="Standort neu erkennen"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isDetectingLocation ? 'animate-spin' : ''}`} aria-hidden="true" />
                  Neu erkennen
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onResetGPS}
                  className="h-8"
                  aria-label="Zurück zur Ortsauswahl"
                >
                  Ortsauswahl
                </Button>
              </div>
            </div>

            <Slider
              id="radius-slider"
              value={[tempRadius]}
              onValueChange={([value]) => onRadiusChange(value)}
              min={5}
              max={100}
              step={5}
              className="mt-2"
              aria-label={`Suchradius einstellen, aktuell ${tempRadius} Kilometer`}
            />
            <Button
              type="button"
              onClick={onApplyRadius}
              disabled={tempRadius === radius}
              className="w-full mt-3"
              size="lg"
            >
              Anwenden ({tempRadius} km)
            </Button>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>5 km</span>
              <span>25 km</span>
              <span>50 km</span>
              <span>100 km</span>
            </div>
          </div>

          {/* GPS Signal Quality - Visually separated */}
          {locationAccuracy && (
            <div className={`p-3 rounded-lg border ${
              locationAccuracy > 100 
                ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' 
                : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">GPS-Signal:</span>
                <span>±{Math.round(locationAccuracy)}m Genauigkeit</span>
              </div>
              {locationAccuracy > 100 && (
                <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                  ⚠️ Schwaches Signal - Standort kann ungenau sein
                </p>
              )}
            </div>
          )}

          <FilterPopover
            trigger={{ icon: <Tag className="h-4 w-4" />, label: 'Alle Kategorien' }}
            items={categories.map(c => ({ id: c.id, label: c.name }))}
            selected={category}
            onSelect={onCategoryChange}
            open={categoryGpsOpen}
            onOpenChange={setCategoryGpsOpen}
            allLabel="Alle Kategorien"
          />

          <Input
            placeholder={searchKeywordLabel || "Stichwort eingeben..."}
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="h-12"
            aria-label="Suchbegriff eingeben"
          />
          
          {onOnlineOnlyChange && (
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="online-only"
                checked={onlineOnly}
                onCheckedChange={onOnlineOnlyChange}
              />
              <Label htmlFor="online-only" className="text-sm font-medium cursor-pointer">
                Nur Online-Profile anzeigen
              </Label>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FilterPopover
              trigger={{ icon: <MapPin className="h-4 w-4" />, label: 'Kanton wählen' }}
              items={cantons.map(c => ({ id: c.abbreviation, label: c.abbreviation }))}
              selected={canton}
              onSelect={onCantonChange}
              open={cantonOpen}
              onOpenChange={setCantonOpen}
              allLabel="Alle"
              layout="grid"
            />

            <FilterPopover
              trigger={{ icon: <Tag className="h-4 w-4" />, label: 'Alle Kategorien' }}
              items={categories.map(c => ({ id: c.id, label: c.name }))}
              selected={category}
              onSelect={onCategoryChange}
              open={categoryOpen}
              onOpenChange={setCategoryOpen}
              allLabel="Alle Kategorien"
            />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Stichwort eingeben..."
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              className="flex-1 h-12"
              aria-label="Suchbegriff eingeben"
            />
            <Button type="submit" className="h-12 px-8" aria-label="Suche starten">
              <Search className="h-4 w-4 mr-2" aria-hidden="true" />
              {searchButtonText || 'Suchen'}
            </Button>
          </div>
          
          {onOnlineOnlyChange && (
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                id="online-only-text"
                checked={onlineOnly}
                onCheckedChange={onOnlineOnlyChange}
              />
              <Label htmlFor="online-only-text" className="text-sm font-medium cursor-pointer">
                Nur Online-Profile anzeigen
              </Label>
            </div>
          )}
        </div>
      )}
    </form>
  );
};
