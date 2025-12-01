import { FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ProfileFormData } from '../ProfileForm';

interface CategoriesSectionProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  selectedCategories: string[];
  onToggle: (catId: string) => void;
  errors: FieldErrors<ProfileFormData>;
}

export const CategoriesSection = ({ categories, selectedCategories, onToggle, errors }: CategoriesSectionProps) => {
  return (
    <div>
      <Label>Ich bin / Ich biete *</Label>
      <p className="text-sm text-muted-foreground mb-2">
        Wähle dein Geschlecht und optional einen Service (max. 2)
      </p>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {categories.map((cat) => (
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
        ))}
      </div>
      {errors.category_ids && (
        <p className="text-sm text-destructive mt-1">{errors.category_ids.message}</p>
      )}
    </div>
  );
};
