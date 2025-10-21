import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

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
}

const LANGUAGES = ['Deutsch', 'Français', 'Italiano', 'English', 'Español'];
const GENDERS = ['Männlich', 'Weiblich', 'Divers'];

export const ProfileForm = ({ onSubmit, cantons, categories, isSubmitting }: ProfileFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
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
      setValue('category_ids', [...current, catId]);
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
        <Label htmlFor="city">Stadt *</Label>
        <Input id="city" {...register('city')} placeholder="Zürich" />
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
        {isSubmitting ? 'Wird gespeichert...' : 'Profil erstellen'}
      </Button>
    </form>
  );
};
