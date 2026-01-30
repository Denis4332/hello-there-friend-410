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
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { recordAgbAcceptance } from '@/hooks/useAgbAcceptances';
import { PaymentMethodModal } from '@/components/PaymentMethodModal';
import { ArrowLeft } from 'lucide-react';

// Foto/Video-Limits pro Paket
const MEDIA_LIMITS = {
  basic: { photos: 5, videos: 0 },
  premium: { photos: 10, videos: 1 },
  top: { photos: 15, videos: 2 },
};

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
  
  const [uploadedPhotoCount, setUploadedPhotoCount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { getSetting } = useSiteSettingsContext();
  const seoTitle = getSetting('seo_profile_create_title', 'Inserat erstellen');
  const createTitle = getSetting('profile_create_title', 'Profil erstellen');
  const createSubtitle = getSetting('profile_create_subtitle', 'Erstelle dein Profil in 2 Schritten: Zuerst die Basisdaten, dann deine Fotos');
  const photosTitle = getSetting('profile_photos_title', 'Fotos hochladen');
  const photosSubtitle = getSetting('profile_photos_subtitle', 'Lade mindestens 1 Foto hoch. Das erste Foto wird als Hauptfoto verwendet.');
  const tabData = getSetting('profile_tab_data', '1. Profildaten');
  const tabListing = getSetting('profile_tab_listing', '2. Inserat-Typ');
  const tabPhotos = getSetting('profile_tab_photos', '3. Fotos');
  const tabVerification = getSetting('profile_tab_verification', '4. Verifizierung');
  const photosSaveButton = getSetting('profile_photos_save_button', 'Fotos speichern und weiter');

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

  // Prüft ob die hochgeladenen Medien zum gewählten Paket passen
  const validateMediaForNewPackage = async (newType: 'basic' | 'premium' | 'top'): Promise<boolean> => {
    if (!profileId) return true; // Keine Fotos = OK

    const limits = MEDIA_LIMITS[newType];

    const { data: photos } = await supabase
      .from('photos')
      .select('id, media_type')
      .eq('profile_id', profileId);

    if (!photos || photos.length === 0) return true;

    const imageCount = photos.filter(p => p.media_type === 'image' || !p.media_type).length;
    const videoCount = photos.filter(p => p.media_type === 'video').length;

    if (imageCount > limits.photos || videoCount > limits.videos) {
      const typeNames = { basic: 'Standard', premium: 'Premium', top: 'TOP AD' };
      toast({
        title: 'Zu viele Medien für dieses Paket',
        description: `${typeNames[newType]} erlaubt max. ${limits.photos} Fotos${limits.videos > 0 ? ` und ${limits.videos} Video(s)` : ''}. Du hast ${imageCount} Foto(s)${videoCount > 0 ? ` und ${videoCount} Video(s)` : ''}. Bitte lösche erst überzählige Medien.`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleListingTypeSubmit = async () => {
    if (!profileId) return;

    // NEU: Medien-Limit prüfen bevor Paket gespeichert wird
    const isValid = await validateMediaForNewPackage(listingType);
    if (!isValid) return;

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

  const getAmountForListingType = (type: string): number => {
    const prices: Record<string, number> = {
      basic: 49,
      premium: 99,
      top: 199
    };
    return prices[type] || 49;
  };

  // WICHTIG: PayPort nur über Modal starten - nie direkt!
  const startPaymentCheckoutWithMethod = async (method: 'PHONE' | 'SMS') => {
    if (!profileId) return;

    try {
      // Update profile status to pending before payment
      await supabase
        .from('profiles')
        .update({ status: 'pending' })
        .eq('id', profileId);

      const amountCents = getAmountForListingType(listingType) * 100;
      
      const { data, error } = await supabase.functions.invoke('payport-checkout', {
        body: {
          orderId: profileId,
          amountCents,
          returnUrl: window.location.origin + '/payport/return',
          method  // PFLICHT-Parameter: 'PHONE' oder 'SMS'
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
      console.error('PayPort checkout error:', error);
      toast({
        title: 'Zahlungsfehler',
        description: error.message || 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
      setShowPaymentModal(false);
      navigate('/mein-profil');
    }
  };

  // Modal öffnen statt Auto-Redirect!
  const handleVerificationComplete = () => {
    toast({
      title: 'Inserat fast fertig!',
      description: 'Bitte wähle eine Zahlungsmethode...',
    });
    setShowPaymentModal(true);
  };

  // Modal öffnen statt Auto-Redirect!
  const handleVerificationSkip = () => {
    toast({
      title: 'Inserat fast fertig!',
      description: 'Bitte wähle eine Zahlungsmethode...',
    });
    setShowPaymentModal(true);
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
                    onBack={() => setCurrentStep('form')}
                  />
                )}
              </TabsContent>

              <TabsContent value="photos" className="mt-6">
                {profileId && (
                  <div className="space-y-6">
                    {/* Zurück zur Paket-Auswahl */}
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep('listing-type')} 
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Paket ändern
                    </Button>

                    <div>
                      <h2 className="text-xl font-semibold mb-2">{photosTitle || 'Fotos hochladen'}</h2>
                      <p className="text-sm text-muted-foreground">
                        {photosSubtitle || 'Lade mindestens 1 Foto hoch. Das erste Foto wird als Hauptfoto verwendet.'}
                      </p>
                    </div>
                    <PhotoUploader 
                      profileId={profileId}
                      userId={user?.id}
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
                  <div className="space-y-6">
                    {/* Zurück zu Fotos Button */}
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep('photos')} 
                      className="gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Zurück zu Fotos
                    </Button>

                    <VerificationUploader
                      profileId={profileId}
                      onComplete={handleVerificationComplete}
                      onSkip={handleVerificationSkip}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Payment Method Modal - PayPort nur hier starten! */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelectMethod={startPaymentCheckoutWithMethod}
        listingType={listingType}
        amount={getAmountForListingType(listingType)}
        onChangePackage={async () => {
          // Auch hier prüfen ob Downgrade erlaubt ist
          const isValid = await validateMediaForNewPackage(listingType);
          if (!isValid) return;
          setShowPaymentModal(false);
          setCurrentStep('listing-type');
        }}
      />
    </>
  );
};

export default ProfileCreate;
