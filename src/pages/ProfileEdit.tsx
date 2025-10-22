import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { ProfileForm, ProfileFormData } from '@/components/profile/ProfileForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, Star } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [cantons, setCantons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

      setProfile(profileRes.data);
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
    } catch (error: any) {
      toast({
        title: 'Fehler beim Laden',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: ProfileFormData) => {
    if (!user || !profile) return;

    setIsSubmitting(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: data.display_name,
          age: data.age,
          gender: data.gender,
          city: data.city,
          canton: data.canton,
          postal_code: data.postal_code,
          about_me: data.about_me,
          languages: data.languages,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

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
        description: 'Deine Änderungen wurden gespeichert',
      });

      navigate('/mein-profil');
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('photos')
        .insert({
          profile_id: profile.id,
          storage_path: fileName,
          is_primary: photos.length === 0,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Foto hochgeladen',
        description: 'Dein Foto wurde erfolgreich hochgeladen',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
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
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
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
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
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

  const defaultValues: ProfileFormData = {
    display_name: profile.display_name,
    age: profile.age,
    gender: profile.gender,
    city: profile.city,
    canton: profile.canton,
    postal_code: profile.postal_code || '',
    about_me: profile.about_me || '',
    languages: profile.languages || [],
    category_ids: profile.profile_categories?.map((pc: any) => pc.category_id) || [],
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

            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Profildaten</CardTitle>
                  <CardDescription>Bearbeite deine Informationen</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm
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
                  <CardTitle>Fotos ({photos.length}/5)</CardTitle>
                  <CardDescription>Verwalte deine Profilfotos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {photos.length < 5 && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={uploadingPhoto}
                          onClick={() => document.getElementById('photo-upload')?.click()}
                        >
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Wird hochgeladen...
                            </>
                          ) : (
                            'Neues Foto hochladen'
                          )}
                        </Button>
                      </label>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <div className="aspect-square rounded-md overflow-hidden border">
                          <img
                            src={getPublicUrl(photo.storage_path)}
                            alt="Profil Foto"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {photo.is_primary && (
                          <div className="absolute top-2 right-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!photo.is_primary && (
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
                                <AlertDialogTitle>Foto löschen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Dieses Foto wird dauerhaft entfernt.
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
                    ))}
                  </div>

                  {photos.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Noch keine Fotos hochgeladen
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-8">
              <Button variant="outline" onClick={() => navigate('/mein-profil')}>
                Zurück zum Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileEdit;
