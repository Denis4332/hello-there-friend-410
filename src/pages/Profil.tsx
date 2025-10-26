import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useProfileBySlug } from '@/hooks/useProfiles';
import { useCreateReport } from '@/hooks/useReports';
import { supabase } from '@/integrations/supabase/client';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { SEO } from '@/components/SEO';

const Profil = () => {
  const { slug } = useParams();
  const { data: profile, isLoading } = useProfileBySlug(slug);
  const { data: allCategories = [] } = useCategories();
  const createReport = useCreateReport();
  
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { data: contactButton } = useSiteSetting('profile_contact_button');
  const { data: reportButton } = useSiteSetting('profile_report_button');
  const { data: reportDialogTitle } = useSiteSetting('profile_report_dialog_title');
  
  // Get primary photo
  const primaryPhoto = profile?.photos?.find((p: any) => p.is_primary) || profile?.photos?.[0];
  const photoUrl = primaryPhoto 
    ? supabase.storage.from('profile-photos').getPublicUrl(primaryPhoto.storage_path).data.publicUrl
    : null;
  
  // Get category names
  const categoryNames = profile?.profile_categories
    ?.map((pc: any) => {
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
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Lade Profil...</p>
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
        image={photoUrl || undefined}
        url={`https://escoria.ch/profil/${profile.slug}`}
        type="profile"
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-card border rounded-lg p-6 mb-6">
            <div className="flex items-start gap-6 mb-6">
              {photoUrl ? (
                <img 
                  src={photoUrl} 
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0">
                  {profile.display_name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
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
                <p className="text-lg text-muted-foreground mb-2">
                  {profile.city}, {profile.canton}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="font-bold text-lg mb-2">Über mich</h2>
                <p>{profile.about_me || 'Keine Beschreibung verfügbar'}</p>
              </div>

              {categoryNames.length > 0 && (
                <div>
                  <h2 className="font-bold text-lg mb-2">Leistungen</h2>
                  <div className="flex gap-2 flex-wrap">
                    {categoryNames.map((cat) => (
                      <Badge key={cat} variant="outline">{cat}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {profile.languages && profile.languages.length > 0 && (
                <div>
                  <h2 className="font-bold text-lg mb-2">Sprachen</h2>
                  <div className="flex gap-2">
                    {profile.languages.map((lang) => (
                      <Badge key={lang} variant="secondary">{lang.toUpperCase()}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="font-bold text-lg mb-2">Einsatzgebiet</h2>
                <p>{profile.city} und Umgebung</p>
              </div>

              {profile.verified_at && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Verifiziert:</strong> Identität und Kontaktdaten wurden durch ESCORIA geprüft.
                  </p>
                </div>
              )}

              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
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
                        <option value="fake">Gefälschtes Profil</option>
                        <option value="inappropriate">Unangemessene Inhalte</option>
                        <option value="scam">Betrug</option>
                        <option value="other">Sonstiges</option>
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
