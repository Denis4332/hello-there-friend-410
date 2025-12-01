import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { recordAgbAcceptance } from '@/hooks/useAgbAcceptances';

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
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [uploadedPhotoCount, setUploadedPhotoCount] = useState(0);

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

  // Check for existing profile on page load (handles page reload during creation)
  useEffect(() => {
    if (!user) return;
    
    const checkExistingProfile = async () => {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, status, listing_type, payment_status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingProfile) {
        setProfileId(existingProfile.id);
        
        // WICHTIG: listing_type wiederherstellen für Video-Limits!
        if (existingProfile.listing_type) {
          setListingType(existingProfile.listing_type as 'basic' | 'premium' | 'top');
        }
        
        // Check photos to determine correct step
        const { data: photos } = await supabase
          .from('photos')
          .select('id')
          .eq('profile_id', existingProfile.id);
        
        // Foto-Count setzen
        setUploadedPhotoCount(photos?.length || 0);
        
        // Determine correct step based on profile state
        if (!existingProfile.listing_type) {
          setCurrentStep('listing-type');
        } else if (!photos || photos.length === 0) {
          setCurrentStep('photos');
        } else {
          setCurrentStep('verification');
        }
      }
    };
    
    checkExistingProfile();
  }, [user]);

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

    // Check AGB acceptance
    if (!agbAccepted) {
      toast({
        title: 'AGB nicht akzeptiert',
        description: 'Bitte akzeptiere die Inserat-AGB, um fortzufahren.',
        variant: 'destructive',
      });
      return;
    }

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
          status: 'draft',
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

      // Record AGB acceptance for profile creation
      try {
        await recordAgbAcceptance({
          userId: user.id,
          email: data.email || user.email || '',
          profileId: profile.id,
          acceptanceType: 'profile_creation',
          agbVersion: '1.0',
        });
      } catch (agbError) {
        console.error('Failed to record AGB acceptance:', agbError);
        // Continue anyway - profile is already created
      }

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
      // Only save listing_type - premium_until will be set by admin on activation
      const updateData = { 
        listing_type: listingType
      };

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
    if (uploadedPhotoCount === 0) {
      toast({
        title: 'Keine Fotos hochgeladen',
        description: 'Bitte lade mindestens 1 Foto hoch und klicke "Hochladen", bevor du fortfährst.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep('verification');
    setTimeout(() => {
      const verificationTab = document.querySelector('[value="verification"]');
      verificationTab?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Load photo count when entering photos step
  const loadPhotoCount = async () => {
    if (!profileId) return;
    const { data: photos } = await supabase
      .from('photos')
      .select('id')
      .eq('profile_id', profileId);
    setUploadedPhotoCount(photos?.length || 0);
  };

  useEffect(() => {
    if (currentStep === 'photos' && profileId) {
      loadPhotoCount();
    }
  }, [currentStep, profileId]);

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

            <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as typeof currentStep)} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="form" disabled={!!profileId}>
                  {tabData || '1. Profildaten'}
                </TabsTrigger>
                <TabsTrigger value="listing-type" disabled={!profileId}>
                  {tabListing || '2. Inserat-Typ'}
                </TabsTrigger>
                <TabsTrigger value="photos" disabled={!profileId || !listingType}>
                  {tabPhotos || '3. Fotos'}
                </TabsTrigger>
                <TabsTrigger value="verification" disabled={!profileId || uploadedPhotoCount === 0}>
                  {tabVerification || '4. Verifizierung'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="mt-6">
                {/* AGB Checkbox for Profile Creation */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="profile-agb-acceptance"
                      checked={agbAccepted}
                      onCheckedChange={(checked) => setAgbAccepted(checked === true)}
                      className="mt-0.5"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="profile-agb-acceptance"
                        className="text-sm font-medium leading-snug cursor-pointer"
                      >
                        Ich akzeptiere die Inserat-AGB *
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Mit dem Erstellen eines Inserats akzeptierst du unsere{' '}
                        <Link to="/agb" className="text-primary underline hover:no-underline" target="_blank">
                          AGB
                        </Link>{' '}
                        und{' '}
                        <Link to="/datenschutz" className="text-primary underline hover:no-underline" target="_blank">
                          Datenschutzbestimmungen
                        </Link>{' '}
                        für Inserate. Deine E-Mail wird als Nachweis gespeichert.
                      </p>
                    </div>
                  </div>
                </div>

                <ProfileForm
                  onSubmit={handleFormSubmit}
                  cantons={cantons}
                  categories={categories}
                  isSubmitting={isSubmitting || !agbAccepted}
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
                    <PhotoUploader 
                      profileId={profileId}
                      listingType={listingType}
                      onUploadComplete={() => setUploadedPhotoCount(prev => prev + 1)}
                    />
                    {uploadedPhotoCount === 0 && (
                      <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                        ⚠️ Bitte wähle Fotos aus und klicke auf "Hochladen", bevor du fortfährst.
                      </p>
                    )}
                    <Button
                      type="button"
                      onClick={handlePhotosComplete}
                      size="lg"
                      className="w-full"
                      disabled={uploadedPhotoCount === 0}
                    >
                      {photosSaveButton || 'Fotos speichern und weiter'} {uploadedPhotoCount > 0 && `(${uploadedPhotoCount} Foto${uploadedPhotoCount > 1 ? 's' : ''})`}
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
