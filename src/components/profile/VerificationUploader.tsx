import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, CheckCircle2 } from 'lucide-react';

interface VerificationUploaderProps {
  profileId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const VerificationUploader = ({ profileId, onComplete, onSkip }: VerificationUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validierung
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Fehler', description: 'Bitte nur Bilder hochladen.', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Fehler', description: 'Datei zu groß (max. 10MB).', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      // Preview generieren
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload zu Storage
      const filePath = `${profileId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('verification-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Eintrag in DB erstellen
      const { error: dbError } = await supabase
        .from('verification_submissions')
        .insert({
          profile_id: profileId,
          storage_path: filePath,
          status: 'pending'
        });

      if (dbError) throw dbError;

      setUploaded(true);
      toast({ title: 'Erfolgreich hochgeladen', description: 'Dein Verifizierungsfoto wurde eingereicht.' });
    } catch (error: any) {
      toast({ title: 'Fehler beim Upload', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identitäts-Verifizierung (Optional)</CardTitle>
        <CardDescription>
          Erhalte ein verifiziertes Badge, indem du deine Identität bestätigst.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">So funktionierts:</h4>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>Schreibe "ESCORIA" auf ein Blatt Papier</li>
            <li>Halte es neben dein Gesicht</li>
            <li>Mache ein deutliches Selfie</li>
            <li>Lade das Foto hier hoch</li>
          </ol>
        </div>

        {!uploaded ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="verification-upload"
            />
            <label htmlFor="verification-upload">
              <Button variant="outline" disabled={uploading} asChild>
                <span>
                  {uploading ? 'Wird hochgeladen...' : 'Foto auswählen'}
                </span>
              </Button>
            </label>
            {preview && (
              <div className="mt-4">
                <img src={preview} alt="Vorschau" className="max-w-xs mx-auto rounded" />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-success/10 border border-success rounded-lg p-6 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-success" />
            <p className="font-medium">Verifizierung eingereicht!</p>
            <p className="text-sm text-muted-foreground">Wir prüfen dein Foto und verifizieren dein Profil.</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSkip}
            disabled={uploading}
          >
            {uploaded ? 'Weiter' : 'Überspringen'}
          </Button>
          {uploaded && (
            <Button
              className="flex-1"
              onClick={onComplete}
            >
              Fertig
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
