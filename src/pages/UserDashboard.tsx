import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Loader2, ExternalLink, Edit, Trash2, Star, Crown, Shield, Lock, Heart, Plus } from 'lucide-react';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: seoTitle } = useSiteSetting('seo_dashboard_title');
  const { data: dashboardWelcome } = useSiteSetting('dashboard_welcome_text');
  const { data: createProfileButton } = useSiteSetting('dashboard_create_profile_button');
  const { data: editProfileButton } = useSiteSetting('dashboard_edit_profile_button');
  const { data: favoritesButton } = useSiteSetting('dashboard_favorites_button');
  const { data: statusPending } = useSiteSetting('dashboard_status_pending');
  const { data: statusActive } = useSiteSetting('dashboard_status_active');
  const { data: statusRejected } = useSiteSetting('dashboard_status_rejected');
  const { data: noProfileTitle } = useSiteSetting('dashboard_no_profile_title');
  const { data: noProfileText } = useSiteSetting('dashboard_no_profile_text');
  const { data: noProfileButton } = useSiteSetting('dashboard_no_profile_button');
  const { data: packageTitle } = useSiteSetting('dashboard_package_title');
  const { data: packageBasic } = useSiteSetting('dashboard_package_basic_desc');
  const { data: packagePremium } = useSiteSetting('dashboard_package_premium_desc');
  const { data: packageTop } = useSiteSetting('dashboard_package_top_desc');
  const { data: validUntil } = useSiteSetting('dashboard_valid_until');
  const { data: upgradeButton } = useSiteSetting('dashboard_upgrade_button');
  const { data: extendButton } = useSiteSetting('dashboard_extend_button');
  const { data: profileDataTitle } = useSiteSetting('dashboard_profile_data_title');
  const { data: labelName } = useSiteSetting('dashboard_label_name');
  const { data: labelGender } = useSiteSetting('dashboard_label_gender');
  const { data: labelLocation } = useSiteSetting('dashboard_label_location');
  const { data: labelLanguages } = useSiteSetting('dashboard_label_languages');
  const { data: labelAbout } = useSiteSetting('dashboard_label_about');
  const { data: labelCategories } = useSiteSetting('dashboard_label_categories');
  const { data: photosTitle } = useSiteSetting('dashboard_photos_title');
  const { data: privacyTitle } = useSiteSetting('dashboard_privacy_title');
  const { data: deleteTitle } = useSiteSetting('dashboard_delete_title');
  const { data: deleteText } = useSiteSetting('dashboard_delete_text');
  const { data: deleteButton } = useSiteSetting('dashboard_delete_button');

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
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link to="/favoriten">
                    <Heart className="h-4 w-4 mr-2" />
                    {favoritesButton || 'Favoriten'}
                  </Link>
                </Button>
                {getStatusBadge(profile.status)}
              </div>
            </div>


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
                <CardContent className="pt-6 flex items-center justify-between">
                  <p className="text-sm">
                    Dein Profil ist online und für alle sichtbar!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/profil/${profile.slug}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Öffentliches Profil ansehen
                  </Button>
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

                  {profile.listing_type !== 'top' && (
                    <Button 
                      onClick={() => navigate('/user/upgrade')} 
                      className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      {upgradeButton || 'Paket upgraden'}
                    </Button>
                  )}

                  {profile.listing_type === 'top' && (
                    <Button 
                      onClick={() => navigate('/user/upgrade')} 
                      variant="outline"
                      className="w-full"
                    >
                      {extendButton || 'Paket verlängern'}
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
                        <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden border">
                          <img
                            src={getPublicUrl(photo.storage_path)}
                            alt="Profil Foto"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          {photo.is_primary && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="default" className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                Hauptfoto
                              </Badge>
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
    </>
  );
};

export default UserDashboard;
