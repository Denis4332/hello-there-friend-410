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
import { useCities } from '@/hooks/useCities';
import { detectLocation } from '@/lib/geolocation';
import { useToast } from '@/hooks/use-toast';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(50),
  age: z.number().min(18, 'Mindestalter ist 18').max(99),
  gender: z.string().optional(),
  city: z.string().min(2, 'Stadt ist erforderlich'),
  canton: z.string().min(1, 'Kanton ist erforderlich'),
  postal_code: z.string().optional(),
  about_me: z.string().max(500, 'Maximale Länge: 500 Zeichen').optional(),
  languages: z.array(z.string()).min(1, 'Mindestens eine Sprache erforderlich'),
  category_ids: z.array(z.string()).min(1, 'Mindestens eine Kategorie erforderlich'),
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

const LANGUAGES = ['Deutsch', 'Français', 'Italiano', 'English', 'Español'];
const GENDERS = ['Männlich', 'Weiblich', 'Divers'];

export const ProfileForm = ({ onSubmit, cantons, categories, isSubmitting, defaultValues, submitButtonText = 'Profil erstellen' }: ProfileFormProps) => {
  const { toast } = useToast();
  const { data: cities, isLoading: citiesLoading } = useCities();
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

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
    const city = cities?.find((c) => c.name === cityName);
    if (city) {
      setValue('city', city.name);
      if (city.canton?.abbreviation) {
        setValue('canton', city.canton.abbreviation);
      }
      if (city.postal_code) {
        setValue('postal_code', city.postal_code);
      }
      setCitySearchOpen(false);
    }
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const location = await detectLocation();
      
      // Find matching city in database
      const matchingCity = cities?.find((c) => 
        c.name.toLowerCase() === location.city.toLowerCase()
      );

      if (matchingCity) {
        handleCitySelect(matchingCity.name);
        toast({
          title: 'Standort erkannt',
          description: `${matchingCity.name} wurde automatisch ausgewählt`,
        });
      } else {
        // If city not in database, use free text
        setValue('city', location.city);
        setValue('postal_code', location.postalCode);
        
        // Try to match canton
        const matchingCanton = cantons.find((c) =>
          c.name.toLowerCase().includes(location.canton.toLowerCase()) ||
          location.canton.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchingCanton) {
          setValue('canton', matchingCanton.abbreviation);
        }
        
        toast({
          title: 'Standort erkannt',
          description: `${location.city} wurde eingetragen`,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      <div>
        <Label htmlFor="age">Alter *</Label>
        <Input
          id="age"
          type="number"
          {...register('age', { valueAsNumber: true })}
          placeholder="18"
        />
        {errors.age && (
          <p className="text-sm text-destructive mt-1">{errors.age.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="gender">Geschlecht</Label>
        <Select onValueChange={(value) => setValue('gender', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Wähle dein Geschlecht" />
          </SelectTrigger>
          <SelectContent>
            {GENDERS.map((gender) => (
              <SelectItem key={gender} value={gender}>
                {gender}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  {citiesLoading ? 'Lädt Städte...' : 'Keine Stadt gefunden'}
                </CommandEmpty>
                <CommandGroup>
                  {cities?.map((city) => (
                    <CommandItem
                      key={city.id}
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
                      {city.canton && (
                        <span className="ml-auto text-muted-foreground text-xs">
                          {city.canton.abbreviation}
                        </span>
                      )}
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
        <Input
          id="city"
          {...register('city')}
          placeholder="Zürich"
          className="mt-1"
        />
        {errors.city && (
          <p className="text-sm text-destructive mt-1">{errors.city.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="canton">Kanton *</Label>
        <Select onValueChange={(value) => setValue('canton', value)}>
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
          {LANGUAGES.map((lang) => (
            <div key={lang} className="flex items-center space-x-2">
              <Checkbox
                id={`lang-${lang}`}
                checked={selectedLanguages.includes(lang)}
                onCheckedChange={() => toggleLanguage(lang)}
              />
              <label htmlFor={`lang-${lang}`} className="text-sm cursor-pointer">
                {lang}
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

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Wird gespeichert...' : submitButtonText}
      </Button>
    </form>
  );
};
