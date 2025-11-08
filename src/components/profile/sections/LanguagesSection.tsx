import { FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ProfileFormData } from '../ProfileForm';

interface LanguagesSectionProps {
  languages: Array<{ value: string; label: string }>;
  selectedLanguages: string[];
  onToggle: (lang: string) => void;
  errors: FieldErrors<ProfileFormData>;
}

export const LanguagesSection = ({ languages, selectedLanguages, onToggle, errors }: LanguagesSectionProps) => {
  return (
    <div>
      <Label>Sprachen *</Label>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {languages.map((lang) => (
          <div key={lang.value} className="flex items-center space-x-2">
            <Checkbox
              id={`lang-${lang.value}`}
              checked={selectedLanguages.includes(lang.value)}
              onCheckedChange={() => onToggle(lang.value)}
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
  );
};
