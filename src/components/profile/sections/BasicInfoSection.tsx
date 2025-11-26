import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProfileFormData } from '../ProfileForm';

interface BasicInfoSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  setValue: UseFormSetValue<ProfileFormData>;
  genders: Array<{ value: string; label: string }>;
  onGenderChange: (value: string) => void;
}

export const BasicInfoSection = ({ register, errors, setValue, genders, onGenderChange }: BasicInfoSectionProps) => {
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
          onCheckedChange={(checked) => setValue('is_adult', checked === true)}
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
        <Select onValueChange={onGenderChange}>
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
    </>
  );
};
