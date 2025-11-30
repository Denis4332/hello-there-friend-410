import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useState, useEffect } from 'react';
import { useProfileBySlug } from '@/hooks/useProfiles';
import { useProfileContacts } from '@/hooks/useProfileContacts';
import { useCreateReport } from '@/hooks/useReports';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';
import { SEO } from '@/components/SEO';
import { ContactSection } from '@/components/profile/ContactSection';
import { ProfileDetailSkeleton } from '@/components/ProfileDetailSkeleton';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { ProfileSchema } from '@/components/seo/ProfileSchema';
import { useAnalytics } from '@/hooks/useAnalytics';

const Profil = () => {
  const { slug } = useParams();
  const { data: profile, isLoading } = useProfileBySlug(slug);
  // SECURITY: Contact data is fetched separately with RLS protection
  const { data: contacts } = useProfileContacts(profile?.id);
  const { data: allCategories = [] } = useCategories();
  const { data: reportReasons = [] } = useDropdownOptions('report_reasons');
  const createReport = useCreateReport();
  const { trackProfileView } = useAnalytics();
  
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Track profile view
  useEffect(() => {
    if (profile?.id) {
      trackProfileView(profile.id);
    }
  }, [profile?.id, trackProfileView]);

  const { data: contactButton } = useSiteSetting('profile_contact_button');
  const { data: reportButton } = useSiteSetting('profile_report_button');
  const { data: reportDialogTitle } = useSiteSetting('profile_report_dialog_title');
  
  // Get all photos and videos with media type
  const photos = profile?.photos || [];
  const mediaItems = photos.map((p) => ({
    url: supabase.storage.from('profile-photos').getPublicUrl(p.storage_path).data.publicUrl,
    mediaType: (p as any).media_type || 'image',
    isVideo: (p as any).media_type === 'video',
  }));
  const photoUrls = mediaItems.map(m => m.url);
  
  // Get category names
  const categoryNames = profile?.profile_categories
    ?.map((pc) => {
      const cat = allCategories.find((c) => c.id === pc.category_id);
      return cat?.name;
    })
    .filter(Boolean) || [];
  
  const handleReportSubmit = async () => {
    if (!profile?.id || !reportReason) return;
    
    await createReport.mutateAsync({
      profileId: profile.id,
      reason: reportReason,
      message: reportMessage,
    });
    
    setReportDialogOpen(false);
    setReportReason('');
    setReportMessage('');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-6xl">
            <ProfileDetailSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profil nicht gefunden</h1>
            <Link to="/">
              <Button>Zurück zur Startseite</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={`${profile.display_name}, ${profile.age} aus ${profile.city}`}
        description={profile.about_me?.slice(0, 160) || `${profile.display_name}, ${profile.age} Jahre, aus ${profile.city}, ${profile.canton}`}
        image={photoUrls[0] || undefined}
        imageAlt={`Foto von ${profile.display_name}`}
        url={`https://escoria.ch/profil/${profile.slug}`}
        type="profile"
        schemaType="Person"
      />
      <ProfileSchema profile={profile} />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Breadcrumbs 
            items={[
              { label: 'Profile', href: '/suche' },
              { label: profile.city || '', href: `/stadt/${profile.city?.toLowerCase()}` },
              { label: profile.display_name }
            ]}
          />
          {/* 2-Column Layout: Photos left, Info right */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Photo Gallery - Left Column (60%) */}
            <div className="lg:col-span-3">
              {photoUrls.length > 0 ? (
                <div className="bg-card border rounded-lg overflow-hidden">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {mediaItems.map((item, index: number) => (
                        <CarouselItem key={index}>
                          <div className="relative aspect-[3/4]">
                            {item.isVideo ? (
                              <video
                                src={item.url}
                                className="w-full h-full object-cover"
                                controls
                                preload="metadata"
                                playsInline
                              >
                                Dein Browser unterstützt keine Videos.
                              </video>
                            ) : (
                              <img
                                src={item.url}
                                alt={`${profile.display_name} - Foto ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            )}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {photoUrls.length > 1 && (
                      <>
                        <CarouselPrevious className="left-4" />
                        <CarouselNext className="right-4" />
                      </>
                    )}
                  </Carousel>
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Foto {photoUrls.length > 1 ? `1-${photoUrls.length}` : '1'}
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg aspect-[3/4] flex items-center justify-center">
                  <span className="text-9xl font-bold text-muted-foreground">
                    {profile.display_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info - Right Column (40%) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold">{profile.display_name}, {profile.age}</h1>
                  {profile.verified_at && (
                    <Badge className="bg-success text-success-foreground">
                      Verifiziert
                    </Badge>
                  )}
                  {profile.is_premium && (
                    <Badge className="bg-primary text-primary-foreground">
                      VIP
                    </Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground">
                  📍 {contacts?.show_street && contacts?.street_address 
                    ? `${contacts.street_address}, ${profile.city}, ${profile.canton}` 
                    : `${profile.city}, ${profile.canton}`}
                </p>
                {contacts && !contacts.show_street && contacts.street_address && (
                  <p className="text-xs text-muted-foreground mt-1">
                    🔒 Exakte Adresse nur nach Kontaktaufnahme
                  </p>
                )}
              </div>

              {/* About Me */}
              <div className="bg-card border rounded-lg p-6">
                <h2 className="font-bold text-lg mb-3">Über mich</h2>
                <p className="text-foreground/90">{profile.about_me || 'Keine Beschreibung verfügbar'}</p>
              </div>

              {/* Categories */}
              {categoryNames.length > 0 && (
                <div className="bg-card border rounded-lg p-6">
                  <h2 className="font-bold text-lg mb-3">Leistungen</h2>
                  <div className="flex gap-2 flex-wrap">
                    {categoryNames.map((cat) => (
                      <Badge key={cat} variant="outline">{cat}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {profile.languages && profile.languages.length > 0 && (
                <div className="bg-card border rounded-lg p-6">
                  <h2 className="font-bold text-lg mb-3">Sprachen</h2>
                  <div className="flex gap-2 flex-wrap">
                    {profile.languages.map((lang) => (
                      <Badge key={lang} variant="secondary">{lang.toUpperCase()}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Area */}
              <div className="bg-card border rounded-lg p-6">
                <h2 className="font-bold text-lg mb-3">Einsatzgebiet</h2>
                <p>{profile.city} und Umgebung</p>
              </div>

              {/* Verification Badge */}
              {profile.verified_at && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Verifiziert:</strong> Identität und Kontaktdaten wurden durch ESCORIA geprüft.
                  </p>
                </div>
              )}

              {/* Contact Section - SECURITY: Only shows if user has access */}
              <ContactSection
                phone={contacts?.phone}
                whatsapp={contacts?.whatsapp}
                email={contacts?.email}
                website={contacts?.website}
                telegram={contacts?.telegram}
                instagram={contacts?.instagram}
                profileId={profile.id}
              />

              {/* Report Button */}
              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full">
                    {reportButton || 'Melden'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{reportDialogTitle || 'Profil melden'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Grund</label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Bitte wählen</option>
                        {reportReasons.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Nachricht</label>
                      <Textarea
                        value={reportMessage}
                        onChange={(e) => setReportMessage(e.target.value)}
                        placeholder="Bitte beschreiben Sie das Problem..."
                        rows={4}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleReportSubmit}
                      disabled={!reportReason || createReport.isPending}
                    >
                      {createReport.isPending ? 'Wird gesendet...' : 'Meldung absenden'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profil;
