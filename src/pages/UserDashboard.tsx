import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ExternalLink, Edit, Trash2, Star, Crown, Shield, Lock, Plus, MessageCircle } from 'lucide-react';
import { PaymentMethodModal } from '@/components/PaymentMethodModal';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);

  const getAmountForListingType = (type: string): number => {
    const prices: Record<string, number> = {
      basic: 49,
      premium: 99,
      top: 199
    };
    return prices[type] || 49;
  };

  const handlePayNow = () => {
    if (!profile) return;
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = async (method: 'PHONE' | 'SMS') => {
    if (!profile) return;
    
    setIsPaymentLoading(true);
    try {
      const amountCents = getAmountForListingType(profile.listing_type) * 100;
      
      const { data, error } = await supabase.functions.invoke('payport-checkout', {
        body: {
          orderId: profile.id,
          amountCents,
          returnUrl: window.location.origin + '/payport/return',
          method
        }
      });
      
      if (error) throw error;
      
      // Debug-Logging nur mit ?debug=1
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
      setIsPaymentLoading(false);
      setShowPaymentModal(false);
    }
  };

  const { getSetting } = useSiteSettingsContext();
  const seoTitle = getSetting('seo_dashboard_title', 'Dashboard');
  const editProfileButton = getSetting('dashboard_edit_profile_button', 'Profil bearbeiten');
  const statusPending = getSetting('dashboard_status_pending', 'In Prüfung');
  const statusActive = getSetting('dashboard_status_active', 'Aktiv');
  const statusRejected = getSetting('dashboard_status_rejected', 'Abgelehnt');
  const noProfileTitle = getSetting('dashboard_no_profile_title', 'Noch kein Inserat');
  const noProfileText = getSetting('dashboard_no_profile_text', 'Du hast noch kein Inserat erstellt. Starte jetzt und erreiche tausende potenzielle Kunden!');
  const noProfileButton = getSetting('dashboard_no_profile_button', 'Inserat aufgeben');
  const packageTitle = getSetting('dashboard_package_title', 'Dein Inserat-Paket');
  const packageBasic = getSetting('dashboard_package_basic_desc', '📋 Standard Inserat - Basis-Sichtbarkeit');
  const packagePremium = getSetting('dashboard_package_premium_desc', '👑 Premium Inserat - VIP Badge, größere Darstellung, höhere Priorität');
  const packageTop = getSetting('dashboard_package_top_desc', '⭐ TOP AD - Maximale Sichtbarkeit, immer ganz oben, hervorgehoben');
  const validUntil = getSetting('dashboard_valid_until', 'Gültig bis');
  const upgradeButton = getSetting('dashboard_upgrade_button', 'Paket upgraden');
  const extendButton = getSetting('dashboard_extend_button', 'Paket verlängern');
  const profileDataTitle = getSetting('dashboard_profile_data_title', 'Profildaten');
  const labelName = getSetting('dashboard_label_name', 'Anzeigename');
  const labelGender = getSetting('dashboard_label_gender', 'Geschlecht');
  const labelLocation = getSetting('dashboard_label_location', 'Standort');
  const labelLanguages = getSetting('dashboard_label_languages', 'Sprachen');
  const labelAbout = getSetting('dashboard_label_about', 'Über mich');
  const labelCategories = getSetting('dashboard_label_categories', 'Kategorien');
  const photosTitle = getSetting('dashboard_photos_title', 'Fotos');

  const [searchParams, setSearchParams] = useSearchParams();

  // Show toast for payment status from URL parameter
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast({
        title: 'Zahlung erfolgreich!',
        description: 'Dein Inserat ist jetzt aktiv.',
      });
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
    } else if (paymentStatus === 'failed') {
      toast({
        title: 'Zahlung fehlgeschlagen',
        description: 'Bitte versuche es erneut.',
        variant: 'destructive',
      });
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
    } else if (paymentStatus === 'hash_error' || paymentStatus === 'error') {
      toast({
        title: 'Ein Fehler ist aufgetreten',
        description: 'Bitte kontaktiere den Support.',
        variant: 'destructive',
      });
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, profile_categories(category_id, categories(name))')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile(profileData);

        const { data: photosData, error: photosError } = await supabase
          .from('photos')
          .select('*')
          .eq('profile_id', profileData.id)
          .order('is_primary', { ascending: false })
          .order('created_at', { ascending: true });

        if (photosError) throw photosError;
        setPhotos(photosData || []);
      }
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

  const handleDeleteAccount = async () => {
    if (!deleteConfirmed) {
      toast({
        title: 'Bestätigung erforderlich',
        description: 'Bitte bestätige, dass du alle Daten löschen möchtest',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Keine aktive Session');
      }

      const { error } = await supabase.functions.invoke('delete-user-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Account gelöscht',
        description: 'Dein Account und alle Daten wurden dauerhaft gelöscht',
      });

      // Logout and redirect
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Fehler beim Löschen',
        description: error.message,
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">📝 Unvollständig</Badge>;
      case 'pending':
        return <Badge variant="secondary">{statusPending || 'In Prüfung'}</Badge>;
      case 'active':
        return <Badge variant="default">{statusActive || 'Aktiv'}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{statusRejected || 'Abgelehnt'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPublicUrl = (storagePath: string) => {
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleSetPrimary = async (photoId: string) => {
    if (!profile) return;
    setSettingPrimary(photoId);
    try {
      const { error: resetError } = await supabase
        .from('photos')
        .update({ is_primary: false })
        .eq('profile_id', profile.id);
      if (resetError) throw resetError;

      const { error: setError } = await supabase
        .from('photos')
        .update({ is_primary: true })
        .eq('id', photoId);
      if (setError) throw setError;

      setPhotos(prev => prev.map(p => ({ ...p, is_primary: p.id === photoId })));
      toast({ title: 'Hauptfoto geändert', description: 'Das neue Hauptfoto wurde gesetzt.' });
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setSettingPrimary(null);
    }
  };

  if (loading) {
    return (
      <>
        <SEO title={seoTitle || 'Dashboard'} description="Verwalte dein Profil und Inserate" />
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <SEO title={seoTitle || 'Dashboard'} description="Verwalte dein Profil und Inserate" />
        <Header />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-2xl font-bold mb-4">{noProfileTitle || 'Noch kein Inserat'}</h1>
            <p className="text-muted-foreground mb-6">
              {noProfileText || 'Du hast noch kein Inserat erstellt. Starte jetzt und erreiche tausende potenzielle Kunden!'}
            </p>
            <Button onClick={() => navigate('/profil/erstellen')} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              {noProfileButton || 'Inserat aufgeben'}
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title={seoTitle || 'Dashboard'} description="Verwalte dein Profil und Inserate" />
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Mein Profil</h1>
              <div className="flex gap-3 flex-wrap">
                <Button asChild variant="outline">
                  <Link to="/kontakt">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Support
                  </Link>
                </Button>
                {getStatusBadge(profile.status)}
              </div>
            </div>

            {/* Draft Status Warning - Photo required */}
            {profile.status === 'draft' && (
              <Card className="mb-6 border-orange-500/50 bg-orange-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="border-orange-500 text-orange-600">📝 Unvollständig</Badge>
                    <span className="text-sm">
                      Dein Profil ist unvollständig. Bitte lade mindestens 1 Foto hoch, um dein Inserat zur Prüfung freizugeben.
                    </span>
                    <Button size="sm" onClick={() => navigate('/profil/bearbeiten')}>
                      Profil vervollständigen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Status Display */}
            {profile.payment_status === 'paid' && profile.status === 'pending' && (
              <Card className="mb-6 border-green-500/50 bg-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">✅ Bezahlt</Badge>
                    <span className="text-sm">
                      Dein Inserat wird innerhalb von 24 Stunden geprüft und freigeschaltet.
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.payment_status === 'pending' && profile.status === 'pending' && (
              <Card className="mb-6 border-orange-500/50 bg-orange-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="destructive">⏳ Zahlung ausstehend</Badge>
                    <span className="text-sm">
                      Bitte schliesse die Zahlung ab, um dein Inserat zur Prüfung freizugeben.
                    </span>
                    <Button size="sm" onClick={handlePayNow} disabled={isPaymentLoading}>
                      {isPaymentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Jetzt bezahlen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {profile.status === 'pending' && (
              <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="pt-6">
                  <p className="text-sm">
                    Dein Profil wird derzeit überprüft. Dies kann bis zu 24 Stunden dauern.
                  </p>
                </CardContent>
              </Card>
            )}

            {profile.status === 'rejected' && (
              <Card className="mb-6 border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                  <p className="text-sm text-destructive">
                    Dein Profil wurde abgelehnt. Bitte überarbeite deine Angaben und versuche es erneut.
                  </p>
                </CardContent>
              </Card>
            )}

            {profile.status === 'active' && (
              <Card className="mb-6 border-green-500/50 bg-green-500/5">
                <CardContent className="pt-6 flex items-center justify-between flex-wrap gap-3">
                  <p className="text-sm">
                    Dein Profil ist online und für alle sichtbar!
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/profil/bearbeiten')}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {editProfileButton || 'Profil bearbeiten'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/profil/${profile.slug}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Öffentliches Profil ansehen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inserat-Paket Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {profile.listing_type === 'top' && <Star className="h-5 w-5 text-pink-600" />}
                    {profile.listing_type === 'premium' && <Crown className="h-5 w-5 text-amber-500" />}
                    {profile.listing_type === 'basic' && <Shield className="h-5 w-5 text-gray-500" />}
                    {packageTitle || 'Dein Inserat-Paket'}
                  </span>
                  {profile.listing_type === 'top' && (
                    <Badge className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
                      TOP AD
                    </Badge>
                  )}
                  {profile.listing_type === 'premium' && (
                    <Badge className="bg-gradient-to-r from-amber-400 to-pink-600 text-white">
                      PREMIUM
                    </Badge>
                  )}
                  {profile.listing_type === 'basic' && (
                    <Badge variant="secondary">STANDARD</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Aktuelles Paket:</p>
                    <p className="font-semibold">
                      {profile.listing_type === 'basic' && (packageBasic || '📋 Standard Inserat - Basis-Sichtbarkeit')}
                      {profile.listing_type === 'premium' && (packagePremium || '👑 Premium Inserat - VIP Badge, größere Darstellung, höhere Priorität')}
                      {profile.listing_type === 'top' && (packageTop || '⭐ TOP AD - Maximale Sichtbarkeit, immer ganz oben, hervorgehoben')}
                    </p>
                  </div>
                  
                  {(profile.premium_until || profile.top_ad_until) && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">{validUntil || 'Gültig bis'}:</p>
                      <p className="font-medium text-green-600">
                        {new Date(profile.premium_until || profile.top_ad_until || '').toLocaleDateString('de-CH', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Wenn Zahlung ausstehend UND NICHT aktiv: "Paket ändern" zeigen */}
                  {profile.payment_status === 'pending' && profile.status !== 'active' && (
                    <Button 
                      onClick={() => navigate('/profil/erstellen?step=listing-type')} 
                      variant="outline"
                      className="w-full"
                    >
                      Paket ändern
                    </Button>
                  )}

                  {/* Wenn AKTIV + BEZAHLT: Upgrade nur wenn nicht TOP */}
                  {profile.status === 'active' && profile.payment_status === 'paid' && profile.listing_type !== 'top' && (
                    <Button 
                      onClick={() => navigate('/user/upgrade')} 
                      className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {upgradeButton || 'Paket upgraden'}
                    </Button>
                  )}

                  {/* Wenn AKTIV + BEZAHLT + TOP: Verlängern anbieten */}
                  {profile.status === 'active' && profile.payment_status === 'paid' && profile.listing_type === 'top' && (
                    <Button 
                      onClick={() => navigate('/user/upgrade')} 
                      variant="outline"
                      className="w-full"
                    >
                      {extendButton || 'Inserat verlängern'}
                    </Button>
                  )}

                  {/* Wenn AKTIV: Info über Downgrade-Beschränkung */}
                  {profile.status === 'active' && profile.payment_status === 'paid' && profile.listing_type !== 'basic' && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Downgrade erst nach Ablauf am{' '}
                      {new Date(profile.premium_until || profile.top_ad_until || '').toLocaleDateString('de-CH')} möglich
                    </p>
                  )}

                  {/* Wenn INAKTIV (abgelaufen): Reaktivieren anbieten */}
                  {profile.status === 'inactive' && (
                    <Button 
                      onClick={() => navigate('/user/upgrade')} 
                      className="w-full"
                    >
                      Inserat reaktivieren
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{profileDataTitle || 'Profildaten'}</CardTitle>
                  <CardDescription>Deine öffentlichen Informationen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">{labelName || 'Anzeigename'}</div>
                    <div className="font-medium">{profile.display_name}</div>
                  </div>
                  {profile.gender && (
                    <div>
                      <div className="text-sm text-muted-foreground">{labelGender || 'Geschlecht'}</div>
                      <div className="font-medium">{profile.gender}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">{labelLocation || 'Standort'}</div>
                    <div className="font-medium">
                      {profile.city}, {profile.canton}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{labelLanguages || 'Sprachen'}</div>
                    <div className="font-medium">{profile.languages?.join(', ')}</div>
                  </div>
                  {profile.about_me && (
                    <div>
                      <div className="text-sm text-muted-foreground">{labelAbout || 'Über mich'}</div>
                      <div className="font-medium text-sm">{profile.about_me}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">{labelCategories || 'Kategorien'}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.profile_categories?.map((pc: any) => (
                        <Badge key={pc.category_id} variant="secondary">
                          {pc.categories?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{photosTitle || 'Fotos'} ({photos.length})</CardTitle>
                  <CardDescription>Deine hochgeladenen Bilder</CardDescription>
                </CardHeader>
                <CardContent>
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {photos.map((photo) => (
                        <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden border group">
                          <img
                            src={getPublicUrl(photo.storage_path)}
                            alt="Profil Foto"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          {photo.is_primary ? (
                            <div className="absolute top-2 right-2">
                              <Badge variant="default" className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Hauptfoto
                              </Badge>
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSetPrimary(photo.id)}
                                disabled={settingPrimary === photo.id}
                              >
                                {settingPrimary === photo.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Star className="h-3 w-3 mr-1" />
                                )}
                                Als Hauptfoto
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Keine Fotos hochgeladen
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Datenschutz & Sicherheit
                </CardTitle>
                <CardDescription>
                  Verwalte deine persönlichen Daten gemäß DSGVO
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
                  <div>
                    <p className="font-medium text-destructive">Account vollständig löschen</p>
                    <p className="text-sm text-muted-foreground">
                      Lösche deinen Account und alle zugehörigen Daten dauerhaft
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Account löschen
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Account wirklich löschen?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                          <p className="font-semibold text-destructive">
                            ⚠️ Diese Aktion kann NICHT rückgängig gemacht werden!
                          </p>
                          <p>
                            Folgende Daten werden dauerhaft gelöscht:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Dein Profil und alle Informationen</li>
                            <li>Alle hochgeladenen Fotos</li>
                            <li>Alle Kontaktinformationen</li>
                            <li>Alle Statistiken und Analytics-Daten</li>
                            <li>Dein Benutzer-Account</li>
                          </ul>
                          <div className="flex items-center space-x-2 pt-4">
                            <Checkbox
                              id="delete-confirm"
                              checked={deleteConfirmed}
                              onCheckedChange={(checked) => setDeleteConfirmed(checked as boolean)}
                            />
                            <label
                              htmlFor="delete-confirm"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Ich verstehe, dass alle meine Daten dauerhaft gelöscht werden
                            </label>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmed(false)}>
                          Abbrechen
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={!deleteConfirmed || isDeleting}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Wird gelöscht...
                            </>
                          ) : (
                            'Endgültig löschen'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="pt-2">
                  <Button
                    variant="link"
                    onClick={() => navigate('/datenschutz')}
                    className="text-sm"
                  >
                    Datenschutzerklärung lesen →
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 mt-6">
              <Button onClick={() => navigate('/profil/bearbeiten')} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                {editProfileButton || 'Profil bearbeiten'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectMethod={handlePaymentMethodSelect}
        listingType={profile?.listing_type as 'basic' | 'premium' | 'top' | undefined}
        amount={getAmountForListingType(profile?.listing_type || 'basic')}
        onChangePackage={() => {
          setShowPaymentModal(false);
          navigate('/profil/erstellen');
        }}
      />
    </>
  );
};

export default UserDashboard;
