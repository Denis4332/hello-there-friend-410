import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { mockProfiles } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

const Profil = () => {
  const { slug } = useParams();
  const profile = mockProfiles.find((p) => p.slug === slug);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');

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
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-card border rounded-lg p-6 mb-6">
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0">
                {profile.display_name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold">{profile.display_name}, {profile.age}</h1>
                  {profile.verified && (
                    <Badge className="bg-success text-success-foreground">
                      Verifiziert
                    </Badge>
                  )}
                  {profile.vip && (
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
                <p>{profile.short_bio}</p>
              </div>

              <div>
                <h2 className="font-bold text-lg mb-2">Leistungen</h2>
                <div className="flex gap-2 flex-wrap">
                  {profile.categories.map((cat) => (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-bold text-lg mb-2">Sprachen</h2>
                <div className="flex gap-2">
                  {profile.languages.map((lang) => (
                    <Badge key={lang} variant="secondary">{lang.toUpperCase()}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-bold text-lg mb-2">Einsatzgebiet</h2>
                <p>{profile.city} und Umgebung</p>
              </div>

              {profile.verified && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Verifiziert:</strong> Identität und Kontaktdaten wurden durch ESCORIA geprüft.
                  </p>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {profile.contact_whatsapp && (
                  <Button className="flex-1">
                    Nachricht per WhatsApp
                  </Button>
                )}
                {profile.contact_phone && (
                  <Button variant="outline" className="flex-1">
                    Anrufen
                  </Button>
                )}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Profil melden
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Profil melden</DialogTitle>
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
                    <Button className="w-full">Meldung absenden</Button>
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
