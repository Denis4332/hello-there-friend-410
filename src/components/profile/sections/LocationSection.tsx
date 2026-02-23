import { useState, useRef, useEffect } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProfileFormData } from '../ProfileForm';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface LocationSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
  cantons: Array<{ id: string; name: string; abbreviation: string }>;
}

// Canton name -> abbreviation mapping for Google Places
const CANTON_MAP: Record<string, string> = {
  'zürich': 'ZH', 'zurich': 'ZH',
  'bern': 'BE', 'berne': 'BE',
  'luzern': 'LU', 'lucerne': 'LU',
  'uri': 'UR',
  'schwyz': 'SZ',
  'obwalden': 'OW',
  'nidwalden': 'NW',
  'glarus': 'GL',
  'zug': 'ZG',
  'freiburg': 'FR', 'fribourg': 'FR',
  'solothurn': 'SO',
  'basel-stadt': 'BS', 'basel': 'BS',
  'basel-landschaft': 'BL',
  'schaffhausen': 'SH',
  'appenzell ausserrhoden': 'AR',
  'appenzell innerrhoden': 'AI',
  'st. gallen': 'SG', 'saint gallen': 'SG',
  'graubünden': 'GR', 'grisons': 'GR',
  'aargau': 'AG',
  'thurgau': 'TG',
  'tessin': 'TI', 'ticino': 'TI',
  'waadt': 'VD', 'vaud': 'VD',
  'wallis': 'VS', 'valais': 'VS',
  'neuenburg': 'NE', 'neuchâtel': 'NE',
  'genf': 'GE', 'genève': 'GE', 'geneva': 'GE',
  'jura': 'JU',
};

function findCantonAbbreviation(name: string, cantons: Array<{ name: string; abbreviation: string }>): string | null {
  const lower = name.toLowerCase().trim();
  // Direct map lookup
  if (CANTON_MAP[lower]) return CANTON_MAP[lower];
  // Try matching against cantons array
  const match = cantons.find(
    (c) => c.name.toLowerCase() === lower || c.abbreviation.toLowerCase() === lower
  );
  return match?.abbreviation || null;
}

export const LocationSection = ({ register, errors, setValue, watch, cantons }: LocationSectionProps) => {
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const selectedCanton = watch('canton') || '';
  const currentCity = watch('city') || '';

  const googleApiKey = 'AIzaSyB2IiCDINcTgGPMnNLi8hvmEPcf_-rH3Gs';

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!googleApiKey || googleLoaded) return;

    setOptions({ key: googleApiKey, v: 'weekly' });
    importLibrary('places').then(() => {
      setGoogleLoaded(true);
    }).catch((err) => {
      console.warn('Google Places could not be loaded:', err);
    });
  }, [googleApiKey, googleLoaded]);

  // Attach autocomplete to input when Google is loaded
  useEffect(() => {
    if (!googleLoaded || !addressInputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
      componentRestrictions: { country: 'ch' },
      fields: ['address_components', 'geometry', 'name'],
      types: ['geocode', 'establishment'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      let city = '';
      let postalCode = '';
      let cantonName = '';

      for (const comp of place.address_components) {
        if (comp.types.includes('locality') || comp.types.includes('political')) {
          if (!city) city = comp.long_name;
        }
        if (comp.types.includes('postal_code')) {
          postalCode = comp.long_name;
        }
        if (comp.types.includes('administrative_area_level_1')) {
          cantonName = comp.long_name;
        }
      }

      if (city) setValue('city', city);
      if (postalCode) setValue('postal_code', postalCode);

      // Map canton name to abbreviation
      if (cantonName) {
        const abbr = findCantonAbbreviation(cantonName, cantons);
        if (abbr) setValue('canton', abbr);
      }

      // GPS coordinates
      if (place.geometry?.location) {
        setValue('lat', place.geometry.location.lat());
        setValue('lng', place.geometry.location.lng());
      }
    });

    autocompleteRef.current = autocomplete;
  }, [googleLoaded, cantons, setValue]);


  return (
    <>
      <div>
        <Label htmlFor="canton">Kanton *</Label>
        <Select
          onValueChange={(value) => {
            setValue('canton', value);
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
        <Label htmlFor="city">Stadt / Adresse</Label>

        {googleApiKey ? (
          <Input
            ref={addressInputRef}
            placeholder="Adresse eingeben..."
            defaultValue={currentCity}
            onChange={(e) => setValue('city', e.target.value)}
          />
        ) : (
          <Input
            {...register('city')}
            placeholder="Stadt eingeben..."
          />
        )}
        {errors.city && (
          <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="postal_code">PLZ</Label>
        <Input
          id="postal_code"
          {...register('postal_code')}
          placeholder="PLZ eingeben oder automatisch"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Wird nicht öffentlich angezeigt
        </p>
      </div>
    </>
  );
};
