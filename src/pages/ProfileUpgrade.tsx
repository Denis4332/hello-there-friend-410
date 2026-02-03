import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Crown, Star, Zap, ArrowLeft, Info, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { PaymentMethodModal } from '@/components/PaymentMethodModal';

// Paket-Hierarchie für Upgrade-Check
const PACKAGE_RANK: Record<string, number> = { basic: 1, premium: 2, top: 3 };

const isUpgrade = (from: string, to: string): boolean => {
  return (PACKAGE_RANK[to] || 0) > (PACKAGE_RANK[from] || 0);
};

const ProfileUpgrade = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedListingType, setSelectedListingType] = useState<'basic' | 'premium' | 'top' | null>(null);

  const { getSetting } = useSiteSettingsContext();
  const basicTitle = getSetting('pricing_basic_title', 'Standard Inserat');
  const basicPrice = getSetting('pricing_basic_price', 'CHF 49/Monat');
  const premiumTitle = getSetting('pricing_premium_title', 'Premium Inserat');
  const premiumPrice = getSetting('pricing_premium_price', 'CHF 99/Monat');
  const topTitle = getSetting('pricing_top_title', 'TOP AD Inserat');
  const topPrice = getSetting('pricing_top_price', 'CHF 199/Monat');

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

  const getAmountForListingType = (type: string): number => {
    const prices: Record<string, number> = {
      basic: 49,
      premium: 99,
      top: 199
    };
    return prices[type] || 49;
  };

  const handleUpgrade = (listingType: 'basic' | 'premium' | 'top') => {
    if (!profile) return;
    setSelectedListingType(listingType);
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = async (method: 'PHONE' | 'SMS') => {
    if (!profile || !selectedListingType) return;
    
    try {
      // Bei aktivem Profil: Status auf pending setzen für Admin-Review nach Upgrade
      if (profile.status === 'active') {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            listing_type: selectedListingType,
            status: 'pending', // WICHTIG: Zurück auf pending für Admin-Review
          })
          .eq('id', profile.id);
        
        if (updateError) throw updateError;
      }

      const amountCents = getAmountForListingType(selectedListingType) * 100;
      
      const { data, error } = await supabase.functions.invoke('payport-checkout', {
        body: {
          orderId: profile.id,
          amountCents,
          returnUrl: window.location.origin + '/payport/return',
          method
        }
      });
      
      if (error) throw error;
      
      const debug = new URLSearchParams(window.location.search).get('debug') === '1';
      if (debug) {
        console.log('PayPort Debug:', data.debug);
      }
      window.location.href = data.redirectUrl;
    } catch (error: any) {
      toast({
        title: 'Zahlungsfehler',
        description: error.message || 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
      setShowPaymentModal(false);
    }
  };

  const handleExtend = async () => {
    if (!profile) return;
    setSelectedListingType(profile.listing_type);
    setShowPaymentModal(true);
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

  // Alle Pakete
  const allPackages = [
    {
      id: 'basic',
      title: basicTitle || 'Standard Inserat',
      price: basicPrice || 'CHF 49/Monat',
      icon: Star,
      iconBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
      features: [
        'Sichtbar im gewählten Kanton',
        'Bis zu 5 Fotos',
        'Kontaktdaten anzeigen',
      ],
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
        'Alles von Standard +',
        'VIP Badge',
        'Bis zu 10 Fotos + 1 Video',
        'Bessere Platzierung',
      ],
    },
    {
      id: 'top',
      title: topTitle || 'TOP AD Inserat',
      price: topPrice || 'CHF 199/Monat',
      icon: Zap,
      iconBg: 'bg-gradient-to-r from-red-600 to-pink-600',
      iconColor: 'text-white',
      features: [
        'Alles von Premium +',
        'Immer ganz oben platziert',
        'Schweizweit auf Startseite',
        'Bis zu 15 Fotos + 2 Videos',
      ],
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
  const isActiveProfile = profile?.status === 'active' && profile?.payment_status === 'paid';
  const isInactiveProfile = profile?.status === 'inactive';
  const currentListingType = profile?.listing_type || 'basic';

  // Bei aktivem Profil: Nur Upgrades anzeigen (höhere Pakete)
  // Bei inaktivem/pending Profil: Alle Pakete anzeigen
  const availablePackages = isActiveProfile
    ? allPackages.filter(pkg => isUpgrade(currentListingType, pkg.id))
    : allPackages;

  // Schon TOP und aktiv → Kein Upgrade möglich
  const noUpgradeAvailable = isActiveProfile && availablePackages.length === 0;

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
            onClick={() => navigate('/mein-profil')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              {isInactiveProfile ? 'Inserat reaktivieren' : 'Inserat upgraden'}
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Dein aktuelles Paket: <Badge variant={currentBadge.variant}>{currentBadge.label}</Badge>
            </p>
          </div>

          {/* Current Package Status */}
          <Card className="border-primary mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aktuelles Paket</CardTitle>
                  <CardDescription>
                    Du nutzt aktuell das {getCurrentBadge().label}-Paket
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getCurrentBadge().variant}>
                    {getCurrentBadge().label}
                  </Badge>
                  <Badge variant={profile?.status === 'active' ? 'default' : 'destructive'}>
                    {profile?.status === 'active' ? '✅ Aktiv' : profile?.status === 'inactive' ? '❌ Abgelaufen' : '⏳ ' + profile?.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(profile?.premium_until || profile?.top_ad_until) && (
                  <div className="text-sm">
                    <span className="font-semibold">Gültig bis: </span>
                    {new Date(
                      profile.listing_type === 'top' ? profile.top_ad_until : profile.premium_until
                    ).toLocaleDateString('de-CH', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })}
                  </div>
                )}
                
                {/* Aktives Profil: Verlängern-Button */}
                {isActiveProfile && (
                  <Button onClick={handleExtend} className="w-full">
                    Verlängern (+30 Tage)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info für TOP-User: Kein Upgrade möglich */}
          {noUpgradeAvailable && (
            <Card className="mb-8 bg-muted">
              <CardContent className="p-6 text-center">
                <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">Du hast bereits das höchste Paket (TOP AD)</h3>
                <p className="text-muted-foreground mb-4">
                  Ein Upgrade ist nicht möglich. Du kannst dein Paket verlängern oder nach Ablauf ein anderes Paket wählen.
                </p>
                <p className="text-sm text-muted-foreground">
                  Downgrade erst nach Ablauf am{' '}
                  {new Date(profile?.premium_until || profile?.top_ad_until || '').toLocaleDateString('de-CH')} möglich.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Info für aktive Profile: Downgrade-Beschränkung */}
          {isActiveProfile && !noUpgradeAvailable && (
            <Card className="mb-8 border-amber-500/50 bg-amber-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700 dark:text-amber-400">Upgrade jederzeit möglich</p>
                  <p className="text-muted-foreground">
                    Downgrade (zu einem günstigeren Paket) ist erst nach Ablauf am{' '}
                    {new Date(profile?.premium_until || profile?.top_ad_until || '').toLocaleDateString('de-CH')} möglich.
                    Nach dem Upgrade wird dein Profil erneut geprüft.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upgrade/Reaktivierungs-Karten */}
          {availablePackages.length > 0 && (
            <div className={`grid gap-6 mb-12 ${availablePackages.length === 1 ? 'max-w-md mx-auto' : availablePackages.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
              {availablePackages.map((pkg) => {
                const Icon = pkg.icon;
                const isCurrent = pkg.id === currentListingType;
                return (
                  <Card 
                    key={pkg.id}
                    className={`relative ${pkg.recommended ? 'border-amber-500 shadow-lg' : ''} ${isCurrent ? 'opacity-60' : ''}`}
                  >
                    {pkg.recommended && !isCurrent && (
                      <div className="absolute -top-4 left-0 right-0 flex justify-center">
                        <span className="bg-gradient-to-r from-amber-400 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                          Empfohlen
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
                        disabled={isCurrent}
                        onClick={() => handleUpgrade(pkg.id as 'basic' | 'premium' | 'top')}
                      >
                        {isCurrent 
                          ? 'Aktuelles Paket' 
                          : isActiveProfile 
                            ? 'Jetzt upgraden' 
                            : isInactiveProfile 
                              ? 'Mit diesem Paket reaktivieren'
                              : 'Auswählen'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Support-Info */}
          <Card className="bg-muted">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">💡 Wichtige Informationen</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Upgrades werden nach Admin-Prüfung aktiviert</li>
                <li>• Downgrades sind erst nach Ablauf des aktuellen Pakets möglich</li>
                <li>• Bei Fragen kontaktiere unseren Support</li>
              </ul>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/kontakt')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Support kontaktieren
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectMethod={handlePaymentMethodSelect}
      />
    </>
  );
};

export default ProfileUpgrade;
