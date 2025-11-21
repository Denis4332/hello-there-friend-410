import { Header } from '@/components/layout/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Crown, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const Preise = () => {
  const { data: pageTitle } = useSiteSetting('pricing_page_title');
  const { data: pageSubtitle } = useSiteSetting('pricing_page_subtitle');
  const { data: basicTitle } = useSiteSetting('pricing_basic_title');
  const { data: basicPrice } = useSiteSetting('pricing_basic_price');
  const { data: premiumTitle } = useSiteSetting('pricing_premium_title');
  const { data: premiumPrice } = useSiteSetting('pricing_premium_price');
  const { data: topTitle } = useSiteSetting('pricing_top_title');
  const { data: topPrice } = useSiteSetting('pricing_top_price');

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
        title={pageTitle || 'Preise & Pakete'}
        description={pageSubtitle || 'Wähle das passende Paket für dein Inserat. Von kostenlos bis Premium - für jeden das Richtige.'}
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

          {/* Feature Comparison Table */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center">Feature-Vergleich</h2>
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
                  {[
                    { name: 'In Suchergebnissen', basic: true, premium: true, top: true },
                    { name: 'Profil-Seite', basic: true, premium: true, top: true },
                    { name: 'Foto-Upload', basic: true, premium: true, top: true },
                    { name: 'Schweizweit auf Homepage', basic: false, premium: false, top: true },
                    { name: 'Im gewählten Bereich', basic: true, premium: true, top: true },
                    { name: 'Bessere Platzierung', basic: false, premium: true, top: true },
                    { name: 'VIP Badge', basic: false, premium: true, top: true },
                    { name: 'TOP Position (Priorität)', basic: false, premium: false, top: true },
                    { name: 'TOP Banner', basic: false, premium: false, top: true },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-4">{row.name}</td>
                      <td className="text-center p-4">
                        {row.basic ? <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /> : '—'}
                      </td>
                      <td className="text-center p-4">
                        {row.premium ? <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /> : '—'}
                      </td>
                      <td className="text-center p-4">
                        {row.top ? <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" /> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Häufige Fragen</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kann ich später upgraden?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Ja, du kannst jederzeit zu einem höheren Paket wechseln. Dein Inserat wird sofort mit den neuen Features aktualisiert.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Wie funktioniert die Bezahlung?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Die Bezahlung erfolgt sicher über Stripe per Kreditkarte oder TWINT. Du kannst jederzeit kündigen.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Was passiert nach Ablauf des Pakets?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Dein Inserat bleibt online, wird aber deaktiviert. Du kannst jederzeit wieder ein Paket buchen.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold mb-4">Bereit durchzustarten?</h2>
            <p className="text-muted-foreground mb-6">
              Erstelle jetzt dein Inserat und wähle das passende Paket.
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/auth?mode=signup">
                Jetzt Inserat erstellen
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Preise;
