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
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

const ProfileUpgrade = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const handleUpgrade = async (listingType: 'basic' | 'premium' | 'top') => {
    if (!profile) return;
    
    try {
      const amountCents = getAmountForListingType(listingType) * 100;
      
      const { data, error } = await supabase.functions.invoke('payport-checkout', {
        body: {
          orderId: profile.id,
          amountCents,
          returnUrl: window.location.origin + '/payport/return'
        }
      });
      
      if (error) throw error;
      
      console.log('PayPort Debug:', data.debug);
      window.location.href = data.redirectUrl;
    } catch (error: any) {
      toast({
        title: 'Zahlungsfehler',
        description: error.message || 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    }
  };

  const handleReactivate = async (listingType: string) => {
    if (!profile) return;
    
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      const updates: any = {
        status: 'active',
        listing_type: listingType
      };
      
      if (listingType === 'top') {
        updates.top_ad_until = expiryDate.toISOString();
      } else {
        updates.premium_until = expiryDate.toISOString();
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: 'Reaktivierung erfolgreich!',
        description: `Dein ${listingType.toUpperCase()} Profil ist wieder aktiv für 30 Tage.`,
      });
      
      await loadProfile();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExtend = async () => {
    if (!profile) return;
    
    try {
      const currentExpiry = profile.listing_type === 'top' 
        ? new Date(profile.top_ad_until)
        : new Date(profile.premium_until);
      
      currentExpiry.setDate(currentExpiry.getDate() + 30);
      
      const updates: any = {};
      if (profile.listing_type === 'top') {
        updates.top_ad_until = currentExpiry.toISOString();
      } else {
        updates.premium_until = currentExpiry.toISOString();
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: 'Verlängerung erfolgreich!',
        description: 'Dein Profil wurde um 30 Tage verlängert.',
      });
      
      await loadProfile();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDowngrade = async (newType: 'basic' | 'premium') => {
    if (!profile) return;
    
    try {
      const updates: any = {
        listing_type: newType
      };
      
      // Behalte aktuelles Ablaufdatum
      if (newType === 'premium') {
        updates.top_ad_until = null;
        // Premium behält premium_until
      } else {
        // Basic behält premium_until, entfernt top_ad_until
        updates.top_ad_until = null;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: 'Downgrade erfolgreich!',
        description: `Dein Profil wurde zu ${newType.toUpperCase()} geändert.`,
      });
      
      await loadProfile();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    }
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
        'Sichtbar im gewählten Kanton',
        'Bis zu 5 Fotos',
        'Kontaktdaten anzeigen',
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
        'Alles von Standard +',
        'VIP Badge',
        'Bis zu 10 Fotos + 1 Video',
        'Bessere Platzierung',
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
        'Alles von Premium +',
        'Immer ganz oben platziert',
        'Schweizweit auf Startseite',
        'Bis zu 15 Fotos + 2 Videos',
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
            onClick={() => navigate('/mein-profil')}
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
                    {profile?.status === 'active' ? '✅ Aktiv' : '❌ Inaktiv'}
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
                
                {profile?.status === 'inactive' && (
                  <Button 
                    onClick={() => handleReactivate(profile.listing_type)} 
                    className="w-full"
                    variant="default"
                  >
                    Reaktivieren ({profile.listing_type.toUpperCase()})
                  </Button>
                )}
                
                {profile?.status === 'active' && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleExtend} className="flex-1">
                      Verlängern (+30 Tage)
                    </Button>
                    
                    {profile.listing_type === 'top' && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleDowngrade('premium')}
                        className="flex-1"
                      >
                        Downgrade zu Premium
                      </Button>
                    )}
                    
                    {profile.listing_type === 'premium' && (
                      <Button 
                        variant="outline" 
                        onClick={() => handleDowngrade('basic')}
                        className="flex-1"
                      >
                        Downgrade zu Basic
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
