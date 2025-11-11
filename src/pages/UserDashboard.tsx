import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ExternalLink, Edit, Trash2, Star, Crown, Shield, Download, Lock } from 'lucide-react';
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
  const [isExporting, setIsExporting] = useState(false);

  const { data: dashboardWelcome } = useSiteSetting('dashboard_welcome_text');
  const { data: createProfileButton } = useSiteSetting('dashboard_create_profile_button');
  const { data: editProfileButton } = useSiteSetting('dashboard_edit_profile_button');

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

  const handleExportData = async () => {
    setIsExporting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Keine aktive Session');
      }

      const { data, error } = await supabase.functions.invoke('export-user-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `escoria-daten-${user?.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Daten exportiert',
        description: 'Deine Daten wurden erfolgreich heruntergeladen',
      });
    } catch (error: any) {
      toast({
        title: 'Fehler beim Export',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">In Prüfung</Badge>;
      case 'active':
        return <Badge variant="default">Aktiv</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Abgelehnt</Badge>;
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
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Mein Profil</h1>
              {getStatusBadge(profile.status)}
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
                    Dein Inserat-Paket
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
                      {profile.listing_type === 'basic' && '📋 Standard Inserat - Basis-Sichtbarkeit'}
                      {profile.listing_type === 'premium' && '👑 Premium Inserat - VIP Badge, größere Darstellung, höhere Priorität'}
                      {profile.listing_type === 'top' && '⭐ TOP AD - Maximale Sichtbarkeit, immer ganz oben, hervorgehoben'}
                    </p>
                  </div>
                  
                  {(profile.premium_until || profile.top_ad_until) && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Gültig bis:</p>
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
                      Paket upgraden
                    </Button>
                  )}

                  {profile.listing_type === 'top' && (
                    <Button 
                      onClick={() => navigate('/user/upgrade')} 
                      variant="outline"
                      className="w-full"
                    >
                      Paket verlängern
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profildaten</CardTitle>
                  <CardDescription>Deine öffentlichen Informationen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Anzeigename</div>
                    <div className="font-medium">{profile.display_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Alter</div>
                    <div className="font-medium">{profile.age} Jahre</div>
                  </div>
                  {profile.gender && (
                    <div>
                      <div className="text-sm text-muted-foreground">Geschlecht</div>
                      <div className="font-medium">{profile.gender}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">Standort</div>
                    <div className="font-medium">
                      {profile.city}, {profile.canton}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Sprachen</div>
                    <div className="font-medium">{profile.languages?.join(', ')}</div>
                  </div>
                  {profile.about_me && (
                    <div>
                      <div className="text-sm text-muted-foreground">Über mich</div>
                      <div className="font-medium text-sm">{profile.about_me}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">Kategorien</div>
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
                  <CardTitle>Fotos ({photos.length})</CardTitle>
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
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Deine Daten exportieren</p>
                    <p className="text-sm text-muted-foreground">
                      Lade alle deine gespeicherten Daten als JSON-Datei herunter
                    </p>
                  </div>
                  <Button
                    onClick={handleExportData}
                    disabled={isExporting}
                    variant="outline"
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Exportieren
                  </Button>
                </div>

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
