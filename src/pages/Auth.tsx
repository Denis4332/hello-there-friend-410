import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
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
import { Mail, CheckCircle } from 'lucide-react';

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
  const { getSetting } = useSiteSettingsContext();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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
  
  // Check if registration is enabled (default: true)
  const isRegistrationEnabled = allowSelfRegistration !== 'false';

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

    if (error) {
      // Check if it's an email not confirmed error
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
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Check AGB acceptance
    if (!agbAccepted) {
      toast({
        title: 'AGB nicht akzeptiert',
        description: 'Bitte akzeptiere die AGB und Datenschutzbestimmungen.',
        variant: 'destructive',
      });
      return;
    }

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
      console.error('Leaked password check failed:', err);
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

    // Record AGB acceptance if signup successful
    if (!error) {
      try {
        await recordAgbAcceptance({
          email: email,
          acceptanceType: 'registration',
          agbVersion: '1.0',
        });
      } catch (agbError) {
        console.error('Failed to record AGB acceptance:', agbError);
        // Continue anyway - user is already registered
      }
      
      // Show success message instead of redirecting
      setRegisteredEmail(email);
      setRegistrationSuccess(true);
    }
    
    setIsSubmitting(false);
  };

  // Show success message after registration
  if (registrationSuccess) {
    return (
      <>
        <SEO 
          title={seoTitle || 'Anmelden'}
          description={seoDescription || 'Anmelden oder registrieren bei der Plattform'}
        />
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="bg-card border rounded-lg p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">
                Fast geschafft!
              </h1>
              
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Wir haben dir eine E-Mail an
                </p>
                <p className="font-semibold text-foreground">
                  {registeredEmail}
                </p>
                <p className="text-sm text-muted-foreground">
                  gesendet.
                </p>
              </div>
              
              <p className="text-muted-foreground mb-6">
                Bitte klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.
                Danach kannst du dich anmelden.
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setRegistrationSuccess(false);
                    setActiveTab('login');
                    setPassword('');
                  }}
                  className="w-full"
                >
                  Zur Anmeldung
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  Keine E-Mail erhalten? Prüfe deinen Spam-Ordner oder{' '}
                  <button 
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setActiveTab('signup');
                    }}
                    className="text-primary underline hover:no-underline"
                  >
                    versuche es erneut
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;