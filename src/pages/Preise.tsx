import { Header } from '@/components/layout/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Crown, Star, Zap, UserPlus, Camera, CreditCard, Sparkles, Globe, MapPin, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

// How it works - 4 step process
const HowItWorks = () => {
  const { getSetting } = useSiteSettingsContext();

  const title = getSetting('pricing_howto_title');
  const step1Title = getSetting('pricing_howto_step1_title');
  const step1Text = getSetting('pricing_howto_step1_text');
  const step2Title = getSetting('pricing_howto_step2_title');
  const step2Text = getSetting('pricing_howto_step2_text');
  const step3Title = getSetting('pricing_howto_step3_title');
  const step3Text = getSetting('pricing_howto_step3_text');
  const step4Title = getSetting('pricing_howto_step4_title');
  const step4Text = getSetting('pricing_howto_step4_text');

  const steps = [
    { icon: UserPlus, title: step1Title || 'Account erstellen', text: step1Text || 'Registriere dich kostenlos mit deiner E-Mail-Adresse.' },
    { icon: Camera, title: step2Title || 'Inserat erstellen', text: step2Text || 'Fülle dein Profil aus und lade attraktive Fotos hoch.' },
    { icon: CreditCard, title: step3Title || 'Paket wählen', text: step3Text || 'Wähle das passende Paket für deine Bedürfnisse.' },
    { icon: Sparkles, title: step4Title || 'Freischaltung', text: step4Text || 'Nach kurzer Prüfung wird dein Inserat freigeschaltet.' },
  ];

  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold mb-8 text-center">{title || "So funktioniert's"}</h2>
      <div className="grid md:grid-cols-4 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
                  <Icon className="h-8 w-8 text-primary" />
                  <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
              {idx < 3 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] border-t-2 border-dashed border-muted-foreground/30" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Visibility explanation
const VisibilityExplanation = () => {
  const { getSetting } = useSiteSettingsContext();

  const title = getSetting('pricing_visibility_title');
  const intro = getSetting('pricing_visibility_intro');
  const topTitle = getSetting('pricing_visibility_top_title');
  const topText = getSetting('pricing_visibility_top_text');
  const premiumTitle = getSetting('pricing_visibility_premium_title');
  const premiumText = getSetting('pricing_visibility_premium_text');
  const basicTitle = getSetting('pricing_visibility_basic_title');
  const basicText = getSetting('pricing_visibility_basic_text');

  const tiers = [
    {
      title: topTitle || 'TOP AD',
      text: topText || 'Schweizweit auf der Homepage sichtbar + in allen Suchergebnissen immer an erster Stelle',
      icon: Globe,
      iconBg: 'bg-gradient-to-r from-red-600 to-pink-600',
      badge: 'Schweizweit',
      badgeColor: 'bg-red-600',
    },
    {
      title: premiumTitle || 'Premium',
      text: premiumText || 'Im gewählten Kanton oder GPS-Radius sichtbar, wird vor Basic-Inseraten angezeigt',
      icon: MapPin,
      iconBg: 'bg-gradient-to-r from-amber-400 to-pink-500',
      badge: 'Kanton/Radius',
      badgeColor: 'bg-amber-500',
    },
    {
      title: basicTitle || 'Basic',
      text: basicText || 'Im gewählten Kanton oder GPS-Radius sichtbar, Standard-Platzierung',
      icon: MapPin,
      iconBg: 'bg-blue-500',
      badge: 'Kanton/Radius',
      badgeColor: 'bg-blue-500',
    },
  ];

  return (
    <div className="mb-16">
      <h2 className="text-2xl font-bold mb-4 text-center">{title || 'Wo erscheint mein Inserat?'}</h2>
      <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
        {intro || 'Je höher dein Paket, desto mehr Sichtbarkeit und bessere Platzierung erhältst du.'}
      </p>
      
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier, idx) => {
          const Icon = tier.icon;
          return (
            <Card key={idx} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 ${tier.iconBg}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${tier.iconBg} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{tier.title}</CardTitle>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full text-white ${tier.badgeColor}`}>
                      {tier.badge}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tier.text}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Visual diagram */}
      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4" /> Homepage
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm">
                <Zap className="h-4 w-4 text-red-600" />
                <span>TOP AD Inserate (max. 4)</span>
              </div>
              <p className="text-xs text-muted-foreground pl-2">Schweizweit für alle Besucher sichtbar</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Suche (z.B. Zürich)
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm">
                <span className="font-medium">1.</span> TOP AD
              </div>
              <div className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded text-sm">
                <span className="font-medium">2.</span> Premium
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-sm">
                <span className="font-medium">3.</span> Basic
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Verification info box
const VerificationInfo = () => {
  const { getSetting } = useSiteSettingsContext();

  const title = getSetting('pricing_verification_title');
  const text = getSetting('pricing_verification_text');

  return (
    <div className="mb-16">
      <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-900/10">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">{title || 'Verifizierung – Mehr Vertrauen'}</h3>
              <p className="text-muted-foreground">
                {text || 'Verifizierte Profile erhalten ein Vertrauens-Badge und werden innerhalb ihrer Stufe bevorzugt angezeigt. Lade ein Foto hoch, das dich mit einem Zettel zeigt, auf dem unser Plattformname steht.'}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Blaues Verifiziert-Badge</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Bessere Platzierung innerhalb deiner Stufe</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Mehr Vertrauen von Besuchern</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Extended FAQ (8 questions)
const FAQ = () => {
  const { getSetting } = useSiteSettingsContext();

  const faq1Q = getSetting('pricing_faq1_question');
  const faq1A = getSetting('pricing_faq1_answer');
  const faq2Q = getSetting('pricing_faq2_question');
  const faq2A = getSetting('pricing_faq2_answer');
  const faq3Q = getSetting('pricing_faq3_question');
  const faq3A = getSetting('pricing_faq3_answer');
  const faq4Q = getSetting('pricing_faq4_question');
  const faq4A = getSetting('pricing_faq4_answer');
  const faq5Q = getSetting('pricing_faq5_question');
  const faq5A = getSetting('pricing_faq5_answer');
  const faq6Q = getSetting('pricing_faq6_question');
  const faq6A = getSetting('pricing_faq6_answer');
  const faq7Q = getSetting('pricing_faq7_question');
  const faq7A = getSetting('pricing_faq7_answer');
  const faq8Q = getSetting('pricing_faq8_question');
  const faq8A = getSetting('pricing_faq8_answer');

  const faqs = [
    { q: faq1Q, a: faq1A },
    { q: faq2Q, a: faq2A },
    { q: faq3Q, a: faq3A },
    { q: faq4Q, a: faq4A },
    { q: faq5Q, a: faq5A },
    { q: faq6Q, a: faq6A },
    { q: faq7Q, a: faq7A },
    { q: faq8Q, a: faq8A },
  ].filter(faq => faq.q);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {faqs.map((faq, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{faq.q}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{faq.a}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const CTA = () => {
  const { getSetting } = useSiteSettingsContext();

  const ctaTitle = getSetting('pricing_cta_title');
  const ctaSubtitle = getSetting('pricing_cta_subtitle');
  const ctaButton = getSetting('pricing_cta_button');

  return (
    <div className="text-center mt-16">
      <h2 className="text-3xl font-bold mb-4">{ctaTitle || 'Bereit durchzustarten?'}</h2>
      <p className="text-muted-foreground mb-6">
        {ctaSubtitle || 'Erstelle jetzt dein Inserat und wähle das passende Paket.'}
      </p>
      <Button asChild size="lg" className="text-lg px-8">
        <Link to="/auth?mode=signup">
          {ctaButton || 'Jetzt Inserat erstellen'}
        </Link>
      </Button>
    </div>
  );
};

const Preise = () => {
  const { getSetting } = useSiteSettingsContext();

  const pageTitle = getSetting('pricing_page_title');
  const pageSubtitle = getSetting('pricing_page_subtitle');
  const seoTitle = getSetting('seo_pricing_title');
  const seoDescription = getSetting('seo_pricing_description');
  const basicTitle = getSetting('pricing_basic_title');
  const basicPrice = getSetting('pricing_basic_price');
  const premiumTitle = getSetting('pricing_premium_title');
  const premiumPrice = getSetting('pricing_premium_price');
  const topTitle = getSetting('pricing_top_title');
  const topPrice = getSetting('pricing_top_price');
  const comparisonTitle = getSetting('pricing_feature_comparison_title');

  const packages = [
    {
      id: 'basic',
      title: basicTitle || 'Basic Inserat',
      price: basicPrice || 'CHF 49/Monat',
      icon: Star,
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/50',
      features: [
        'Erscheint in Suchergebnissen',
        'Sichtbar im gewählten Kanton/Radius',
        'Standard-Platzierung',
        'Profil-Seite',
        'Foto-Upload',
      ],
    },
    {
      id: 'premium',
      title: premiumTitle || 'Premium Inserat',
      price: premiumPrice || 'CHF 99/Monat',
      icon: Crown,
      iconBg: 'bg-gradient-to-r from-amber-400 via-pink-500 to-pink-600',
      iconColor: 'text-white',
      border: 'border-amber-500',
      recommended: true,
      features: [
        'Alles von Basic +',
        'Bessere Platzierung im gewählten Bereich',
        'Goldener VIP Badge',
        'Erscheint vor Basic-Inseraten',
        'Mehr Aufmerksamkeit',
      ],
    },
    {
      id: 'top',
      title: topTitle || 'TOP AD Inserat',
      price: topPrice || 'CHF 199/Monat',
      icon: Zap,
      iconBg: 'bg-gradient-to-r from-red-600 to-pink-600',
      iconColor: 'text-white',
      border: 'border-red-500',
      features: [
        'Alles von Premium +',
        '⭐ Schweizweite Sichtbarkeit auf Homepage',
        'Beste Platzierung in allen Suchergebnissen',
        'TOP AD Banner',
        'Immer an erster Position',
        'Maximale Sichtbarkeit',
      ],
    },
  ];

  return (
    <>
      <SEO 
        title={seoTitle || pageTitle || 'Preise & Pakete'}
        description={seoDescription || pageSubtitle || 'Wähle das passende Paket für dein Inserat. Von kostenlos bis Premium - für jeden das Richtige.'}
      />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{pageTitle || 'Preise & Pakete'}</h1>
            <p className="text-xl text-muted-foreground mb-6">
              {pageSubtitle || 'Wähle das passende Paket für dein Inserat'}
            </p>
          </div>

          {/* How it works */}
          <HowItWorks />

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <Card 
                  key={pkg.id}
                  className={`relative ${pkg.border} ${pkg.recommended ? 'shadow-lg scale-105' : ''}`}
                >
                  {pkg.recommended && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="bg-gradient-to-r from-amber-400 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                        Beliebt
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-full ${pkg.iconBg} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${pkg.iconColor}`} />
                    </div>
                    <CardTitle className="text-xl">{pkg.title}</CardTitle>
                    <CardDescription className="text-2xl font-bold text-foreground">
                      {pkg.price}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full mt-6">
                      <Link to="/auth?mode=signup">
                        Jetzt starten
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Visibility Explanation */}
          <VisibilityExplanation />

          {/* Feature Comparison Table */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">{comparisonTitle || 'Feature-Vergleich'}</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Standard</th>
                    <th className="text-center p-4 font-semibold">Premium</th>
                    <th className="text-center p-4 font-semibold">TOP AD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4">In Suchergebnissen</td>
                    <td className="text-center p-4"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="text-center p-4"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="text-center p-4"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Profil-Seite</td>
                    <td className="text-center p-4"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="text-center p-4"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="text-center p-4"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Bevorzugte Platzierung</td>
                    <td className="text-center p-4">–</td>
                    <td className="text-center p-4"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                    <td className="text-center p-4"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">VIP Badge</td>
                    <td className="text-center p-4">–</td>
                    <td className="text-center p-4"><Crown className="h-5 w-5 text-amber-500 mx-auto" /></td>
                    <td className="text-center p-4"><Zap className="h-5 w-5 text-red-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Auf Homepage</td>
                    <td className="text-center p-4">–</td>
                    <td className="text-center p-4">–</td>
                    <td className="text-center p-4"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Schweizweite Sichtbarkeit</td>
                    <td className="text-center p-4">–</td>
                    <td className="text-center p-4">–</td>
                    <td className="text-center p-4"><CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Info */}
          <VerificationInfo />

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Häufige Fragen</h2>
            <FAQ />
          </div>

          {/* CTA */}
          <CTA />
        </div>
      </main>
    </>
  );
};

export default Preise;