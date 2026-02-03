import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ProfileFormData } from '../ProfileForm';

interface BasicInfoSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  genders: Array<{ value: string; label: string }>;
  onGenderChange: (value: string) => void;
  isAdultChecked?: boolean;
}

export const BasicInfoSection = ({ register, errors, setValue, genders, onGenderChange, isAdultChecked }: BasicInfoSectionProps) => {
  return (
    <>
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
          checked={isAdultChecked}
          onCheckedChange={(checked) => setValue('is_adult', checked === true)}
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="is_adult" className="cursor-pointer">
            Ich bestätige, dass ich volljährig (18+) bin und akzeptiere die AGB und Datenschutzbestimmungen für Inserate *
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Lies unsere{' '}
            <Link to="/agb" className="text-primary underline hover:no-underline" target="_blank">
              AGB
            </Link>{' '}
            und{' '}
            <Link to="/datenschutz" className="text-primary underline hover:no-underline" target="_blank">
              Datenschutzbestimmungen
            </Link>
          </p>
          {errors.is_adult && (
            <p className="text-sm text-destructive">{errors.is_adult.message}</p>
          )}
        </div>
      </div>

    </>
  );
};
