import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Crown, Star, Zap, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const ProfileUpgrade = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { data: basicTitle } = useSiteSetting('pricing_basic_title');
  const { data: basicPrice } = useSiteSetting('pricing_basic_price');
  const { data: premiumTitle } = useSiteSetting('pricing_premium_title');
  const { data: premiumPrice } = useSiteSetting('pricing_premium_price');
  const { data: topTitle } = useSiteSetting('pricing_top_title');
  const { data: topPrice } = useSiteSetting('pricing_top_price');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (listingType: 'basic' | 'premium' | 'top') => {
    // TODO: Stripe Integration - Aktuell nur Anzeige
    toast({
      title: 'Upgrade',
      description: `Upgrade zu ${listingType} - Diese Funktion wird nach der Beta-Phase verfügbar sein.`,
    });
  };

  const getCurrentBadge = () => {
    const type = profile?.listing_type || 'basic';
    const badges = {
      basic: { label: 'Standard', variant: 'default' as const },
      premium: { label: 'Premium', variant: 'default' as const },
      top: { label: 'TOP AD', variant: 'destructive' as const },
    };
    return badges[type as keyof typeof badges] || badges.basic;
  };

  const packages = [
    {
      id: 'basic',
      title: basicTitle || 'Standard Inserat',
      price: basicPrice || 'CHF 49/Monat',
      icon: Star,
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
      features: [
        'Bessere Platzierung in Suche',
        'Hervorgehobene Darstellung',
        'Erhöhte Sichtbarkeit',
      ],
      disabled: profile?.listing_type === 'basic' || profile?.listing_type === 'premium' || profile?.listing_type === 'top',
    },
    {
      id: 'premium',
      title: premiumTitle || 'Premium Inserat',
      price: premiumPrice || 'CHF 99/Monat',
      icon: Crown,
      iconBg: 'bg-gradient-to-r from-amber-400 via-pink-500 to-pink-600',
      iconColor: 'text-white',
      recommended: true,
      features: [
        'Alles von Standard',
        'Goldener VIP Badge',
        'Größere Darstellung',
        'Animation & Hervorhebung',
      ],
      disabled: profile?.listing_type === 'premium' || profile?.listing_type === 'top',
    },
    {
      id: 'top',
      title: topTitle || 'TOP AD Inserat',
      price: topPrice || 'CHF 199/Monat',
      icon: Zap,
      iconBg: 'bg-gradient-to-r from-red-600 to-pink-600',
      iconColor: 'text-white',
      features: [
        'Alles von Premium',
        'Immer ganz oben',
        'TOP AD Banner',
        'Maximale Sichtbarkeit',
      ],
      disabled: profile?.listing_type === 'top',
    },
  ];

  if (loading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">Lädt...</div>
        </main>
      </>
    );
  }

  const currentBadge = getCurrentBadge();

  return (
    <>
      <SEO 
        title="Inserat upgraden"
        description="Upgrade dein Inserat für mehr Sichtbarkeit und bessere Platzierung."
      />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/user/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Inserat upgraden</h1>
            <p className="text-xl text-muted-foreground mb-4">
              Dein aktuelles Paket: <Badge variant={currentBadge.variant}>{currentBadge.label}</Badge>
            </p>
          </div>

          {/* Upgrade Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <Card 
                  key={pkg.id}
                  className={`relative ${pkg.recommended ? 'border-amber-500 shadow-lg' : ''} ${pkg.disabled ? 'opacity-60' : ''}`}
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
                    <ul className="space-y-3 mb-6">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      disabled={pkg.disabled}
                      onClick={() => handleUpgrade(pkg.id as 'basic' | 'premium' | 'top')}
                    >
                      {pkg.disabled ? 'Aktuelles Paket' : 'Jetzt upgraden'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info */}
          <Card className="bg-muted">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">💡 Wichtige Informationen</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Du kannst jederzeit upgraden oder downgraden</li>
                <li>• Bei Downgrade wird dein Inserat deaktiviert</li>
                <li>• Upgrades werden sofort aktiviert</li>
                <li>• Monatliche Kündigungsfrist</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default ProfileUpgrade;
