import { FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ProfileFormData } from '../ProfileForm';

interface CategoriesSectionProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  selectedCategories: string[];
  onToggle: (catId: string) => void;
  errors: FieldErrors<ProfileFormData>;
}

// Geschlechts-Kategorien (exakte Slugs)
const GENDER_SLUGS = ['damen', 'maenner', 'transsexuelle'];

export const CategoriesSection = ({ categories, selectedCategories, onToggle, errors }: CategoriesSectionProps) => {
  // Kategorien in Geschlecht und Services aufteilen
  const genderCategories = categories.filter(cat => GENDER_SLUGS.includes(cat.slug));
  const serviceCategories = categories.filter(cat => !GENDER_SLUGS.includes(cat.slug));

  // UI-Lock: Welches Geschlecht ist gewählt?
  const selectedGenderId = genderCategories.find(g => selectedCategories.includes(g.id))?.id;
  
  // UI-Lock: Welche Services sind gewählt?
  const selectedServiceIds = serviceCategories
    .filter(s => selectedCategories.includes(s.id))
    .map(s => s.id);

  return (
    <div>
      <Label>Ich bin / Ich biete *</Label>
      <p className="text-sm text-muted-foreground mb-2">
        Wähle dein Geschlecht (Pflicht) und bis zu 2 Services (optional)
      </p>
      
      {/* Geschlecht */}
      <div className="mt-3">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Geschlecht</p>
        <div className="grid grid-cols-2 gap-2">
          {genderCategories.map(cat => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => onToggle(cat.id)}
                disabled={!!selectedGenderId && selectedGenderId !== cat.id}
              />
              <label 
                htmlFor={`cat-${cat.id}`} 
                className={`text-sm cursor-pointer ${selectedGenderId && selectedGenderId !== cat.id ? 'text-muted-foreground' : ''}`}
              >
                {cat.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Services */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Service / Angebot</p>
        <div className="grid grid-cols-2 gap-2">
          {serviceCategories.map(cat => (
            <div key={cat.id} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat.id}`}
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => onToggle(cat.id)}
                disabled={selectedServiceIds.length >= 2 && !selectedServiceIds.includes(cat.id)}
              />
              <label 
                htmlFor={`cat-${cat.id}`} 
                className={`text-sm cursor-pointer ${selectedServiceIds.length >= 2 && !selectedServiceIds.includes(cat.id) ? 'text-muted-foreground' : ''}`}
              >
                {cat.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {errors.category_ids && (
        <p className="text-sm text-destructive mt-1">{errors.category_ids.message}</p>
      )}
    </div>
  );
};
