import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { ProfileForm, ProfileFormData } from '@/components/profile/ProfileForm';
import { PhotoUploader } from '@/components/profile/PhotoUploader';
import { VerificationUploader } from '@/components/profile/VerificationUploader';
import { ListingTypeSelector } from '@/components/profile/ListingTypeSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const ProfileCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cantons, setCantons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'listing-type' | 'photos' | 'verification'>('form');

  const { data: createTitle } = useSiteSetting('profile_create_title');
  const { data: createSubtitle } = useSiteSetting('profile_create_subtitle');
  const { data: photosTitle } = useSiteSetting('profile_photos_title');
  const { data: photosSubtitle } = useSiteSetting('profile_photos_subtitle');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cantonsRes, categoriesRes] = await Promise.all([
        supabase.from('cantons').select('*').order('name'),
        supabase.from('categories').select('*').eq('active', true).order('sort_order'),
      ]);

      if (cantonsRes.data) setCantons(cantonsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error: any) {
      toast({
        title: 'Fehler beim Laden',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: data.display_name,
          is_adult: data.is_adult,
          gender: data.gender,
          city: data.city,
          canton: data.canton,
          postal_code: data.postal_code,
          about_me: data.about_me,
          languages: data.languages,
          phone: data.phone,
          whatsapp: data.whatsapp,
          email: data.email,
          website: data.website,
          telegram: data.telegram,
          instagram: data.instagram,
          status: 'pending',
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Insert profile categories
      const categoryInserts = data.category_ids.map((catId) => ({
        profile_id: profile.id,
        category_id: catId,
      }));

      const { error: categoriesError } = await supabase
        .from('profile_categories')
        .insert(categoryInserts);

      if (categoriesError) throw categoriesError;

      setProfileId(profile.id);
      setCurrentStep('listing-type');

      toast({
        title: 'Profil erstellt',
        description: 'Wähle nun deinen Inserat-Typ',
      });
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

  const handleListingTypeSubmit = async () => {
    if (!profileId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: isPremium })
        .eq('id', profileId);

      if (error) throw error;

      setCurrentStep('photos');
      toast({
        title: isPremium ? 'Premium Inserat gewählt' : 'Normal Inserat gewählt',
        description: 'Lade nun deine Fotos hoch',
      });
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handlePhotosComplete = () => {
    setCurrentStep('verification');
    setTimeout(() => {
      const verificationTab = document.querySelector('[value="verification"]');
      verificationTab?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleVerificationComplete = () => {
    toast({
      title: 'Inserat eingereicht!',
      description: 'Dein Inserat wird in den nächsten 24 Stunden geprüft und freigeschaltet.',
    });
    navigate('/user/dashboard');
  };

  const handleVerificationSkip = () => {
    toast({
      title: 'Inserat eingereicht!',
      description: 'Dein Inserat wird in den nächsten 24 Stunden geprüft und freigeschaltet.',
    });
    navigate('/user/dashboard');
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">{createTitle || 'Profil erstellen'}</h1>
            <p className="text-muted-foreground mb-6">
              {createSubtitle || 'Erstelle dein Profil in 2 Schritten: Zuerst die Basisdaten, dann deine Fotos'}
            </p>

            <Tabs value={currentStep} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="form" disabled={currentStep !== 'form'}>
                  1. Profildaten
                </TabsTrigger>
                <TabsTrigger value="listing-type" disabled={!profileId || currentStep === 'form'}>
                  2. Inserat-Typ
                </TabsTrigger>
                <TabsTrigger value="photos" disabled={currentStep === 'form' || currentStep === 'listing-type'}>
                  3. Fotos
                </TabsTrigger>
                <TabsTrigger value="verification" disabled={currentStep === 'form' || currentStep === 'listing-type'}>
                  4. Verifizierung
                </TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="mt-6">
                <ProfileForm
                  onSubmit={handleFormSubmit}
                  cantons={cantons}
                  categories={categories}
                  isSubmitting={isSubmitting}
                />
              </TabsContent>

              <TabsContent value="listing-type" className="mt-6">
                {profileId && (
                  <ListingTypeSelector
                    selectedType={isPremium ? 'premium' : 'normal'}
                    onSelect={(type) => setIsPremium(type === 'premium')}
                    onContinue={handleListingTypeSubmit}
                  />
                )}
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                {profileId && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">{photosTitle || 'Fotos hochladen'}</h2>
                      <p className="text-sm text-muted-foreground">
                        {photosSubtitle || 'Lade mindestens 1 Foto hoch. Das erste Foto wird als Hauptfoto verwendet.'}
                      </p>
                    </div>
                    <PhotoUploader profileId={profileId} />
                    <Button
                      type="button"
                      onClick={handlePhotosComplete}
                      size="lg"
                      className="w-full"
                    >
                      Fotos speichern und weiter
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="verification" className="mt-6">
                {profileId && (
                  <VerificationUploader
                    profileId={profileId}
                    onComplete={handleVerificationComplete}
                    onSkip={handleVerificationSkip}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileCreate;
