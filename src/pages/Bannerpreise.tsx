import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Eye, Grid3x3, Star } from 'lucide-react';
import { BannerPackage } from '@/types/advertisement';

const BANNER_PACKAGES: BannerPackage[] = [
  {
    position: 'popup',
    name: 'Pop-up Banner',
    price_per_day: 50,
    price_per_week: 315, // -10%
    price_per_month: 1275, // -15%
    description: 'Maximale Aufmerksamkeit garantiert! Ihr Banner erscheint als Vollbild-Overlay und kann nicht übersehen werden.',
    features: [
      'Vollbild-Anzeige',
      'Garantierte Sichtbarkeit',
      'Zeitsteuerung anpassbar',
      'Frequenz-Kontrolle',
      'Mobile-optimiert',
      'Klick-Tracking inklusive',
    ],
    badge: 'Höchste Aufmerksamkeit',
  },
  {
    position: 'top',
    name: 'Top-Banner',
    price_per_day: 30,
    price_per_week: 189, // -10%
    price_per_month: 765, // -15%
    description: 'Erste Position auf der Startseite. Sofortige Sichtbarkeit für jeden Besucher.',
    features: [
      'Top-Position Startseite',
      'Immer sichtbar',
      'Desktop & Mobile',
      'Hohe Impressions',
      'Klick-Tracking',
    ],
  },
  {
    position: 'grid',
    name: 'Grid-Banner',
    price_per_day: 20,
    price_per_week: 126, // -10%
    price_per_month: 510, // -15%
    description: 'Natürliche Integration in die Suchergebnisse. Erscheint nach jedem 8. Profil für organische Reichweite.',
    features: [
      'Organische Platzierung',
      'Zwischen Profilen',
      'Hohe Engagement-Rate',
      'Mehrfache Sichtbarkeit',
      'Klick-Tracking',
    ],
  },
];

const positionIcons = {
  popup: Zap,
  top: Star,
  grid: Grid3x3,
};

export default function Bannerpreise() {
  return (
    <>
      <SEO
        title="Bannerpreise"
        description="Werben Sie effektiv mit gut sichtbaren Bannerplatzierungen. Alle Preise in CHF - wettbewerbsfähige Marktpreise für leistungsstarke Werbeflächen."
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Bannerpreise</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Werben Sie effektiv für Ihre Marke mit gut sichtbaren Bannerplatzierungen. 
                Alle Preise sind in CHF (Schweizer Franken) angegeben und spiegeln 
                wettbewerbsfähige Marktpreise für leistungsstarke Werbeflächen wider.
              </p>
            </div>

            {/* Banner Packages Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {BANNER_PACKAGES.map((pkg) => {
                const Icon = positionIcons[pkg.position];
                return (
                  <Card 
                    key={pkg.position} 
                    className={`relative ${pkg.badge ? 'border-primary border-2' : ''}`}
                  >
                    {pkg.badge && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        {pkg.badge}
                      </Badge>
                    )}
                    
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <CardDescription className="text-base mt-2">
                        {pkg.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Pricing */}
                      <div className="space-y-2 text-center border-t border-b py-4">
                        <div>
                          <span className="text-3xl font-bold">CHF {pkg.price_per_day}</span>
                          <span className="text-muted-foreground">/Tag</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>CHF {pkg.price_per_week}/Woche (-10%)</div>
                          <div>CHF {pkg.price_per_month}/Monat (-15%)</div>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button asChild className="w-full" size="lg">
                        <Link to="/banner/buchen" state={{ selectedPosition: pkg.position }}>
                          Jetzt buchen
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Info Section */}
            <Card className="bg-muted/50">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Messbare Ergebnisse</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Alle Bannerplatzierungen beinhalten detailliertes Tracking. 
                      Sehen Sie genau wie viele Impressionen und Klicks Ihre Anzeige erhält.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Schnelle Aktivierung</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Nach Ihrer Buchung wird Ihr Banner innerhalb von 24 Stunden aktiviert. 
                      Kontaktieren Sie uns für weitere Details.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <div className="text-center space-y-4 py-8">
              <h2 className="text-3xl font-bold">Bereit zu starten?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Kontaktieren Sie uns noch heute und erreichen Sie tausende potenzielle Kunden 
                mit einer strategisch platzierten Banneranzeige.
              </p>
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/kontakt">
                  Jetzt Kontakt aufnehmen
                </Link>
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
