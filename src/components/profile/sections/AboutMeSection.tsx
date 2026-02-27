import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProfileFormData } from '../ProfileForm';

interface AboutMeSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  watch: UseFormWatch<ProfileFormData>;
}

export const AboutMeSection = ({ register, errors, watch }: AboutMeSectionProps) => {
  const aboutMe = watch('about_me') || '';

  return (
    <div>
      <Label htmlFor="about_me">Über mich</Label>
      <Textarea
        id="about_me"
        {...register('about_me')}
        placeholder="Erzähle ein bisschen über dich..."
        rows={4}
      />
      <div className="flex justify-between mt-1">
        {errors.about_me ? (
          <p className="text-sm text-destructive">{errors.about_me.message}</p>
        ) : (
          <span />
        )}
        <span className={`text-sm ${aboutMe.length > 1500 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {aboutMe.length} / 1500
        </span>
      </div>
    </div>
  );
};
