import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles post-magic-link authentication callback.
 * Waits for session to be established, then redirects to the target path.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Processing auth callback...');
        
        // Get the target redirect path from query params
        const nextPath = searchParams.get('next') || '/profil/erstellen';
        console.log('[AuthCallback] Target path:', nextPath);

        // Check if we already have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthCallback] Session error:', sessionError);
          setStatus('error');
          setErrorMessage('Sitzung konnte nicht geladen werden.');
          return;
        }

        if (session) {
          console.log('[AuthCallback] Session found, redirecting to:', nextPath);
          setStatus('success');
          // Small delay to ensure auth state is propagated
          setTimeout(() => {
            navigate(nextPath, { replace: true });
          }, 500);
          return;
        }

        // No session yet - wait for auth state change
        console.log('[AuthCallback] No session yet, waiting for auth state change...');
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log('[AuthCallback] Auth state changed:', event);
          
          if (event === 'SIGNED_IN' && newSession) {
            console.log('[AuthCallback] User signed in, redirecting to:', nextPath);
            setStatus('success');
            subscription.unsubscribe();
            setTimeout(() => {
              navigate(nextPath, { replace: true });
            }, 500);
          }
        });

        // Timeout after 10 seconds if no session
        setTimeout(() => {
          if (status === 'loading') {
            console.log('[AuthCallback] Timeout reached, redirecting to auth');
            subscription.unsubscribe();
            setStatus('error');
            setErrorMessage('Anmeldung konnte nicht abgeschlossen werden.');
          }
        }, 10000);

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('[AuthCallback] Unexpected error:', error);
        setStatus('error');
        setErrorMessage('Ein unerwarteter Fehler ist aufgetreten.');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, status]);

  if (status === 'error') {
    const nextPath = searchParams.get('next') || '/profil/erstellen';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Anmeldung fehlgeschlagen</h1>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <button
            onClick={() => navigate(`/auth?next=${encodeURIComponent(nextPath)}`, { replace: true })}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Zur Anmeldung
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">
          {status === 'success' ? 'Anmeldung erfolgreich, du wirst weitergeleitet...' : 'Anmeldung wird bestätigt...'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
