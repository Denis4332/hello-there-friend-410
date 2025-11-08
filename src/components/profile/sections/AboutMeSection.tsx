import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProfileFormData } from '../ProfileForm';

interface AboutMeSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
}

export const AboutMeSection = ({ register, errors }: AboutMeSectionProps) => {
  return (
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
  );
};
