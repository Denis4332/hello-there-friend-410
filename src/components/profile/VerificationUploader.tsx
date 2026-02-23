import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VerificationUploaderProps {
  profileId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const VerificationUploader = ({ profileId, onComplete, onSkip }: VerificationUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check existing verification status
  useEffect(() => {
    const checkExisting = async () => {
      const { data } = await supabase
        .from('verification_submissions')
        .select('status')
        .eq('profile_id', profileId)
        .maybeSingle();

      setExistingStatus(data?.status || null);
      setLoading(false);
    };
    checkExisting();
  }, [profileId]);

  // Already approved - show badge only
  if (!loading && existingStatus === 'approved') {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3 justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium">Verifiziert</p>
              <p className="text-sm text-muted-foreground">Dein Profil ist verifiziert.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Already pending - show info
  if (!loading && existingStatus === 'pending' && !uploaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verifizierung eingereicht
          </CardTitle>
          <CardDescription>
            Dein Verifizierungsfoto wird geprüft. Du kannst ein neues Foto hochladen um das bestehende zu ersetzen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="verification-upload-replace"
          />
          <label htmlFor="verification-upload-replace">
            <Button variant="outline" disabled={uploading} className="w-full" asChild>
              <span>{uploading ? 'Wird hochgeladen...' : 'Neues Foto hochladen (ersetzt bestehendes)'}</span>
            </Button>
          </label>
          <Button className="w-full" onClick={onComplete}>
            Weiter
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      // Delete old storage file if exists
      const { data: oldSub } = await supabase
        .from('verification_submissions')
        .select('storage_path')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (oldSub?.storage_path) {
        await supabase.storage.from('verification-photos').remove([oldSub.storage_path]);
      }

      // Upload new file
      const filePath = `${profileId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('verification-photos')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Upsert verification submission (unique on profile_id)
      const { error: dbError } = await supabase
        .from('verification_submissions')
        .upsert(
          {
            profile_id: profileId,
            storage_path: filePath,
            status: 'pending',
            submitted_at: new Date().toISOString(),
            reviewed_at: null,
            reviewed_by: null,
            admin_note: null,
          },
          { onConflict: 'profile_id' }
        );
      if (dbError) throw dbError;

      setUploaded(true);
      setExistingStatus('pending');
      toast({ title: 'Erfolgreich hochgeladen', description: 'Dein Verifizierungsfoto wurde eingereicht.' });
    } catch (error: any) {
      toast({ title: 'Fehler beim Upload', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  if (loading) return null;

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
              <Button variant="default" disabled={uploading} className="w-full" size="lg" asChild>
                <span>{uploading ? 'Wird hochgeladen...' : 'Verifizierungs-Foto hochladen'}</span>
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
            <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
            <p className="text-sm font-medium">Verifizierungs-Foto erfolgreich hochgeladen!</p>
            <p className="text-xs text-muted-foreground">Dein Foto wird innerhalb von 24h von unserem Team geprüft</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex-1" disabled={uploading} size="lg">Überspringen</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>⚠️ Ohne Verifizierung fortfahren?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>Dein Profil wird <strong>NICHT verifiziert</strong> und hat dadurch:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Deutlich <strong>weniger Sichtbarkeit</strong></li>
                    <li>Kein Verifizierungs-Badge ✓</li>
                    <li>Weniger Vertrauen bei Besuchern</li>
                  </ul>
                  <p className="font-medium pt-2">Bist du sicher?</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen & verifizieren</AlertDialogCancel>
                <AlertDialogAction onClick={onSkip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Ohne Verifizierung fortfahren
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button className="flex-1" onClick={onComplete} disabled={!uploaded} size="lg">
            Inserat zur Prüfung einreichen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
