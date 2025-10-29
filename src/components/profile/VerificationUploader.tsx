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
        <CardTitle>Identität verifizieren (Optional)</CardTitle>
        <CardDescription>
          Verifizierte Profile werden mit einem Badge gekennzeichnet und haben höhere Sichtbarkeit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!uploaded ? (
          <>
            <div className="bg-muted/50 border-2 border-dashed rounded-lg p-6 text-center space-y-3">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">So funktioniert's:</p>
                <ol className="text-left list-decimal list-inside space-y-1">
                  <li>Nimm ein Blatt Papier und schreibe <strong>"ESCORIA"</strong> darauf</li>
                  <li>Halte das Blatt neben dein Gesicht</li>
                  <li>Mache ein Selfie von dir mit dem Blatt</li>
                  <li>Lade das Foto hoch</li>
                </ol>
                <p className="text-xs italic mt-3">
                  ⚠️ Dieses Foto wird NICHT öffentlich angezeigt - nur zur Verifizierung
                </p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="verification-upload"
            />
            <label htmlFor="verification-upload">
              <Button
                variant="default"
                disabled={uploading}
                className="w-full"
                size="lg"
                asChild
              >
                <span>
                  {uploading ? 'Wird hochgeladen...' : 'Verifizierungs-Foto hochladen'}
                </span>
              </Button>
            </label>
            {preview && (
              <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden border">
                <img src={preview} alt="Preview" className="object-cover w-full h-full" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <p className="text-sm font-medium">Verifizierungs-Foto erfolgreich hochgeladen!</p>
            <p className="text-xs text-muted-foreground">
              Dein Foto wird innerhalb von 24h von unserem Team geprüft
            </p>
          </div>
        )}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSkip}
            disabled={uploading}
            size="lg"
          >
            {uploaded ? 'Ohne Verifizierung fortfahren' : 'Überspringen'}
          </Button>
          <Button
            className="flex-1"
            onClick={onComplete}
            disabled={!uploaded}
            size="lg"
          >
            Inserat zur Prüfung einreichen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
