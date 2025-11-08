import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { MapPin, Tag, X, RefreshCw, Search } from 'lucide-react';
import { FilterPopover } from './FilterPopover';

interface SearchFiltersProps {
  canton: string;
  category: string;
  keyword: string;
  radius: number;
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
}

export const SearchFilters = ({
  canton,
  category,
  keyword,
  radius,
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
}: SearchFiltersProps) => {
  return (
    <form onSubmit={onSubmit} className="bg-card border rounded-lg p-6 mb-6">
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
              onClick={onResetFilters}
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
        onClick={onDetectLocation}
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
                  onClick={onDetectLocation}
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
                  onClick={onResetGPS}
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
              onValueChange={([value]) => onRadiusChange(value)}
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
          />
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
            />
            <Button type="submit" className="h-12 px-8">
              <Search className="h-4 w-4 mr-2" />
              {searchButtonText || 'Suchen'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};
