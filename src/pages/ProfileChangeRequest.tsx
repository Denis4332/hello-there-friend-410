import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const REQUEST_TYPES = [
  { value: 'text', label: 'Texte ändern (Name, Beschreibung, etc.)' },
  { value: 'photos', label: 'Fotos ändern (hinzufügen, löschen, ersetzen)' },
  { value: 'contact', label: 'Kontaktdaten ändern (Telefon, E-Mail, etc.)' },
  { value: 'categories', label: 'Kategorien ändern' },
  { value: 'other', label: 'Sonstiges' },
];

interface ChangeRequest {
  id: string;
  request_type: string;
  description: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

const ProfileChangeRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<{ id: string; status: string } | null>(null);
  const [requestType, setRequestType] = useState('');
  const [description, setDescription] = useState('');
  const [existingRequests, setExistingRequests] = useState<ChangeRequest[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        navigate('/profil/erstellen');
        return;
      }

      // If profile is not active, redirect to edit page
      if (profileData.status !== 'active') {
        navigate('/profil/bearbeiten');
        return;
      }

      setProfile(profileData);

      // Load existing change requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('profile_change_requests')
        .select('*')
        .eq('profile_id', profileData.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setExistingRequests((requestsData as ChangeRequest[]) || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !user || !requestType || !description.trim()) {
      toast({
        title: 'Bitte alle Felder ausfüllen',
        description: 'Wähle die Art der Änderung und beschreibe, was geändert werden soll.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profile_change_requests')
        .insert({
          profile_id: profile.id,
          user_id: user.id,
          request_type: requestType,
          description: description.trim(),
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Anfrage gesendet',
        description: 'Deine Änderungsanfrage wurde eingereicht und wird in Kürze bearbeitet.',
      });

      // Reset form and reload requests
      setRequestType('');
      setDescription('');
      loadData();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            In Bearbeitung
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-600 gap-1">
            <CheckCircle className="h-3 w-3" />
            Genehmigt
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Abgelehnt
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    return REQUEST_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <>
        <SEO title="Änderung anfragen" description="Fordere eine Änderung deines Profils an" />
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Änderung anfragen" description="Fordere eine Änderung deines Profils an" />
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/mein-profil">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zum Dashboard
              </Link>
            </Button>

            <h1 className="text-3xl font-bold mb-2">Änderung anfragen</h1>
            <p className="text-muted-foreground mb-8">
              Dein Profil ist aktiv. Änderungen müssen zur Prüfung eingereicht werden, um die Einhaltung unserer AGB sicherzustellen.
            </p>

            {/* New Request Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Neue Änderungsanfrage</CardTitle>
                <CardDescription>
                  Beschreibe, welche Änderungen du an deinem Profil vornehmen möchtest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="request_type">Art der Änderung *</Label>
                    <Select value={requestType} onValueChange={setRequestType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Was möchtest du ändern?" />
                      </SelectTrigger>
                      <SelectContent>
                        {REQUEST_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung *</Label>
                    <Textarea
                      id="description"
                      placeholder="Beschreibe genau, was geändert werden soll. Bei Fotos: Welche sollen gelöscht/hinzugefügt werden? Bei Texten: Was ist der neue Text?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Je genauer die Beschreibung, desto schneller können wir die Änderung umsetzen.
                    </p>
                  </div>

                  <Button type="submit" disabled={submitting || !requestType || !description.trim()}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Anfrage senden
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Existing Requests */}
            {existingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Deine Anfragen</CardTitle>
                  <CardDescription>
                    Übersicht deiner bisherigen Änderungsanfragen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {existingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {getRequestTypeLabel(request.request_type)}
                          </span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.description}
                        </p>
                        {request.admin_note && (
                          <div className="bg-muted/50 rounded p-2 text-sm">
                            <span className="font-medium">Admin-Antwort:</span>{' '}
                            {request.admin_note}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Eingereicht am{' '}
                          {new Date(request.created_at).toLocaleDateString('de-CH', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileChangeRequest;

