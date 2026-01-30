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

// Geschlechts-Kategorien (Slugs)
const GENDER_SLUGS = ['damen', 'maenner', 'manner', 'transsexuelle-ts', 'trans', 'transsexuelle'];

export const CategoriesSection = ({ categories, selectedCategories, onToggle, errors }: CategoriesSectionProps) => {
  // Kategorien in Geschlecht und Services aufteilen
  const genderCategories = categories.filter(cat => 
    GENDER_SLUGS.some(slug => cat.slug.toLowerCase().includes(slug) || cat.name.toLowerCase().includes('dame') || cat.name.toLowerCase().includes('männer') || cat.name.toLowerCase().includes('trans'))
  );
  const serviceCategories = categories.filter(cat => !genderCategories.includes(cat));

  const renderCategory = (cat: { id: string; name: string; slug: string }) => (
    <div key={cat.id} className="flex items-center space-x-2">
      <Checkbox
        id={`cat-${cat.id}`}
        checked={selectedCategories.includes(cat.id)}
        onCheckedChange={() => onToggle(cat.id)}
      />
      <label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer">
        {cat.name}
      </label>
    </div>
  );

  return (
    <div>
      <Label>Ich bin / Ich biete *</Label>
      <p className="text-sm text-muted-foreground mb-2">
        Wähle dein Geschlecht und optional einen Service (max. 2)
      </p>
      
      {/* Geschlecht */}
      <div className="mt-3">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Geschlecht</p>
        <div className="grid grid-cols-2 gap-2">
          {genderCategories.map(renderCategory)}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Services */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Service / Angebot</p>
        <div className="grid grid-cols-2 gap-2">
          {serviceCategories.map(renderCategory)}
        </div>
      </div>

      {errors.category_ids && (
        <p className="text-sm text-destructive mt-1">{errors.category_ids.message}</p>
      )}
    </div>
  );
};
