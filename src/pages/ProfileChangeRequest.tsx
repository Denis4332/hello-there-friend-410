import { useState, useEffect, useRef } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, Send, CheckCircle, Clock, XCircle, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { compressImage } from '@/utils/imageCompression';

const REQUEST_TYPES = [
  { value: 'text', label: 'Texte ändern (Name, Beschreibung, etc.)' },
  { value: 'photos', label: 'Fotos ändern (hinzufügen, löschen, ersetzen)' },
  { value: 'contact', label: 'Kontaktdaten ändern (Telefon, E-Mail, etc.)' },
  { value: 'categories', label: 'Kategorien ändern' },
  { value: 'other', label: 'Sonstiges' },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [profile, setProfile] = useState<{ id: string; status: string } | null>(null);
  const [requestType, setRequestType] = useState('');
  const [description, setDescription] = useState('');
  const [existingRequests, setExistingRequests] = useState<ChangeRequest[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Warn user before leaving if they have unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading || selectedFiles.length > 0) {
        e.preventDefault();
        e.returnValue = 'Du hast ungesendete Änderungen. Wirklich verlassen?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUploading, selectedFiles]);

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
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

      if (profileData.status !== 'active') {
        navigate('/profil/bearbeiten');
        return;
      }

      setProfile(profileData);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_FILES - selectedFiles.length;
    if (files.length > remainingSlots) {
      toast({
        title: 'Zu viele Bilder',
        description: `Du kannst maximal ${MAX_FILES} Bilder hochladen.`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({
          title: 'Ungültiger Dateityp',
          description: `${file.name} ist kein gültiges Bildformat. Erlaubt: JPEG, PNG, WebP`,
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Datei zu gross',
          description: `${file.name} ist grösser als 5MB.`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setFilePreviews(prev => [...prev, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
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
    const uploadedPaths: string[] = [];

    try {
      // 1. Upload images if present (for photo requests)
      if (selectedFiles.length > 0 && requestType === 'photos') {
        setIsUploading(true);
        setUploadProgress({ current: 0, total: selectedFiles.length });

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          
          // Compress image before upload
          const compressedFile = await compressImage(file);
          const extension = compressedFile.name.split('.').pop() || 'webp';
          const path = `${profile.id}/${crypto.randomUUID()}.${extension}`;
          
          const { error: uploadError } = await supabase.storage
            .from('change-request-media')
            .upload(path, compressedFile);

          if (uploadError) throw uploadError;
          uploadedPaths.push(path);
          setUploadProgress({ current: i + 1, total: selectedFiles.length });
        }
        setIsUploading(false);
      }

      // 2. Create the change request
      const { data: request, error: requestError } = await supabase
        .from('profile_change_requests')
        .insert({
          profile_id: profile.id,
          user_id: user.id,
          request_type: requestType,
          description: description.trim(),
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // 3. Create media entries if we uploaded files
      if (uploadedPaths.length > 0) {
        const mediaInserts = uploadedPaths.map(path => ({
          request_id: request.id,
          storage_path: path,
        }));

        const { error: mediaError } = await supabase
          .from('change_request_media')
          .insert(mediaInserts);

        if (mediaError) throw mediaError;
      }

      toast({
        title: 'Anfrage gesendet',
        description: 'Deine Änderungsanfrage wurde eingereicht und wird in Kürze bearbeitet.',
      });

      // Reset form
      setRequestType('');
      setDescription('');
      setSelectedFiles([]);
      filePreviews.forEach(url => URL.revokeObjectURL(url));
      setFilePreviews([]);
      loadData();

    } catch (error) {
      // CLEANUP: Delete already uploaded files on error
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from('change-request-media')
          .remove(uploadedPaths);
      }

      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
      setIsUploading(false);
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

                  {/* Image upload section - only shown for photo requests */}
                  {requestType === 'photos' && (
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Neue Bilder hochladen (optional)
                      </Label>
                      
                      <div 
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Klicke hier um Bilder auszuwählen
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Max. {MAX_FILES} Bilder, je max. 5MB (JPEG, PNG, WebP)
                        </p>
                      </div>

                      {/* File previews */}
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            {selectedFiles.length} Bild{selectedFiles.length > 1 ? 'er' : ''} ausgewählt:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {filePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={preview}
                                  alt={`Vorschau ${index + 1}`}
                                  className="h-20 w-20 object-cover rounded-lg border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload progress */}
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Lade Bilder hoch...</span>
                            <span>{uploadProgress.current} / {uploadProgress.total}</span>
                          </div>
                          <Progress 
                            value={(uploadProgress.current / uploadProgress.total) * 100} 
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={submitting || isUploading || !requestType || !description.trim()}
                  >
                    {submitting || isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? 'Bilder werden hochgeladen...' : 'Anfrage senden'}
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
                          <div className="bg-muted/50 rounded p-3 text-sm">
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

