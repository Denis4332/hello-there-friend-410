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
import { Loader2, ExternalLink, Edit, Trash2, Star, Crown, Shield } from 'lucide-react';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);

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

  const handleDeleteProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Profil gelöscht',
        description: 'Dein Profil wurde erfolgreich gelöscht',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
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

            <div className="flex gap-4 mt-8">
              <Button onClick={() => navigate('/profil/bearbeiten')} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                {editProfileButton || 'Profil bearbeiten'}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Profil löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bist du sicher?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion kann nicht rückgängig gemacht werden. Dein Profil und alle zugehörigen Daten werden dauerhaft gelöscht.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProfile}>
                      Endgültig löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;
