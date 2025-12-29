import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthRateLimit } from '@/hooks/useAuthRateLimit';
import { useToastMessages } from '@/hooks/useToastMessages';

type UserRole = 'admin' | 'user' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  hasRole: (requiredRole: 'admin' | 'user') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const { checkRateLimit, recordAttempt } = useAuthRateLimit();
  const { showSuccess, showError, showCustomError, getMessage } = useToastMessages();

  // Initialize auth state - FIXED: No more race condition with setTimeout(0)
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session) {
          setUser(session.user);
          setSession(session);
          await loadUserRole(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

      if (session?.user) {
        setLoading(true);
        setTimeout(() => {
          loadUserRole(session.user.id);
        }, 0);
      } else {
        setRole('user');
        setLoading(false);
      }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      setRole(data?.role || 'user');
    } catch (error) {
      // Silent error handling - default to user role
      setRole('user');
    } finally {
      setLoading(false);
    }
  };

  // Password validation helper - FIXED: Stronger password requirements
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'Passwort muss mindestens 8 Zeichen lang sein';
    if (!/[A-Z]/.test(password)) return 'Passwort muss mindestens einen Großbuchstaben enthalten';
    if (!/[a-z]/.test(password)) return 'Passwort muss mindestens einen Kleinbuchstaben enthalten';
    if (!/[0-9]/.test(password)) return 'Passwort muss mindestens eine Zahl enthalten';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Passwort muss mindestens ein Sonderzeichen enthalten';
    return null;
  };

  const signUp = async (email: string, password: string) => {
    // Validate password strength (also validated server-side)
    const passwordError = validatePassword(password);
    if (passwordError) {
      showCustomError(passwordError);
      return { error: new Error(passwordError) };
    }

    // Check rate limit before attempting signup
    const rateLimitCheck = await checkRateLimit(email, 'signup');
    
    if (!rateLimitCheck.allowed) {
      const lockedUntil = rateLimitCheck.locked_until ? new Date(rateLimitCheck.locked_until) : null;
      const minutesRemaining = lockedUntil ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000) : 0;
      
      const errorMsg = minutesRemaining > 0 
        ? `Bitte versuchen Sie es in ${minutesRemaining} Minuten erneut.`
        : rateLimitCheck.message || 'Bitte versuchen Sie es später erneut.';
      
      showCustomError(errorMsg);
      return { error: new Error(rateLimitCheck.message || 'Rate limit exceeded') };
    }
    
    // Signup komplett über Backend-Function - KEINE Standard-Mail wird gesendet
    // Die Function erstellt den User mit admin.createUser() und sendet NUR unsere Resend-Mail
    console.log('[signUp] Calling auth-signup function for:', email);
    
    try {
      const { data, error } = await supabase.functions.invoke('auth-signup', {
        body: {
          email,
          password,
          redirect_url: `${window.location.origin}/profil/erstellen`,
        },
      });

      // Record the attempt result
      await recordAttempt(email, 'signup', !error && !data?.error);

      if (error) {
        console.error('[signUp] Function invoke error:', error);
        showError('toast_register_error', error.message);
        return { error };
      }

      if (data?.error) {
        console.error('[signUp] Function returned error:', data.error);
        showCustomError(data.error);
        return { error: new Error(data.error) };
      }

      if (data?.warning) {
        console.warn('[signUp] Function warning:', data.warning);
        showCustomError(data.warning);
      }

      console.log('[signUp] Signup successful');
      showSuccess('toast_register_success');
      return { error: null };
      
    } catch (err: any) {
      console.error('[signUp] Unexpected error:', err);
      await recordAttempt(email, 'signup', false);
      showCustomError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.');
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Check rate limit before attempting login
    const rateLimitCheck = await checkRateLimit(email, 'login');
    
    if (!rateLimitCheck.allowed) {
      const lockedUntil = rateLimitCheck.locked_until ? new Date(rateLimitCheck.locked_until) : null;
      const minutesRemaining = lockedUntil ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000) : 0;
      
      const errorMsg = minutesRemaining > 0 
        ? `Account wurde vorübergehend gesperrt. Bitte versuchen Sie es in ${minutesRemaining} Minuten erneut.`
        : rateLimitCheck.message || 'Bitte versuchen Sie es später erneut.';
      
      showCustomError(errorMsg);
      return { error: new Error(rateLimitCheck.message || 'Rate limit exceeded') };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Record the attempt result
    await recordAttempt(email, 'login', !error);

    if (error) {
      const remaining = rateLimitCheck.remaining_attempts ? rateLimitCheck.remaining_attempts - 1 : 0;
      const errorMsg = remaining > 0 
        ? `${error.message} Noch ${remaining} Versuche übrig.`
        : error.message;
      
      showError('toast_login_error', errorMsg);
    } else {
      showSuccess('toast_login_success');
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      showCustomError(error.message);
    } else {
      showSuccess('toast_logout_success');
    }
  };

  const resetPassword = async (email: string) => {
    // Check rate limit before sending reset email
    const rateLimitCheck = await checkRateLimit(email, 'password_reset');
    
    if (!rateLimitCheck.allowed) {
      const lockedUntil = rateLimitCheck.locked_until ? new Date(rateLimitCheck.locked_until) : null;
      const minutesRemaining = lockedUntil ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000) : 0;
      
      const errorMsg = minutesRemaining > 0 
        ? `Bitte versuchen Sie es in ${minutesRemaining} Minuten erneut.`
        : rateLimitCheck.message || 'Bitte versuchen Sie es später erneut.';
      
      showCustomError(errorMsg);
      return { error: new Error(rateLimitCheck.message || 'Rate limit exceeded') };
    }

    // Send password reset email via our custom edge function (uses Resend)
    try {
      const { error } = await supabase.functions.invoke('send-auth-email', {
        body: {
          type: 'password_reset',
          email: email,
          redirect_url: `${window.location.origin}/reset-password`,
        },
      });

      // Record the attempt
      await recordAttempt(email, 'password_reset', !error);

      if (error) {
        console.error('Password reset email error:', error);
        showCustomError('Fehler beim Senden der E-Mail. Bitte versuche es später erneut.');
        return { error: new Error(error.message || 'Failed to send email') };
      }

      showSuccess('toast_password_reset_sent');
      return { error: null };
    } catch (err: any) {
      console.error('Password reset error:', err);
      showCustomError('Fehler beim Senden der E-Mail. Bitte versuche es später erneut.');
      return { error: err };
    }
  };

  const updatePassword = async (newPassword: string) => {
    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showCustomError(passwordError);
      return { error: new Error(passwordError) };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      showCustomError(error.message);
    } else {
      showSuccess('toast_password_changed');
    }

    return { error };
  };

  const hasRole = (requiredRole: 'admin' | 'user') => {
    if (requiredRole === 'admin') {
      return role === 'admin';
    }
    return role === 'admin' || role === 'user';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
