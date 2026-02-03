import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { geocodePlz } from '@/lib/geocoding';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { useToastMessages } from '@/hooks/useToastMessages';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { LocationSection } from './sections/LocationSection';
import { AboutMeSection } from './sections/AboutMeSection';
import { LanguagesSection } from './sections/LanguagesSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { ContactInfoSection } from './sections/ContactInfoSection';

const profileSchema = z.object({
  display_name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(50),
  is_adult: z.boolean().refine((val) => val === true, {
    message: 'Du musst bestätigen, dass du volljährig bist',
  }),
  gender: z.string().optional(),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  canton: z.string().min(1, 'Kanton ist erforderlich'),
  postal_code: z.string().optional(),
  about_me: z.string()
    .max(500, 'Maximale Länge: 500 Zeichen')
    .refine((val) => !val || !/<script|javascript:|onerror=/i.test(val), {
      message: 'Ungültige Zeichen im Text'
    })
    .optional(),
  languages: z.array(z.string()).min(1, 'Mindestens eine Sprache erforderlich'),
  category_ids: z.array(z.string()).min(1, 'Mindestens eine Kategorie erforderlich').max(3, 'Maximal 3 Kategorien erlaubt'),
  // GPS coordinates (automatically geocoded from PLZ)
  lat: z.number().optional(),
  lng: z.number().optional(),
  // Contact fields with enhanced validation
  phone: z.string()
    .regex(/^[\d\s\+\-\(\)]+$/, 'Ungültige Telefonnummer (nur Zahlen, Leerzeichen, +, -, ( ) erlaubt)')
    .min(7, 'Telefonnummer zu kurz (mindestens 7 Zeichen)')
    .max(20, 'Telefonnummer zu lang (maximal 20 Zeichen)')
    .optional()
    .or(z.literal("")),
  whatsapp: z.string()
    .regex(/^[\d\s\+\-\(\)]+$/, 'Ungültige WhatsApp-Nummer (nur Zahlen, Leerzeichen, +, -, ( ) erlaubt)')
    .min(7, 'Nummer zu kurz (mindestens 7 Zeichen)')
    .max(20, 'Nummer zu lang (maximal 20 Zeichen)')
    .optional()
    .or(z.literal("")),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal("")),
  website: z.string().url('Ungültige URL').optional().or(z.literal("")),
  telegram: z.string()
    .regex(/^[a-zA-Z0-9_]{5,32}$/, 'Ungültiger Telegram-Username (5-32 Zeichen, nur Buchstaben, Zahlen und _)')
    .optional()
    .or(z.literal("")),
  instagram: z.string()
    .regex(/^[a-zA-Z0-9._]{1,30}$/, 'Ungültiger Instagram-Username (max 30 Zeichen, nur Buchstaben, Zahlen, . und _)')
    .optional()
    .or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  onSubmit: (data: ProfileFormData) => Promise<void>;
  cantons: Array<{ id: string; name: string; abbreviation: string }>;
  categories: Array<{ id: string; name: string; slug: string }>;
  isSubmitting?: boolean;
  defaultValues?: Partial<ProfileFormData>;
  submitButtonText?: string;
  formId?: string;
  showSubmitButton?: boolean;
}

export const ProfileForm = ({ onSubmit, cantons, categories, isSubmitting, defaultValues, submitButtonText = 'Profil erstellen', formId, showSubmitButton = true }: ProfileFormProps) => {
  const { data: languages = [] } = useDropdownOptions('languages');
  const { data: genders = [] } = useDropdownOptions('genders');
  const { showCustomError } = useToastMessages();

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
      // UI-Lock in CategoriesSection handles limits, just add
      setValue('category_ids', [...current, catId]);
    }
  };

  const handleFormSubmit = async (data: ProfileFormData) => {
    // Geocode PLZ to GPS coordinates if postal_code is provided
    if (data.postal_code && data.city && !data.lat && !data.lng) {
      const coords = await geocodePlz(data.postal_code, data.city);
      if (coords) {
        data.lat = coords.lat;
        data.lng = coords.lng;
      }
    }
    
    await onSubmit(data);
  };

  return (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <BasicInfoSection
        register={register}
        errors={errors}
        setValue={setValue}
        genders={genders}
        onGenderChange={(value) => setValue('gender', value)}
      />

      <LocationSection
        register={register}
        errors={errors}
        setValue={setValue}
        watch={watch}
        cantons={cantons}
      />

      <AboutMeSection register={register} errors={errors} />

      <LanguagesSection
        languages={languages}
        selectedLanguages={selectedLanguages}
        onToggle={toggleLanguage}
        errors={errors}
      />

      <CategoriesSection
        categories={categories}
        selectedCategories={selectedCategories}
        onToggle={toggleCategory}
        errors={errors}
      />

      <ContactInfoSection register={register} errors={errors} />

      {showSubmitButton && (
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Wird gespeichert...' : submitButtonText}
        </Button>
      )}
    </form>
  );
};
