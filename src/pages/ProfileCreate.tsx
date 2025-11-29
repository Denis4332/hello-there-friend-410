import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { SEO } from '@/components/SEO';
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
  const [listingType, setListingType] = useState<'basic' | 'premium' | 'top'>('basic');
  const [currentStep, setCurrentStep] = useState<'form' | 'listing-type' | 'photos' | 'verification'>('form');

  const { data: seoTitle } = useSiteSetting('seo_profile_create_title');
  const { data: createTitle } = useSiteSetting('profile_create_title');
  const { data: createSubtitle } = useSiteSetting('profile_create_subtitle');
  const { data: photosTitle } = useSiteSetting('profile_photos_title');
  const { data: photosSubtitle } = useSiteSetting('profile_photos_subtitle');
  const { data: tabData } = useSiteSetting('profile_tab_data');
  const { data: tabListing } = useSiteSetting('profile_tab_listing');
  const { data: tabPhotos } = useSiteSetting('profile_tab_photos');
  const { data: tabVerification } = useSiteSetting('profile_tab_verification');
  const { data: photosSaveButton } = useSiteSetting('profile_photos_save_button');

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
    } catch (error) {
      toast({
        title: 'Fehler beim Laden',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    }
  };

  const handleFormSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Check if user already has a profile (prevent duplicates on page reload)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingProfile) {
        toast({
          title: 'Profil existiert bereits',
          description: 'Du hast bereits ein Profil. Bearbeite es im Dashboard.',
          variant: 'destructive',
        });
        navigate('/mein-profil');
        return;
      }

      // SECURITY: Create profile without contact data
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
          lat: data.lat,
          lng: data.lng,
          about_me: data.about_me,
          languages: data.languages,
          status: 'pending',
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // SECURITY: Insert contact data into separate protected table
      const { error: contactError } = await supabase
        .from('profile_contacts')
        .insert({
          profile_id: profile.id,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
          telegram: data.telegram,
          instagram: data.instagram,
          website: data.website,
        });

      if (contactError) throw contactError;

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

  const handleListingTypeSubmit = async () => {
    if (!profileId) return;

    try {
      // Calculate expiry date (30 days from now for all listing types)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const updateData: any = { 
        listing_type: listingType,
        premium_until: expiryDate.toISOString()
      };

      // For TOP ads, also set top_ad_until
      if (listingType === 'top') {
        updateData.top_ad_until = expiryDate.toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profileId);

      if (error) throw error;

      setCurrentStep('photos');
      const typeNames = {
        basic: 'Standard',
        premium: 'Premium',
        top: 'TOP AD'
      };
      toast({
        title: `${typeNames[listingType]} Inserat gewählt`,
        description: 'Lade nun deine Fotos hoch',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
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
    navigate('/mein-profil');
  };

  const handleVerificationSkip = () => {
    toast({
      title: 'Inserat eingereicht!',
      description: 'Dein Inserat wird in den nächsten 24 Stunden geprüft und freigeschaltet.',
    });
    navigate('/mein-profil');
  };

  return (
    <>
      <SEO title={seoTitle || createTitle || 'Inserat erstellen'} description="Erstelle dein Inserat" />
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
                  {tabData || '1. Profildaten'}
                </TabsTrigger>
                <TabsTrigger value="listing-type" disabled={!profileId || currentStep === 'form'}>
                  {tabListing || '2. Inserat-Typ'}
                </TabsTrigger>
                <TabsTrigger value="photos" disabled={currentStep === 'form' || currentStep === 'listing-type'}>
                  {tabPhotos || '3. Fotos'}
                </TabsTrigger>
                <TabsTrigger value="verification" disabled={currentStep === 'form' || currentStep === 'listing-type'}>
                  {tabVerification || '4. Verifizierung'}
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
                    selectedType={listingType}
                    onSelect={(type) => setListingType(type)}
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
                      {photosSaveButton || 'Fotos speichern und weiter'}
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
