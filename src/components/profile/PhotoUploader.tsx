import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useToastMessages } from '@/hooks/useToastMessages';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  profileId: string;
  onUploadComplete?: () => void;
}

interface PhotoPreview {
  url: string;
  file?: File;
  uploaded: boolean;
}

export const PhotoUploader = ({ profileId, onUploadComplete }: PhotoUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<PhotoPreview[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const { showSuccess, showError, showCustomError } = useToastMessages();
  
  const { data: maxFileSize } = useSiteSetting('upload_max_file_size_mb');
  const { data: maxPhotos } = useSiteSetting('upload_max_photos_per_profile');
  const { data: allowedFormats } = useSiteSetting('upload_allowed_formats');

  const maxSizeMB = parseInt(maxFileSize || '5');
  const maxPhotosCount = parseInt(maxPhotos || '5');
  const allowedFormatsList = allowedFormats?.split(',') || ['image/jpeg', 'image/png', 'image/webp'];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validation
    if (previews.length + files.length > maxPhotosCount) {
      showCustomError(`Maximal ${maxPhotosCount} Fotos erlaubt`);
      return;
    }

    // Validate each file before adding to previews
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        showCustomError(`${file.name} ist zu groß (max. ${maxSizeMB}MB)`);
        continue;
      }
      if (!allowedFormatsList.includes(file.type)) {
        showCustomError(`${file.name} ist kein erlaubtes Bildformat`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create local previews with file reference
    const newPreviews: PhotoPreview[] = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      file,
      uploaded: false,
    }));
    
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleUpload = async () => {
    const filesToUpload = previews.filter(p => !p.uploaded && p.file);
    if (filesToUpload.length === 0) return;

    setUploading(true);

    try {
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Nicht authentifiziert');
      }

      // Check existing photos in database for is_primary logic
      const { data: existingPhotos } = await supabase
        .from('photos')
        .select('id')
        .eq('profile_id', profileId);

      const existingPhotosCount = existingPhotos?.length || 0;

      const uploadPromises = filesToUpload.map(async (preview, uploadIndex) => {
        const file = preview.file!;
        const previewIndex = previews.findIndex(p => p.url === preview.url);

        // Generate cryptographically random filename
        const fileExt = file.name.split('.').pop();
        const randomBytes = new Uint8Array(16);
        crypto.getRandomValues(randomBytes);
        const randomName = Array.from(randomBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const fileName = `${randomName}.${fileExt}`;

        // Upload via edge function for server-side validation
        const formData = new FormData();
        formData.append('file', file);
        formData.append('profileId', profileId);
        formData.append('fileName', fileName);

        const { data, error } = await supabase.functions.invoke('validate-image', {
          body: formData,
        });

        if (error) {
          throw new Error(error.message || 'Upload fehlgeschlagen');
        }

        if (!data.success) {
          throw new Error(data.error || 'Validierung fehlgeschlagen');
        }

        // Determine if this should be primary based on user selection
        // If no existing photos: the selected primaryIndex becomes primary
        // If existing photos exist: none of the new uploads are primary
        const shouldBePrimary = existingPhotosCount === 0 && previewIndex === primaryIndex;

        // Insert photo record into database
        const { error: dbError } = await supabase.from('photos').insert({
          profile_id: profileId,
          storage_path: data.path,
          is_primary: shouldBePrimary,
        });

        if (dbError) throw dbError;

        return { previewUrl: preview.url, uploadedUrl: data.url };
      });

      const results = await Promise.all(uploadPromises);
      
      // Update previews to mark as uploaded
      setPreviews(prev => prev.map(p => {
        const result = results.find(r => r.previewUrl === p.url);
        if (result) {
          return { ...p, url: result.uploadedUrl, uploaded: true, file: undefined };
        }
        return p;
      }));

      showSuccess('toast_photo_uploaded');
      onUploadComplete?.();
    } catch (error: any) {
      showError('toast_photo_error', error.message || 'Fehler beim Hochladen der Fotos');
    } finally {
      setUploading(false);
    }
  };

  const removePreview = (index: number) => {
    setPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Adjust primaryIndex if needed
      if (primaryIndex >= newPreviews.length) {
        setPrimaryIndex(Math.max(0, newPreviews.length - 1));
      } else if (index < primaryIndex) {
        setPrimaryIndex(primaryIndex - 1);
      }
      return newPreviews;
    });
  };

  const setPrimary = (index: number) => {
    setPrimaryIndex(index);
  };

  const hasUnuploadedFiles = previews.some(p => !p.uploaded && p.file);

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
              {uploading ? 'Wird hochgeladen...' : 'Klicken zum Auswählen'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max. {maxPhotosCount} Fotos, je max. {maxSizeMB}MB
            </p>
          </div>
          <input
            id="photo-upload"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading || previews.length >= maxPhotosCount}
          />
        </label>
      </div>

      {previews.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                
                {/* Star icon for primary selection */}
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  className={cn(
                    "absolute top-2 left-2 p-1.5 rounded-full transition-all",
                    index === primaryIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-black/50 text-white/70 hover:text-yellow-400"
                  )}
                  title={index === primaryIndex ? "Hauptfoto" : "Als Hauptfoto setzen"}
                >
                  <Star 
                    className={cn(
                      "w-4 h-4",
                      index === primaryIndex && "fill-current"
                    )} 
                  />
                </button>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removePreview(index)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Primary badge */}
                {index === primaryIndex && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                    Hauptfoto
                  </div>
                )}

                {/* Upload status indicator */}
                {preview.uploaded && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upload button */}
          {hasUnuploadedFiles && (
            <Button 
              onClick={handleUpload} 
              disabled={uploading}
              className="w-full"
            >
              {uploading ? 'Wird hochgeladen...' : `${previews.filter(p => !p.uploaded).length} Foto(s) hochladen`}
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            ⭐ Klicke auf den Stern, um das Hauptfoto zu wählen
          </p>
        </>
      )}

      {previews.length === 0 && (
        <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Noch keine Fotos ausgewählt
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
