import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Eye, Grid3x3, Star } from 'lucide-react';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const positionIcons = {
  popup: Zap,
  top: Star,
  grid: Grid3x3,
};

export default function Bannerpreise() {
  // SEO settings
  const { data: seoTitle } = useSiteSetting('seo_bannerpreise_title');
  const { data: seoDescription } = useSiteSetting('seo_bannerpreise_description');
  
  // Page content
  const { data: pageTitle } = useSiteSetting('banner_page_title');
  const { data: pageSubtitle } = useSiteSetting('banner_page_subtitle');
  
  // Popup banner
  const { data: popupName } = useSiteSetting('banner_popup_name');
  const { data: popupDescription } = useSiteSetting('banner_popup_description');
  const { data: popupPriceDay } = useSiteSetting('banner_popup_price_day');
  const { data: popupPriceWeek } = useSiteSetting('banner_popup_price_week');
  const { data: popupPriceMonth } = useSiteSetting('banner_popup_price_month');
  const { data: popupFeaturesRaw } = useSiteSetting('banner_popup_features');
  
  // Top banner
  const { data: topName } = useSiteSetting('banner_top_name');
  const { data: topDescription } = useSiteSetting('banner_top_description');
  const { data: topPriceDay } = useSiteSetting('banner_top_price_day');
  const { data: topPriceWeek } = useSiteSetting('banner_top_price_week');
  const { data: topPriceMonth } = useSiteSetting('banner_top_price_month');
  const { data: topFeaturesRaw } = useSiteSetting('banner_top_features');
  
  // Grid banner
  const { data: gridName } = useSiteSetting('banner_grid_name');
  const { data: gridDescription } = useSiteSetting('banner_grid_description');
  const { data: gridPriceDay } = useSiteSetting('banner_grid_price_day');
  const { data: gridPriceWeek } = useSiteSetting('banner_grid_price_week');
  const { data: gridPriceMonth } = useSiteSetting('banner_grid_price_month');
  const { data: gridFeaturesRaw } = useSiteSetting('banner_grid_features');
  
  // Info section
  const { data: infoResultsTitle } = useSiteSetting('banner_info_results_title');
  const { data: infoResultsText } = useSiteSetting('banner_info_results_text');
  const { data: infoActivationTitle } = useSiteSetting('banner_info_activation_title');
  const { data: infoActivationText } = useSiteSetting('banner_info_activation_text');
  
  // CTA section
  const { data: ctaTitle } = useSiteSetting('banner_cta_title');
  const { data: ctaText } = useSiteSetting('banner_cta_text');
  const { data: ctaButton } = useSiteSetting('banner_cta_button');

  // Parse features JSON
  const parseFeatures = (raw: string | undefined, fallback: string[]) => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const popupFeatures = parseFeatures(popupFeaturesRaw, [
    'Format: 16:9 Querformat',
    'Erscheint beim Seitenaufruf',
    'Volle Aufmerksamkeit',
    'Exklusive Platzierung'
  ]);

  const topFeatures = parseFeatures(topFeaturesRaw, [
    'Format: 16:9 Querformat',
    'Immer sichtbar',
    'Hohe Reichweite',
    'Exklusive Platzierung'
  ]);

  const gridFeatures = parseFeatures(gridFeaturesRaw, [
    'Format: 16:9 Querformat',
    'Natürliche Integration',
    'Kontextbezogen',
    'Exklusive Platzierung'
  ]);

  const packages = [
    {
      position: 'popup',
      icon: positionIcons.popup,
      name: popupName || 'Pop-up Banner',
      description: popupDescription || 'Maximale Aufmerksamkeit beim Seitenaufruf',
      priceDay: popupPriceDay || 'CHF 80',
      priceWeek: popupPriceWeek || 'CHF 504',
      priceMonth: popupPriceMonth || 'CHF 2\'040',
      features: popupFeatures,
      badge: 'EXKLUSIV',
    },
    {
      position: 'top',
      icon: positionIcons.top,
      name: topName || 'Top-Banner',
      description: topDescription || 'Prominent im Kopfbereich jeder Seite',
      priceDay: topPriceDay || 'CHF 50',
      priceWeek: topPriceWeek || 'CHF 315',
      priceMonth: topPriceMonth || 'CHF 1\'275',
      features: topFeatures,
      badge: 'EXKLUSIV',
    },
    {
      position: 'grid',
      icon: positionIcons.grid,
      name: gridName || 'Grid-Banner',
      description: gridDescription || 'Integriert zwischen den Suchergebnissen',
      priceDay: gridPriceDay || 'CHF 30',
      priceWeek: gridPriceWeek || 'CHF 189',
      priceMonth: gridPriceMonth || 'CHF 765',
      features: gridFeatures,
      badge: 'EXKLUSIV',
    },
  ];

  return (
    <>
      <SEO
        title={seoTitle || pageTitle || 'Bannerpreise'}
        description={seoDescription || pageSubtitle || 'Werben Sie effektiv mit gut sichtbaren Bannerplatzierungen.'}
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">
                {pageTitle || 'Werbebanner schalten'}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {pageSubtitle || 'Erreichen Sie tausende potenzielle Kunden mit unseren exklusiven Werbebannern'}
              </p>
            </div>

            {/* Banner Packages Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const Icon = pkg.icon;
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
                          <span className="text-3xl font-bold">{pkg.priceDay}</span>
                          <span className="text-muted-foreground">/Tag</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>{pkg.priceWeek}/Woche</div>
                          <div>{pkg.priceMonth}/Monat</div>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3">
                        {pkg.features.map((feature: string, idx: number) => (
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
                      <h3 className="text-lg font-semibold">
                        {infoResultsTitle || 'Messbare Ergebnisse'}
                      </h3>
                    </div>
                    <p className="text-muted-foreground">
                      {infoResultsText || 'Detaillierte Statistiken zu Impressions und Klicks'}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        {infoActivationTitle || 'Schnelle Aktivierung'}
                      </h3>
                    </div>
                    <p className="text-muted-foreground">
                      {infoActivationText || 'Ihr Banner ist innerhalb von 24 Stunden live'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <div className="text-center space-y-4 py-8">
              <h2 className="text-3xl font-bold">
                {ctaTitle || 'Haben Sie Fragen?'}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {ctaText || 'Kontaktieren Sie uns für eine individuelle Beratung und maßgeschneiderte Angebote.'}
              </p>
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/kontakt">
                  {ctaButton || 'Jetzt Kontakt aufnehmen'}
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