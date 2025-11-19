import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthRateLimit } from '@/hooks/useAuthRateLimit';

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
  const { toast } = useToast();
  const { checkRateLimit, recordAttempt } = useAuthRateLimit();

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
          await loadUserRole(session.user.id);
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
    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast({
        title: 'Schwaches Passwort',
        description: passwordError,
        variant: 'destructive',
      });
      return { error: new Error(passwordError) };
    }

    // Check rate limit before attempting signup
    const rateLimitCheck = await checkRateLimit(email, 'signup');
    
    if (!rateLimitCheck.allowed) {
      const lockedUntil = rateLimitCheck.locked_until ? new Date(rateLimitCheck.locked_until) : null;
      const minutesRemaining = lockedUntil ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000) : 0;
      
      toast({
        title: 'Zu viele Anmeldeversuche',
        description: minutesRemaining > 0 
          ? `Bitte versuchen Sie es in ${minutesRemaining} Minuten erneut.`
          : rateLimitCheck.message || 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
      
      return { error: new Error(rateLimitCheck.message || 'Rate limit exceeded') };
    }
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    // Record the attempt result
    await recordAttempt(email, 'signup', !error);

    if (error) {
      toast({
        title: 'Registrierung fehlgeschlagen',
        description: error.message,
        variant: 'destructive',
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Check rate limit before attempting login
    const rateLimitCheck = await checkRateLimit(email, 'login');
    
    if (!rateLimitCheck.allowed) {
      const lockedUntil = rateLimitCheck.locked_until ? new Date(rateLimitCheck.locked_until) : null;
      const minutesRemaining = lockedUntil ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000) : 0;
      
      toast({
        title: 'Zu viele Anmeldeversuche',
        description: minutesRemaining > 0 
          ? `Account wurde vorübergehend gesperrt. Bitte versuchen Sie es in ${minutesRemaining} Minuten erneut.`
          : rateLimitCheck.message || 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
      
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
      
      toast({
        title: 'Login fehlgeschlagen',
        description: remaining > 0 
          ? `${error.message} Noch ${remaining} Versuche übrig.`
          : error.message,
        variant: 'destructive',
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: 'Abmeldung fehlgeschlagen',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetPassword = async (email: string) => {
    // Check rate limit before sending reset email
    const rateLimitCheck = await checkRateLimit(email, 'password_reset');
    
    if (!rateLimitCheck.allowed) {
      const lockedUntil = rateLimitCheck.locked_until ? new Date(rateLimitCheck.locked_until) : null;
      const minutesRemaining = lockedUntil ? Math.ceil((lockedUntil.getTime() - Date.now()) / 60000) : 0;
      
      toast({
        title: 'Zu viele Anfragen',
        description: minutesRemaining > 0 
          ? `Bitte versuchen Sie es in ${minutesRemaining} Minuten erneut.`
          : rateLimitCheck.message || 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
      
      return { error: new Error(rateLimitCheck.message || 'Rate limit exceeded') };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    // Record the attempt
    await recordAttempt(email, 'password_reset', !error);

    if (error) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'E-Mail gesendet',
        description: 'Bitte überprüfen Sie Ihr E-Mail-Postfach für den Passwort-Reset-Link.',
      });
    }

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    // Validate password strength
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        title: 'Schwaches Passwort',
        description: passwordError,
        variant: 'destructive',
      });
      return { error: new Error(passwordError) };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Erfolg',
        description: 'Ihr Passwort wurde erfolgreich geändert.',
      });
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
