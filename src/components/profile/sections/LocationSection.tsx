import { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { MapPin, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { detectLocation } from '@/lib/geolocation';
import { useToast } from '@/hooks/use-toast';
import { ProfileFormData } from '../ProfileForm';
import { useCitiesByCantonSlim, CityWithCoordinates } from '@/hooks/useCitiesByCantonSlim';
import { cn } from '@/lib/utils';

interface LocationSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
  cantons: Array<{ id: string; name: string; abbreviation: string }>;
}

export const LocationSection = ({ register, errors, setValue, watch, cantons }: LocationSectionProps) => {
  const { toast } = useToast();
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  
  const selectedCanton = watch('canton') || '';
  const currentCity = watch('city') || '';
  const currentPostalCode = watch('postal_code') || '';

  // Fetch cities for selected canton
  const { data: cities = [], isLoading: citiesLoading } = useCitiesByCantonSlim(selectedCanton);

  // Handle city selection from combobox
  const handleCitySelect = (city: CityWithCoordinates) => {
    setValue('city', city.name);
    if (city.postal_code) {
      setValue('postal_code', city.postal_code);
    }
    if (city.lat && city.lng) {
      setValue('lat', city.lat);
      setValue('lng', city.lng);
    }
    setCityOpen(false);
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const location = await detectLocation();
      
      if (location.street) {
        setValue('street_address', location.street);
      }
      
      setValue('city', location.city);
      setValue('postal_code', location.postalCode);
      setValue('lat', location.lat);
      setValue('lng', location.lng);
      
      const matchingCanton = cantons.find((c) =>
        c.name.toLowerCase().includes(location.canton.toLowerCase()) ||
        c.abbreviation.toLowerCase() === location.canton.toLowerCase() ||
        location.canton.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (matchingCanton) {
        setValue('canton', matchingCanton.abbreviation);
        toast({
          title: 'Standort erkannt',
          description: location.street 
            ? `${location.street}, ${location.city}, ${matchingCanton.abbreviation}` 
            : `${location.city}, ${matchingCanton.abbreviation}`,
        });
      } else {
        toast({
          title: 'Standort erkannt',
          description: location.street 
            ? `${location.street}, ${location.city} (Kanton bitte manuell wählen)` 
            : `${location.city} (Kanton bitte manuell wählen)`,
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Standort konnte nicht ermittelt werden',
        variant: 'destructive',
      });
    } finally {
      setDetectingLocation(false);
    }
  };

  return (
    <>
      <div>
        <Label htmlFor="canton">Kanton *</Label>
        <Select 
          onValueChange={(value) => {
            setValue('canton', value);
            // Reset city when canton changes
            if (selectedCanton !== value) {
              setValue('city', '');
              setValue('postal_code', '');
              setValue('lat', undefined);
              setValue('lng', undefined);
            }
          }}
          value={selectedCanton}
        >
          <SelectTrigger>
            <SelectValue placeholder="Wähle deinen Kanton" />
          </SelectTrigger>
          <SelectContent>
            {cantons.map((canton) => (
              <SelectItem key={canton.id} value={canton.abbreviation}>
                {canton.name} ({canton.abbreviation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.canton && (
          <p className="text-sm text-destructive mt-1">{errors.canton.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="city">Stadt *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDetectLocation}
            disabled={detectingLocation}
            className="h-8"
          >
            {detectingLocation ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Wird erkannt...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-1" />
                Mein Standort
              </>
            )}
          </Button>
        </div>
        
        {/* City Combobox with Search */}
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={cityOpen}
              className="w-full justify-between font-normal"
              disabled={!selectedCanton || citiesLoading}
            >
              {citiesLoading ? (
                <span className="text-muted-foreground">Lade Städte...</span>
              ) : currentCity ? (
                <span>{currentCity}</span>
              ) : (
                <span className="text-muted-foreground">
                  {selectedCanton ? "Stadt wählen..." : "Zuerst Kanton wählen"}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full min-w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Stadt suchen..." />
              <CommandList>
                <CommandEmpty>Keine Stadt gefunden</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-y-auto">
                  {cities.map((city) => (
                    <CommandItem
                      key={city.id}
                      value={city.name}
                      onSelect={() => handleCitySelect(city)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentCity === city.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {city.name} {city.postal_code && `(${city.postal_code})`}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {errors.city && (
          <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="postal_code">PLZ</Label>
        <Input 
          id="postal_code" 
          {...register('postal_code')} 
          placeholder="Wird automatisch gesetzt"
          readOnly
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Wird automatisch aus der Stadt übernommen
        </p>
      </div>

      <div>
        <Label htmlFor="street_address">Straße (optional)</Label>
        <Input 
          id="street_address" 
          {...register('street_address')} 
          placeholder="Musterstrasse 123" 
        />
        <p className="text-xs text-muted-foreground mt-1">
          Die Straße wird nur angezeigt, wenn du das unten erlaubst
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="show_street"
          checked={watch('show_street')}
          onCheckedChange={(checked) => setValue('show_street', checked as boolean)}
        />
        <label htmlFor="show_street" className="text-sm cursor-pointer">
          Straße öffentlich anzeigen (empfohlen: nur Stadt zeigen für mehr Privatsphäre)
        </label>
      </div>
    </>
  );
};
