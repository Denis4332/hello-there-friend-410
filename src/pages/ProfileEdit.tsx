import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { ProfileForm, ProfileFormData } from '@/components/profile/ProfileForm';
import { PhotoUploader } from '@/components/profile/PhotoUploader';
import { VerificationUploader } from '@/components/profile/VerificationUploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, Star, Play, CheckCircle, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
// Media limits per listing type
const MEDIA_LIMITS = {
  basic: { photos: 5, videos: 0 },
  premium: { photos: 10, videos: 1 },
  top: { photos: 15, videos: 2 },
};

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [profile, setProfile] = useState<{
    id: string;
    user_id: string;
    display_name: string;
    age?: number;
    is_adult: boolean;
    gender?: string;
    city: string;
    canton: string;
    postal_code?: string;
    about_me?: string;
    languages?: string[];
    status?: string;
    slug?: string;
    listing_type?: string;
    verified_at?: string;
    profile_categories?: Array<{ category_id: string }>;
    // Contact fields from profile_contacts table
    email?: string;
    phone?: string;
    whatsapp?: string;
    telegram?: string;
    instagram?: string;
    website?: string;
    street_address?: string;
    show_street?: boolean;
  } | null>(null);
  const [photos, setPhotos] = useState<Array<{
    id: string;
    profile_id: string;
    storage_path: string;
    is_primary: boolean;
    created_at: string;
    media_type?: string;
  }>>([]);
  const [cantons, setCantons] = useState<Array<{
    id: string;
    name: string;
    abbreviation: string;
  }>>([]);
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    slug: string;
  }>>([]);

  // Show warning dialog for active profiles on first load
  useEffect(() => {
    if (profile?.status === 'active' && !warningAccepted) {
      setShowEditWarning(true);
    }
  }, [profile?.status, warningAccepted]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [profileRes, cantonsRes, categoriesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*, profile_categories(category_id)')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('cantons').select('*').order('name'),
        supabase.from('categories').select('*').eq('active', true).order('sort_order'),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (!profileRes.data) {
        navigate('/profil/erstellen');
        return;
      }

      // SECURITY: Load contact data from separate protected table
      const { data: contactData } = await supabase
        .from('profile_contacts')
        .select('*')
        .eq('profile_id', profileRes.data.id)
        .maybeSingle();

      // Merge profile and contact data
      setProfile({ ...profileRes.data, ...contactData });
      if (cantonsRes.data) setCantons(cantonsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);

      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('profile_id', profileRes.data.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (photosError) throw photosError;
      setPhotos(photosData || []);
    } catch (error) {
      toast({
        title: 'Fehler beim Laden',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isActiveProfile = profile?.status === 'active';

  const handleFormSubmit = async (data: ProfileFormData) => {
    if (!user || !profile) return;

    setIsSubmitting(true);
    try {
      // If profile was active, set to pending for re-review
      const newStatus = isActiveProfile ? 'pending' : profile.status;
      
      // SECURITY: Update profile data (no contact info)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name,
          is_adult: data.is_adult,
          gender: data.gender,
          city: data.city,
          canton: data.canton,
          postal_code: data.postal_code,
          about_me: data.about_me,
          languages: data.languages,
          status: newStatus,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // SECURITY: Update contact data in separate protected table
      const { error: contactError } = await supabase
        .from('profile_contacts')
        .upsert({
          profile_id: profile.id,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
          telegram: data.telegram,
          instagram: data.instagram,
          website: data.website,
        });

      if (contactError) throw contactError;

      await supabase
        .from('profile_categories')
        .delete()
        .eq('profile_id', profile.id);

      const categoryInserts = data.category_ids.map((catId) => ({
        profile_id: profile.id,
        category_id: catId,
      }));

      const { error: categoriesError } = await supabase
        .from('profile_categories')
        .insert(categoryInserts);

      if (categoriesError) throw categoriesError;

      toast({
        title: 'Profil aktualisiert',
        description: isActiveProfile 
          ? 'Deine Änderungen wurden gespeichert. Dein Profil wird erneut geprüft.'
          : 'Deine Änderungen wurden gespeichert',
      });

      navigate('/mein-profil');
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeletePhoto = async (photoId: string, storagePath: string) => {
    try {
      await supabase.storage.from('profile-photos').remove([storagePath]);

      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: 'Foto gelöscht',
        description: 'Das Foto wurde entfernt',
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    if (!profile) return;

    try {
      await supabase
        .from('photos')
        .update({ is_primary: false })
        .eq('profile_id', profile.id);

      const { error } = await supabase
        .from('photos')
        .update({ is_primary: true })
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: 'Hauptfoto aktualisiert',
        description: 'Das Foto wurde als Hauptfoto festgelegt',
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
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


  // Calculate media limits based on listing type
  const listingType = (profile.listing_type as 'basic' | 'premium' | 'top') || 'basic';
  const currentLimits = MEDIA_LIMITS[listingType];
  const imagePhotos = photos.filter(p => !p.media_type || p.media_type === 'image');
  const videoPhotos = photos.filter(p => p.media_type === 'video');

  const defaultValues: ProfileFormData = {
    display_name: profile.display_name,
    is_adult: true,
    gender: profile.gender,
    city: profile.city,
    canton: profile.canton,
    postal_code: profile.postal_code || '',
    about_me: profile.about_me || '',
    languages: profile.languages || [],
    category_ids: profile.profile_categories?.map((pc) => pc.category_id) || [],
    phone: profile.phone || '',
    whatsapp: profile.whatsapp || '',
    email: profile.email || '',
    website: profile.website || '',
    telegram: profile.telegram || '',
    instagram: profile.instagram || '',
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Profil bearbeiten</h1>
            <p className="text-muted-foreground mb-8">
              Aktualisiere deine Profildaten und Fotos
            </p>

            {/* Warning Dialog for Active Profiles */}
            <AlertDialog open={showEditWarning} onOpenChange={setShowEditWarning}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Achtung: Profil ist aktiv
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Wenn du dein Profil jetzt bearbeitest, muss es erneut geprüft werden. 
                    Das dauert bis zu 24 Stunden und dein Profil ist in dieser Zeit nicht mehr online sichtbar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => navigate('/mein-profil')}>
                    Abbrechen
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    setWarningAccepted(true);
                    setShowEditWarning(false);
                  }}>
                    Verstanden, trotzdem bearbeiten
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Draft Status Warning */}
            {profile.status === 'draft' && (
              <Card className="border-orange-500/50 bg-orange-500/5 mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 font-medium">📝 Profil unvollständig</span>
                  </div>
                  <p className="text-sm mt-2">
                    Lade mindestens 1 Foto hoch, um dein Inserat zur Prüfung freizugeben. 
                    Ohne Foto bleibt dein Profil im Entwurf-Status und wird nicht veröffentlicht.
                  </p>
                </CardContent>
              </Card>
            )}

            {profile.display_name === 'Neuer Nutzer' && profile.status !== 'draft' && (
              <Card className="border-blue-500/50 bg-blue-500/5 mb-6">
                <CardContent className="pt-6">
                  <p className="text-sm">
                    Vervollständige dein Profil, um es zu aktivieren. Füge deine Daten und mindestens 1 Foto hinzu.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Profildaten</CardTitle>
                  <CardDescription>Bearbeite deine Informationen</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm
                    formId="profile-edit-form"
                    showSubmitButton={false}
                    onSubmit={handleFormSubmit}
                    cantons={cantons}
                    categories={categories}
                    isSubmitting={isSubmitting}
                    defaultValues={defaultValues}
                    submitButtonText="Profil aktualisieren"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Medien-Verwaltung</CardTitle>
                  <CardDescription>
                    Lade Fotos und Videos hoch ({listingType.toUpperCase()} Paket)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Neue Medien hochladen</h3>
                    <PhotoUploader 
                      profileId={profile.id}
                      userId={user?.id}
                      listingType={listingType}
                      onUploadComplete={() => {
                        loadData();
                        setUploadSuccess(true);
                      }}
                      onSetPrimary={handleSetPrimary}
                      currentPrimaryId={photos.find(p => p.is_primary)?.id}
                    />
                    
                    {uploadSuccess && (
                      <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">Medien erfolgreich hochgeladen!</p>
                          <p className="text-sm text-muted-foreground">Deine Änderungen wurden automatisch gespeichert.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      📷 Fotos ({imagePhotos.length}/{currentLimits.photos})
                      {currentLimits.videos > 0 && (
                        <span className="ml-2">| 🎬 Videos ({videoPhotos.length}/{currentLimits.videos})</span>
                      )}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      {photos.map((photo) => {
                        const isVideo = photo.media_type === 'video';
                        
                        return (
                          <div key={photo.id} className="relative group">
                            <div className="aspect-square rounded-md overflow-hidden border">
                              {isVideo ? (
                                <div className="relative w-full h-full">
                                  <video
                                    src={getPublicUrl(photo.storage_path)}
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Play className="h-12 w-12 text-white fill-white/80" />
                                  </div>
                                </div>
                              ) : (
                                <img
                                  src={getPublicUrl(photo.storage_path)}
                                  alt="Profil Foto"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                              )}
                            </div>
                            {photo.is_primary && (
                              <div className="absolute top-2 right-2">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                              </div>
                            )}
                            {isVideo && (
                              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                🎬 Video
                              </div>
                            )}
                            <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!photo.is_primary && !isVideo && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="flex-1"
                                  onClick={() => handleSetPrimary(photo.id)}
                                >
                                  <Star className="h-3 w-3" />
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="flex-1">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>{isVideo ? 'Video' : 'Foto'} löschen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {isVideo ? 'Dieses Video' : 'Dieses Foto'} wird dauerhaft entfernt.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePhoto(photo.id, photo.storage_path)}
                                    >
                                      Löschen
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {photos.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Noch keine Medien hochgeladen
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Verification Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Verifizierung</CardTitle>
                  <CardDescription>
                    Verifizierte Profile erhalten mehr Vertrauen und Sichtbarkeit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile.verified_at ? (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">Profil verifiziert</p>
                        <p className="text-sm text-muted-foreground">
                          Verifiziert am {new Date(profile.verified_at).toLocaleDateString('de-CH')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <VerificationUploader
                      profileId={profile.id}
                      onComplete={() => {
                        toast({
                          title: 'Verifizierung eingereicht',
                          description: 'Deine Verifizierung wird geprüft.',
                        });
                      }}
                      onSkip={() => {
                        // User skipped verification, no action needed
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col gap-4">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Hinweis:</p>
                  <p>Foto-Uploads werden sofort gespeichert.</p>
                  {isActiveProfile && (
                    <p className="text-orange-600 mt-1">
                      ⚠️ Nach dem Speichern muss dein Profil erneut geprüft werden.
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    type="submit"
                    form="profile-edit-form"
                    disabled={isSubmitting}
                    className="sm:flex-1"
                  >
                    {isSubmitting ? 'Wird gespeichert...' : 'Profil aktualisieren'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/mein-profil')}
                  >
                    ← Zurück ohne Speichern
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileEdit;
