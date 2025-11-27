import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Toast message keys available in CMS
export type ToastKey = 
  | 'toast_profile_saved'
  | 'toast_profile_error'
  | 'toast_login_success'
  | 'toast_login_error'
  | 'toast_logout_success'
  | 'toast_register_success'
  | 'toast_register_error'
  | 'toast_photo_uploaded'
  | 'toast_photo_error'
  | 'toast_photo_deleted'
  | 'toast_favorite_added'
  | 'toast_favorite_removed'
  | 'toast_message_sent'
  | 'toast_message_error'
  | 'toast_password_reset_sent'
  | 'toast_password_changed'
  | 'toast_verification_submitted'
  | 'toast_report_submitted'
  | 'toast_setting_saved'
  | 'toast_generic_error';

// Default fallback messages (used if CMS fetch fails)
const defaultMessages: Record<ToastKey, string> = {
  toast_profile_saved: 'Profil erfolgreich gespeichert',
  toast_profile_error: 'Fehler beim Speichern des Profils',
  toast_login_success: 'Erfolgreich angemeldet',
  toast_login_error: 'Anmeldung fehlgeschlagen',
  toast_logout_success: 'Erfolgreich abgemeldet',
  toast_register_success: 'Konto erfolgreich erstellt',
  toast_register_error: 'Registrierung fehlgeschlagen',
  toast_photo_uploaded: 'Foto erfolgreich hochgeladen',
  toast_photo_error: 'Fehler beim Hochladen des Fotos',
  toast_photo_deleted: 'Foto erfolgreich gelöscht',
  toast_favorite_added: 'Zu Favoriten hinzugefügt',
  toast_favorite_removed: 'Aus Favoriten entfernt',
  toast_message_sent: 'Nachricht erfolgreich gesendet',
  toast_message_error: 'Fehler beim Senden der Nachricht',
  toast_password_reset_sent: 'Passwort-Reset E-Mail wurde gesendet',
  toast_password_changed: 'Passwort erfolgreich geändert',
  toast_verification_submitted: 'Verifizierung eingereicht',
  toast_report_submitted: 'Meldung erfolgreich eingereicht',
  toast_setting_saved: 'Einstellung erfolgreich gespeichert',
  toast_generic_error: 'Ein Fehler ist aufgetreten',
};

export const useToastMessages = () => {
  const { data: messages } = useQuery({
    queryKey: ['toast-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('category', 'messages');
      
      if (error) throw error;
      
      const messageMap: Record<string, string> = {};
      data?.forEach(item => {
        messageMap[item.key] = item.value;
      });
      return messageMap;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const getMessage = (key: ToastKey): string => {
    return messages?.[key] || defaultMessages[key];
  };

  const showSuccess = (key: ToastKey) => {
    toast.success(getMessage(key));
  };

  const showError = (key: ToastKey, customMessage?: string) => {
    toast.error(customMessage || getMessage(key));
  };

  const showCustomSuccess = (message: string) => {
    toast.success(message);
  };

  const showCustomError = (message: string) => {
    toast.error(message);
  };

  return {
    getMessage,
    showSuccess,
    showError,
    showCustomSuccess,
    showCustomError,
    messages: messages || defaultMessages,
  };
};
