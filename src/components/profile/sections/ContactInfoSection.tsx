import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileFormData } from '../ProfileForm';

interface ContactInfoSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
}

export const ContactInfoSection = ({ register, errors }: ContactInfoSectionProps) => {
  return (
    <div className="space-y-4 pt-6 border-t">
      <div>
        <h3 className="text-lg font-semibold">Kontaktmöglichkeiten</h3>
        <p className="text-sm text-muted-foreground">
          Füge mindestens eine Kontaktmöglichkeit hinzu, damit Interessenten dich erreichen können.
        </p>
      </div>

      <div>
        <Label htmlFor="phone">Telefonnummer</Label>
        <Input
          id="phone"
          {...register('phone')}
          placeholder="+41 79 123 45 67"
        />
        {errors.phone && (
          <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <Input
          id="whatsapp"
          {...register('whatsapp')}
          placeholder="+41 79 123 45 67"
        />
        {errors.whatsapp && (
          <p className="text-sm text-destructive mt-1">{errors.whatsapp.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="name@beispiel.ch"
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          {...register('website')}
          placeholder="https://..."
        />
        {errors.website && (
          <p className="text-sm text-destructive mt-1">{errors.website.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="telegram">Telegram</Label>
        <Input
          id="telegram"
          {...register('telegram')}
          placeholder="@username"
        />
        {errors.telegram && (
          <p className="text-sm text-destructive mt-1">{errors.telegram.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="instagram">Instagram</Label>
        <Input
          id="instagram"
          {...register('instagram')}
          placeholder="@username"
        />
        {errors.instagram && (
          <p className="text-sm text-destructive mt-1">{errors.instagram.message}</p>
        )}
      </div>
    </div>
  );
};
