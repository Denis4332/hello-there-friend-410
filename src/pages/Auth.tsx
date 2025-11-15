import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { ForgotPasswordDialog } from '@/components/ForgotPasswordDialog';
import { useAuthRateLimit } from '@/hooks/useAuthRateLimit';
import { useToast } from '@/hooks/use-toast';

const authSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten')
    .regex(/[^A-Za-z0-9]/, 'Passwort muss mindestens ein Sonderzeichen enthalten'),
});

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const { checkRateLimit, recordAttempt } = useAuthRateLimit();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: loginTitle } = useSiteSetting('auth_login_title');
  const { data: registerTitle } = useSiteSetting('auth_register_title');
  const { data: emailLabel } = useSiteSetting('auth_email_label');
  const { data: passwordLabel } = useSiteSetting('auth_password_label');
  const { data: loginButton } = useSiteSetting('auth_login_button');
  const { data: registerButton } = useSiteSetting('auth_register_button');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validate = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') newErrors.email = err.message;
          if (err.path[0] === 'password') newErrors.password = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(email, 'login');
    if (!rateLimitCheck.allowed) {
      toast({
        title: 'Zu viele Versuche',
        description: rateLimitCheck.message || 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    
    // Record attempt
    await recordAttempt(email, 'login', !error);
    
    setIsSubmitting(false);

    if (!error) {
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Check if password is leaked
    try {
      const { data: leakCheck, error: leakError } = await supabase.functions.invoke('check-leaked-password', {
        body: { password }
      });

      if (!leakError && leakCheck?.isLeaked) {
        toast({
          title: 'Unsicheres Passwort',
          description: `Dieses Passwort wurde in ${leakCheck.count.toLocaleString()} Datenlecks gefunden. Bitte wähle ein anderes Passwort.`,
          variant: 'destructive',
        });
        return;
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Leaked password check failed:', err);
      }
      // Continue with signup if check fails
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(email, 'signup');
    if (!rateLimitCheck.allowed) {
      toast({
        title: 'Zu viele Versuche',
        description: rateLimitCheck.message || 'Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(email, password);
    
    // Record attempt
    await recordAttempt(email, 'signup', !error);
    
    setIsSubmitting(false);

    if (!error) {
      navigate('/profil/bearbeiten');
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border rounded-lg p-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              Willkommen bei ESCORIA
            </h1>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">{loginTitle || 'Anmelden'}</TabsTrigger>
                <TabsTrigger value="signup">{registerTitle || 'Registrieren'}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">{emailLabel || 'E-Mail'}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.ch"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="login-password">{passwordLabel || 'Passwort'}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <ForgotPasswordDialog />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Wird angemeldet...' : (loginButton || 'Anmelden')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email">{emailLabel || 'E-Mail'}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine@email.ch"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="signup-password">{passwordLabel || 'Passwort'}</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">{errors.password}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Mindestens 8 Zeichen, ein Groß- und Kleinbuchstabe, eine Zahl und ein Sonderzeichen
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Wird registriert...' : (registerButton || 'Registrieren')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
