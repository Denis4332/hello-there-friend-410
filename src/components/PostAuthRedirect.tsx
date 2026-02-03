import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles post-authentication redirect after magic link login.
 * Checks localStorage for a pending redirect path and navigates there.
 */
export const PostAuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only handle SIGNED_IN events (magic link login)
      if (event === 'SIGNED_IN' && session && mounted) {
        const redirectPath = localStorage.getItem('postAuthRedirect');
        if (redirectPath) {
          console.log('[PostAuthRedirect] Redirecting to:', redirectPath);
          localStorage.removeItem('postAuthRedirect');
          // Small delay to ensure auth state is fully propagated
          setTimeout(() => {
            if (mounted) {
              navigate(redirectPath, { replace: true });
            }
          }, 100);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
};
