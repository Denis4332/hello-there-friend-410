import { supabase } from '@/integrations/supabase/client';

interface RateLimitCheck {
  allowed: boolean;
  remaining_attempts?: number;
  locked_until?: string;
  message?: string;
}

export const useAuthRateLimit = () => {
  const checkRateLimit = async (email: string, type: 'login' | 'signup' | 'password_reset'): Promise<RateLimitCheck> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-auth-rate-limit', {
        body: {
          email: email.toLowerCase().trim(),
          type: type
        }
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        return { allowed: true, remaining_attempts: 5 }; // Fail open for safety
      }

      return data as RateLimitCheck;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, remaining_attempts: 5 }; // Fail open for safety
    }
  };

  const recordAttempt = async (email: string, type: 'login' | 'signup' | 'password_reset', success: boolean): Promise<void> => {
    try {
      const { error } = await supabase.functions.invoke('record-auth-attempt', {
        body: {
          email: email.toLowerCase().trim(),
          type: type,
          success: success
        }
      });

      if (error && import.meta.env.DEV) {
        console.error('Failed to record auth attempt:', error);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Record attempt error:', error);
      }
    }
  };

  return { checkRateLimit, recordAttempt };
};
