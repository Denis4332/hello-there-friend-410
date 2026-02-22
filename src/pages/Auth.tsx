import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { ForgotPasswordDialog } from '@/components/ForgotPasswordDialog';
import { useAuthRateLimit } from '@/hooks/useAuthRateLimit';
import { useToast } from '@/hooks/use-toast';
import { recordAgbAcceptance } from '@/hooks/useAgbAcceptances';
import { MailCheck } from 'lucide-react';


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
  const queryClient = useQueryClient();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const { checkRateLimit, recordAttempt } = useAuthRateLimit();
  const { getSetting } = useSiteSettingsContext();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const seoTitle = getSetting('seo_auth_title');
  const seoDescription = getSetting('seo_auth_description');
  const loginTitle = getSetting('auth_login_title');
  const registerTitle = getSetting('auth_register_title');
  const emailLabel = getSetting('auth_email_label');
  const passwordLabel = getSetting('auth_password_label');
  const loginButton = getSetting('auth_login_button');
  const registerButton = getSetting('auth_register_button');
  const welcomeTitle = getSetting('nav_welcome_title');
  const passwordHint = getSetting('auth_password_hint');
  const loadingLogin = getSetting('auth_loading_login');
  const loadingSignup = getSetting('auth_loading_signup');
  const allowSelfRegistration = getSetting('config_allow_self_registration');
  
  const isRegistrationEnabled = allowSelfRegistration !== 'false';
  const nextPath = searchParams.get('next') || '/mein-profil';

  useEffect(() => {
    if (user) {
      navigate(nextPath, { replace: true });
    }
  }, [user, navigate, nextPath]);

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
    
    // Fire-and-forget: don't await recordAttempt
    recordAttempt(email, 'login', !error);
    
    setIsSubmitting(false);

    if (error) {
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
        toast({
          title: 'E-Mail nicht bestätigt',
          description: 'Bitte bestätige zuerst deine E-Mail-Adresse. Prüfe deinen Posteingang.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (!error) {
      const doPrefetch = () => {
        queryClient.prefetchQuery({
          queryKey: ['profile-own'],
          queryFn: async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) return null;
            const { data } = await supabase
              .from('profiles')
              .select('*, profile_categories(category_id, categories(name))')
              .eq('user_id', currentUser.id)
              .maybeSingle();
            return data;
          },
        });
      };
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(doPrefetch, { timeout: 100 });
      } else {
        setTimeout(doPrefetch, 0);
      }
      navigate(nextPath, { replace: true });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!agbAccepted) {
      toast({
        title: 'AGB nicht akzeptiert',
        description: 'Bitte akzeptiere die AGB und Datenschutzbestimmungen.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // Run leaked-password check and rate-limit check in parallel
    try {
      const [leakResult, rateLimitCheck] = await Promise.all([
        supabase.functions.invoke('check-leaked-password', { body: { password } }).catch(err => {
          console.error('Leaked password check failed:', err);
          return { data: null, error: err };
        }),
        checkRateLimit(email, 'signup'),
      ]);

      // Check rate limit result
      if (!rateLimitCheck.allowed) {
        toast({
          title: 'Zu viele Versuche',
          description: rateLimitCheck.message || 'Bitte versuchen Sie es später erneut.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Check leaked password result
      if (leakResult.data && !leakResult.error && leakResult.data.isLeaked) {
        toast({
          title: 'Unsicheres Passwort',
          description: `Dieses Passwort wurde in ${leakResult.data.count.toLocaleString()} Datenlecks gefunden. Bitte wähle ein anderes Passwort.`,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error('Pre-signup checks failed:', err);
      // Continue with signup if checks fail
    }

    const { error } = await signUp(email, password);
    
    // Fire-and-forget: don't await recordAttempt
    recordAttempt(email, 'signup', !error);

    if (!error) {
      try {
        await recordAgbAcceptance({
          email: email,
          acceptanceType: 'registration',
          agbVersion: '1.0',
        });
      } catch (agbError) {
        console.error('Failed to record AGB acceptance:', agbError);
      }
      
      // Show confirmation screen instead of just a toast
      setConfirmationEmail(email);
      setShowConfirmation(true);
      setIsSubmitting(false);
      return;
    }
    
    setIsSubmitting(false);
  };

  const handleBackToLogin = () => {
    setShowConfirmation(false);
    setConfirmationEmail('');
    setEmail('');
    setPassword('');
    setAgbAccepted(false);
    setActiveTab('login');
  };

  return (
    <>
      <SEO 
        title={seoTitle || 'Anmelden'}
        description={seoDescription || 'Anmelden oder registrieren bei der Plattform'}
      />
      <Header />
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-card border rounded-lg p-8">
            {showConfirmation ? (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <MailCheck className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Prüfe deinen Posteingang</h2>
                  <p className="text-muted-foreground">
                    Wir haben eine E-Mail an{' '}
                    <span className="font-semibold text-foreground">{confirmationEmail}</span>{' '}
                    gesendet. Klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keine E-Mail erhalten? Prüfe deinen Spam-Ordner.
                </p>
                <Button onClick={handleBackToLogin} className="w-full">
                  Zum Login
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-center mb-6">
                  {welcomeTitle || 'Willkommen bei ESCORIA'}
                </h1>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
                  <TabsList className={`grid w-full mb-6 ${isRegistrationEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <TabsTrigger value="login">{loginTitle || 'Anmelden'}</TabsTrigger>
                    {isRegistrationEnabled && (
                      <TabsTrigger value="signup">{registerTitle || 'Registrieren'}</TabsTrigger>
                    )}
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
                        {isSubmitting ? (loadingLogin || 'Wird angemeldet...') : (loginButton || 'Anmelden')}
                      </Button>
                    </form>
                  </TabsContent>

                  {isRegistrationEnabled && (
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
                            {passwordHint || 'Mindestens 8 Zeichen, ein Groß- und Kleinbuchstabe, eine Zahl und ein Sonderzeichen'}
                          </p>
                        </div>

                        {/* AGB Checkbox */}
                        <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg border">
                          <Checkbox
                            id="agb-acceptance"
                            checked={agbAccepted}
                            onCheckedChange={(checked) => setAgbAccepted(checked === true)}
                            className="mt-0.5"
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor="agb-acceptance"
                              className="text-sm font-medium leading-snug cursor-pointer"
                            >
                              Ich akzeptiere die AGB und Datenschutzbestimmungen *
                            </label>
                            <p className="text-xs text-muted-foreground">
                              Mit der Registrierung akzeptierst du unsere{' '}
                              <Link to="/agb" className="text-primary underline hover:no-underline" target="_blank">
                                AGB
                              </Link>{' '}
                              und{' '}
                              <Link to="/datenschutz" className="text-primary underline hover:no-underline" target="_blank">
                                Datenschutzbestimmungen
                              </Link>.
                            </p>
                          </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting || !agbAccepted}>
                          {isSubmitting ? (loadingSignup || 'Wird registriert...') : (registerButton || 'Registrieren')}
                        </Button>
                      </form>
                    </TabsContent>
                  )}
                </Tabs>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
