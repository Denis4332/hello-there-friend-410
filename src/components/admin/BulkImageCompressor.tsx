import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ImageDown } from 'lucide-react';
import { compressImageBlob } from '@/utils/imageCompression';
interface CompressionStats {
  total: number;
  processed: number;
  skipped: number;
  compressed: number;
  errors: number;
  savedBytes: number;
}

export const BulkImageCompressor = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [currentImage, setCurrentImage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const runBulkCompression = async () => {
    setIsRunning(true);
    const newStats: CompressionStats = {
      total: 0,
      processed: 0,
      skipped: 0,
      compressed: 0,
      errors: 0,
      savedBytes: 0
    };
    setStats(newStats);

    try {
      // Fetch all photos (images only, not videos)
      const { data: photos, error } = await supabase
        .from('photos')
        .select('id, storage_path, media_type, profile_id')
        .or('media_type.eq.image,media_type.is.null');

      if (error) throw error;
      if (!photos || photos.length === 0) {
        toast({ title: 'Keine Bilder gefunden' });
        setIsRunning(false);
        return;
      }

      newStats.total = photos.length;
      setStats({ ...newStats });

      for (const photo of photos) {
        try {
          setCurrentImage(photo.storage_path);
          
          // Download image
          const { data: downloadData, error: downloadError } = await supabase
            .storage
            .from('profile-photos')
            .download(photo.storage_path);

          if (downloadError || !downloadData) {
            console.error('Download error:', downloadError);
            newStats.errors++;
            newStats.processed++;
            setStats({ ...newStats });
            continue;
          }

          const originalSize = downloadData.size;

          // Skip if already small (< 500KB)
          if (originalSize < 500 * 1024) {
            newStats.skipped++;
            newStats.processed++;
            setStats({ ...newStats });
            continue;
          }

          // Compress image
          const compressedBlob = await compressImageBlob(downloadData);
          const compressedSize = compressedBlob.size;

          // Skip if compression didn't help (new file is bigger or similar)
          if (compressedSize >= originalSize * 0.9) {
            newStats.skipped++;
            newStats.processed++;
            setStats({ ...newStats });
            continue;
          }

          // Generate new storage path (add -compressed suffix before extension)
          const newPath = photo.storage_path.replace(/\.[^.]+$/, '') + '-compressed-' + Date.now() + '.jpg';

          // Upload compressed image
          const { error: uploadError } = await supabase
            .storage
            .from('profile-photos')
            .upload(newPath, compressedBlob, {
              contentType: 'image/jpeg',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            newStats.errors++;
            newStats.processed++;
            setStats({ ...newStats });
            continue;
          }

          // Update database record with new path
          const { error: updateError } = await supabase
            .from('photos')
            .update({ storage_path: newPath, media_type: 'image' })
            .eq('id', photo.id);

          if (updateError) {
            console.error('DB update error:', updateError);
            // Try to delete the uploaded file since DB update failed
            await supabase.storage.from('profile-photos').remove([newPath]);
            newStats.errors++;
            newStats.processed++;
            setStats({ ...newStats });
            continue;
          }

          // Delete old file
          await supabase.storage.from('profile-photos').remove([photo.storage_path]);

          newStats.compressed++;
          newStats.savedBytes += (originalSize - compressedSize);
          newStats.processed++;
          setStats({ ...newStats });

        } catch (imgError) {
          console.error('Image processing error:', imgError);
          newStats.errors++;
          newStats.processed++;
          setStats({ ...newStats });
        }
      }

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      
      toast({
        title: '✅ Bulk-Komprimierung abgeschlossen',
        description: `${newStats.compressed} Bilder komprimiert, ${formatBytes(newStats.savedBytes)} gespart`
      });

    } catch (error: any) {
      console.error('Bulk compression error:', error);
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
      setCurrentImage('');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const progress = stats ? (stats.processed / stats.total) * 100 : 0;

  return (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <ImageDown className="h-5 w-5" />
            Bulk Bilder-Komprimierung
          </h3>
          <p className="text-sm text-muted-foreground">
            Komprimiert alle bestehenden Profilbilder (&gt;500KB) auf max. 1200x1600px, 80% JPEG
          </p>
        </div>
        <Button 
          onClick={runBulkCompression} 
          disabled={isRunning}
          variant="outline"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Läuft...
            </>
          ) : (
            '🔄 Alle Bilder komprimieren'
          )}
        </Button>
      </div>

      {isRunning && stats && (
        <div className="space-y-2 mt-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Fortschritt: {stats.processed}/{stats.total}</span>
            <span>Komprimiert: {stats.compressed} | Übersprungen: {stats.skipped} | Fehler: {stats.errors}</span>
          </div>
          {currentImage && (
            <p className="text-xs text-muted-foreground truncate">
              Aktuell: {currentImage}
            </p>
          )}
          {stats.savedBytes > 0 && (
            <p className="text-sm text-green-600">
              💾 Bisher gespart: {formatBytes(stats.savedBytes)}
            </p>
          )}
        </div>
      )}

      {!isRunning && stats && stats.processed > 0 && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="font-medium">Ergebnis:</p>
          <ul className="text-sm text-muted-foreground mt-1">
            <li>✅ Komprimiert: {stats.compressed} Bilder</li>
            <li>⏭️ Übersprungen: {stats.skipped} (bereits klein)</li>
            <li>❌ Fehler: {stats.errors}</li>
            <li>💾 Gespart: {formatBytes(stats.savedBytes)}</li>
          </ul>
        </div>
      )}
    </div>
  );
};
