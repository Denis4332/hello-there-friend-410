import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploaderProps {
  profileId: string;
  onUploadComplete?: () => void;
}

export const PhotoUploader = ({ profileId, onUploadComplete }: PhotoUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validation
    if (previews.length + files.length > 5) {
      toast({
        title: 'Zu viele Fotos',
        description: 'Maximal 5 Fotos erlaubt',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} ist zu groß (max. 5MB)`);
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} ist kein Bild`);
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${profileId}/${Date.now()}-${index}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Insert photo record into database
        const { error: dbError } = await supabase.from('photos').insert({
          profile_id: profileId,
          storage_path: fileName,
          is_primary: previews.length === 0 && index === 0, // First photo is primary
        });

        if (dbError) throw dbError;

        // Get public URL for preview
        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        return urlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setPreviews([...previews, ...urls]);

      toast({
        title: 'Fotos hochgeladen',
        description: `${files.length} Foto(s) erfolgreich hochgeladen`,
      });

      onUploadComplete?.();
    } catch (error: any) {
      toast({
        title: 'Upload fehlgeschlagen',
        description: error.message || 'Fehler beim Hochladen der Fotos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removePreview = (index: number) => {
    setPreviews(previews.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="photo-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {uploading ? 'Wird hochgeladen...' : 'Klicken zum Hochladen'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max. 5 Fotos, je max. 5MB
            </p>
          </div>
          <input
            id="photo-upload"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading || previews.length >= 5}
          />
        </label>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removePreview(index)}
                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                  Hauptfoto
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {previews.length === 0 && (
        <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Noch keine Fotos hochgeladen
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
