import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCitiesByCantonSlim } from '@/hooks/useCitiesByCantonSlim';
import { detectLocation } from '@/lib/geolocation';
import { geocodePlz } from '@/lib/geocoding';
import { useToast } from '@/hooks/use-toast';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(50),
  is_adult: z.boolean().refine((val) => val === true, {
    message: 'Du musst bestätigen, dass du volljährig bist',
  }),
  gender: z.string().optional(),
  city: z.string().min(2, 'Stadt ist erforderlich'),
  canton: z.string().min(1, 'Kanton ist erforderlich'),
  postal_code: z.string().optional(),
  about_me: z.string().max(500, 'Maximale Länge: 500 Zeichen').optional(),
  languages: z.array(z.string()).min(1, 'Mindestens eine Sprache erforderlich'),
  category_ids: z.array(z.string()).min(1, 'Mindestens eine Kategorie erforderlich'),
  // GPS coordinates (automatically geocoded from PLZ)
  lat: z.number().optional(),
  lng: z.number().optional(),
  // Contact fields (all optional)
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal("")),
  website: z.string().url('Ungültige URL').optional().or(z.literal("")),
  telegram: z.string().optional(),
  instagram: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  onSubmit: (data: ProfileFormData) => Promise<void>;
  cantons: Array<{ id: string; name: string; abbreviation: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  isSubmitting?: boolean;
  defaultValues?: Partial<ProfileFormData>;
  submitButtonText?: string;
}

export const ProfileForm = ({ onSubmit, cantons, categories, isSubmitting, defaultValues, submitButtonText = 'Profil erstellen' }: ProfileFormProps) => {
  const { toast } = useToast();
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  const { data: languages = [] } = useDropdownOptions('languages');
  const { data: genders = [] } = useDropdownOptions('genders');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaultValues || {
      languages: [],
      category_ids: [],
    },
  });

  const selectedLanguages = watch('languages') || [];
  const selectedCategories = watch('category_ids') || [];
  const selectedCity = watch('city') || '';
  const selectedCanton = watch('canton') || '';
  
  // Load cities only after canton is selected
  const { data: cities, isLoading: citiesLoading } = useCitiesByCantonSlim(selectedCanton);

  const toggleLanguage = (lang: string) => {
    const current = selectedLanguages;
    if (current.includes(lang)) {
      setValue('languages', current.filter((l) => l !== lang));
    } else {
      setValue('languages', [...current, lang]);
    }
  };

  const toggleCategory = (catId: string) => {
    const current = selectedCategories;
    if (current.includes(catId)) {
      setValue('category_ids', current.filter((c) => c !== catId));
    } else {
      setValue('category_ids', [...current, catId]);
    }
  };

  const handleCitySelect = (cityName: string) => {
    // Validate that city belongs to selected canton
    const isValidCity = cities?.some(c => c.name === cityName);
    if (!isValidCity && selectedCanton) {
      toast({
        title: 'Fehler',
        description: `Diese Stadt gehört nicht zum Kanton ${selectedCanton}. Bitte wähle eine Stadt aus der Liste.`,
        variant: 'destructive',
      });
      return;
    }
    setValue('city', cityName);
    setCitySearchOpen(false);
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const location = await detectLocation();
      
      // Set city first
      setValue('city', location.city);
      setValue('postal_code', location.postalCode);
      
      // Try to match canton
      const matchingCanton = cantons.find((c) =>
        c.name.toLowerCase().includes(location.canton.toLowerCase()) ||
        c.abbreviation.toLowerCase() === location.canton.toLowerCase() ||
        location.canton.toLowerCase().includes(c.name.toLowerCase())
      );
      
      if (matchingCanton) {
        setValue('canton', matchingCanton.abbreviation);
        toast({
          title: 'Standort erkannt',
          description: `${location.city}, ${matchingCanton.abbreviation} wurde eingetragen`,
        });
      } else {
        toast({
          title: 'Standort erkannt',
          description: `${location.city} wurde eingetragen (Kanton bitte manuell wählen)`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Standort konnte nicht ermittelt werden',
        variant: 'destructive',
      });
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleFormSubmit = async (data: ProfileFormData) => {
    // Geocode PLZ to GPS coordinates if postal_code is provided
    if (data.postal_code && data.city && !data.lat && !data.lng) {
      const coords = await geocodePlz(data.postal_code, data.city);
      if (coords) {
        data.lat = coords.lat;
        data.lng = coords.lng;
        console.log('Geocoded coordinates:', coords);
      } else {
        console.warn('Could not geocode postal code:', data.postal_code);
      }
    }
    
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="display_name">Anzeigename *</Label>
        <Input
          id="display_name"
          {...register('display_name')}
          placeholder="Dein öffentlicher Name"
        />
        {errors.display_name && (
          <p className="text-sm text-destructive mt-1">{errors.display_name.message}</p>
        )}
      </div>

      <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
        <Checkbox
          id="is_adult"
          {...register('is_adult')}
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="is_adult" className="cursor-pointer">
            Ich bestätige, dass ich volljährig bin (18+) *
          </Label>
          {errors.is_adult && (
            <p className="text-sm text-destructive">{errors.is_adult.message}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="gender">Geschlecht</Label>
        <Select onValueChange={(value) => setValue('gender', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Wähle dein Geschlecht" />
          </SelectTrigger>
          <SelectContent>
            {genders.map((gender) => (
              <SelectItem key={gender.value} value={gender.value}>
                {gender.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="canton">Kanton *</Label>
        <Select 
          onValueChange={(value) => {
            setValue('canton', value);
            // Reset city when canton changes
            if (selectedCity && selectedCanton !== value) {
              setValue('city', '');
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
            disabled={detectingLocation || citiesLoading}
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
        {selectedCanton && cities && cities.length > 0 ? (
          <>
            <Popover open={citySearchOpen} onOpenChange={setCitySearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={citySearchOpen}
                  className="w-full justify-between"
                >
                  {selectedCity || 'Stadt auswählen...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Stadt suchen..." />
                  <CommandList>
                    <CommandEmpty>
                      {citiesLoading 
                        ? 'Lädt Städte...' 
                        : selectedCanton
                          ? 'Keine Stadt in diesem Kanton gefunden. Du kannst die Stadt manuell eingeben.'
                          : 'Bitte wähle zuerst einen Kanton.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {cities?.map((city) => (
                        <CommandItem
                          key={city.slug}
                          value={city.name}
                          onSelect={handleCitySelect}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedCity === city.name ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {city.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground mt-1">
              Oder gib eine Stadt manuell ein:
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground mb-1">
            {!selectedCanton ? '← Wähle zuerst einen Kanton' : 'Keine Städte in der Datenbank - gib Stadt manuell ein:'}
          </p>
        )}
        <Input
          id="city"
          {...register('city')}
          placeholder={selectedCanton ? "Stadt eingeben" : "Zuerst Kanton wählen"}
          disabled={!selectedCanton}
          className="mt-1"
        />
        {errors.city && (
          <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="postal_code">PLZ</Label>
        <Input id="postal_code" {...register('postal_code')} placeholder="8000" />
      </div>

      <div>
        <Label htmlFor="about_me">Über mich</Label>
        <Textarea
          id="about_me"
          {...register('about_me')}
          placeholder="Erzähle ein bisschen über dich..."
          rows={4}
        />
        {errors.about_me && (
          <p className="text-sm text-destructive mt-1">{errors.about_me.message}</p>
        )}
      </div>

      <div>
        <Label>Sprachen *</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {languages.map((lang) => (
            <div key={lang.value} className="flex items-center space-x-2">
              <Checkbox
                id={`lang-${lang.value}`}
                checked={selectedLanguages.includes(lang.value)}
                onCheckedChange={() => toggleLanguage(lang.value)}
              />
              <label htmlFor={`lang-${lang.value}`} className="text-sm cursor-pointer">
                {lang.label}
              </label>
            </div>
          ))}
        </div>
        {errors.languages && (
          <p className="text-sm text-destructive mt-1">{errors.languages.message}</p>
        )}
      </div>

      <div>
        <Label>Kategorien / Interessen *</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
              <label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer">
                {cat.name}
              </label>
            </div>
          ))}
        </div>
        {errors.category_ids && (
          <p className="text-sm text-destructive mt-1">{errors.category_ids.message}</p>
        )}
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4 pt-6 border-t">
        <div>
          <h3 className="text-lg font-semibold">Kontaktmöglichkeiten</h3>
          <p className="text-sm text-muted-foreground">
            Füge mindestens eine Kontaktmöglichkeit hinzu, damit Interessenten dich erreichen können.
          </p>
        </div>

        <div>
          <Label htmlFor="phone">Telefonnummer</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="+41 79 123 45 67"
          />
          {errors.phone && (
            <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            {...register('whatsapp')}
            placeholder="+41 79 123 45 67"
          />
          {errors.whatsapp && (
            <p className="text-sm text-destructive mt-1">{errors.whatsapp.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="name@beispiel.ch"
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            {...register('website')}
            placeholder="https://..."
          />
          {errors.website && (
            <p className="text-sm text-destructive mt-1">{errors.website.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="telegram">Telegram</Label>
          <Input
            id="telegram"
            {...register('telegram')}
            placeholder="@username"
          />
          {errors.telegram && (
            <p className="text-sm text-destructive mt-1">{errors.telegram.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            {...register('instagram')}
            placeholder="@username"
          />
          {errors.instagram && (
            <p className="text-sm text-destructive mt-1">{errors.instagram.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Wird gespeichert...' : submitButtonText}
      </Button>
    </form>
  );
};
