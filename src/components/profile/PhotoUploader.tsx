import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Star, Video, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToastMessages } from '@/hooks/useToastMessages';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  profileId: string;
  listingType?: 'basic' | 'premium' | 'top';
  onUploadComplete?: () => void;
}

interface MediaPreview {
  url: string;
  file?: File;
  uploaded: boolean;
  mediaType: 'image' | 'video';
}

// Tiered limits based on listing type
const MEDIA_LIMITS = {
  basic: { photos: 5, videos: 0 },
  premium: { photos: 10, videos: 1 },
  top: { photos: 15, videos: 2 },
};

const MAX_PHOTO_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 50;
const ALLOWED_PHOTO_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_FORMATS = ['video/mp4', 'video/webm'];

export const PhotoUploader = ({ profileId, listingType = 'basic', onUploadComplete }: PhotoUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const { showSuccess, showError, showCustomError } = useToastMessages();
  
  const limits = MEDIA_LIMITS[listingType];
  const photoCount = previews.filter(p => p.mediaType === 'image').length;
  const videoCount = previews.filter(p => p.mediaType === 'video').length;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxSize = type === 'image' ? MAX_PHOTO_SIZE_MB : MAX_VIDEO_SIZE_MB;
    const allowedFormats = type === 'image' ? ALLOWED_PHOTO_FORMATS : ALLOWED_VIDEO_FORMATS;
    const currentCount = type === 'image' ? photoCount : videoCount;
    const maxCount = type === 'image' ? limits.photos : limits.videos;

    // Check count limit
    if (currentCount + files.length > maxCount) {
      showCustomError(`Maximal ${maxCount} ${type === 'image' ? 'Fotos' : 'Videos'} erlaubt (${listingType.toUpperCase()})`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > maxSize * 1024 * 1024) {
        showCustomError(`${file.name} ist zu groß (max. ${maxSize}MB). ${type === 'image' ? 'Tipp: Verkleinere das Bild mit einem Online-Tool wie tinypng.com' : ''}`);
        continue;
      }
      if (!allowedFormats.includes(file.type)) {
        showCustomError(`${file.name} ist kein erlaubtes ${type === 'image' ? 'Bildformat (JPEG, PNG, WebP)' : 'Videoformat (MP4, WebM)'}`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Create local previews
    const newPreviews: MediaPreview[] = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      file,
      uploaded: false,
      mediaType: type,
    }));
    
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleUpload = async () => {
    const filesToUpload = previews.filter(p => !p.uploaded && p.file);
    if (filesToUpload.length === 0) return;

    setUploading(true);

    try {
      // 1. Auth-Check mit getUser() (zuverlässiger als getSession)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Auth error or no user:', authError);
        showCustomError('Bitte melde dich erneut an.');
        setUploading(false);
        return;
      }

      // 2. PRE-UPLOAD VALIDATION: Profil mit BEIDEN Bedingungen prüfen
      //    Das garantiert RLS-Kompatibilität bei allen Status (draft, pending, active)
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id, status')
        .eq('id', profileId)
        .eq('user_id', user.id)  // ← KRITISCH: RLS-konform!
        .maybeSingle();

      if (profileError) {
        console.error('❌ Profile check error:', profileError);
        showCustomError('Datenbankfehler. Bitte versuche es später erneut.');
        setUploading(false);
        return;
      }

      if (!profileCheck) {
        console.error('❌ Profile not found or not owned by user:', profileId, user.id);
        showCustomError('Profil nicht gefunden. Du wirst zur Profil-Erstellung weitergeleitet...');
        setTimeout(() => {
          window.location.href = '/profil/erstellen';
        }, 2000);
        setUploading(false);
        return;
      }

      // Check existing media in database
      const { data: existingPhotos } = await supabase
        .from('photos')
        .select('id, media_type')
        .eq('profile_id', profileId);

      const existingImagesCount = existingPhotos?.filter(p => p.media_type === 'image' || !p.media_type).length || 0;

      const uploadPromises = filesToUpload.map(async (preview) => {
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

        // Determine if this should be primary (only for images)
        const shouldBePrimary = preview.mediaType === 'image' && existingImagesCount === 0 && previewIndex === primaryIndex;

        // Insert photo record into database
        const { error: dbError } = await supabase.from('photos').insert({
          profile_id: profileId,
          storage_path: data.path,
          is_primary: shouldBePrimary,
          media_type: data.media_type || preview.mediaType,
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

      // Check if this was the first photo - update profile status from draft to pending
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', profileId)
        .maybeSingle();
      
      if (currentProfile?.status === 'draft') {
        await supabase
          .from('profiles')
          .update({ status: 'pending' })
          .eq('id', profileId);
        console.log('✅ Profile status updated from draft to pending');
      }

      showSuccess('toast_photo_uploaded');
      onUploadComplete?.();
    } catch (error: any) {
      showError('toast_photo_error', error.message || 'Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const removePreview = (index: number) => {
    setPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Adjust primaryIndex if needed (only for images)
      const imageIndices = newPreviews.map((p, i) => p.mediaType === 'image' ? i : -1).filter(i => i >= 0);
      if (primaryIndex >= newPreviews.length || newPreviews[primaryIndex]?.mediaType !== 'image') {
        setPrimaryIndex(imageIndices[0] ?? 0);
      } else if (index < primaryIndex) {
        setPrimaryIndex(primaryIndex - 1);
      }
      return newPreviews;
    });
  };

  const setPrimary = (index: number) => {
    if (previews[index]?.mediaType === 'image') {
      setPrimaryIndex(index);
    }
  };

  const hasUnuploadedFiles = previews.some(p => !p.uploaded && p.file);
  const imagePreviews = previews.filter(p => p.mediaType === 'image');
  const videoPreviews = previews.filter(p => p.mediaType === 'video');

  return (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Fotos ({photoCount}/{limits.photos})
          </h3>
        </div>
        
        <label
          htmlFor="photo-upload"
          className={cn(
            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
            photoCount >= limits.photos && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {uploading ? 'Wird hochgeladen...' : 'Fotos auswählen'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max. {limits.photos} Fotos, je max. {MAX_PHOTO_SIZE_MB}MB (JPEG, PNG, WebP)
            </p>
          </div>
          <input
            id="photo-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleFileSelect(e, 'image')}
            disabled={uploading || photoCount >= limits.photos}
          />
        </label>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((preview, index) => preview.mediaType === 'image' && (
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
        )}
      </div>

      {/* Video Upload Section - Only show if allowed */}
      {limits.videos > 0 && (
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Video className="h-5 w-5" />
              Videos ({videoCount}/{limits.videos})
            </h3>
          </div>
          
          <label
            htmlFor="video-upload"
            className={cn(
              "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-amber-500/50",
              videoCount >= limits.videos && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Video className="w-8 h-8 mb-2 text-amber-500" />
              <p className="text-sm text-muted-foreground">
                {uploading ? 'Wird hochgeladen...' : 'Video auswählen'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max. {limits.videos} Video{limits.videos > 1 ? 's' : ''}, je max. {MAX_VIDEO_SIZE_MB}MB (MP4, WebM)
              </p>
            </div>
            <input
              id="video-upload"
              type="file"
              className="hidden"
              accept="video/mp4,video/webm"
              onChange={(e) => handleFileSelect(e, 'video')}
              disabled={uploading || videoCount >= limits.videos}
            />
          </label>

          {videoPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previews.map((preview, index) => preview.mediaType === 'video' && (
                <div key={index} className="relative group">
                  <div className="relative w-full h-32 bg-black rounded-lg overflow-hidden">
                    <video
                      src={preview.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removePreview(index)}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Upload status indicator */}
                  {preview.uploaded && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-green-600 text-white text-xs rounded">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload button */}
      {hasUnuploadedFiles && (
        <Button 
          onClick={handleUpload} 
          disabled={uploading}
          className="w-full"
        >
          {uploading ? 'Wird hochgeladen...' : `${previews.filter(p => !p.uploaded).length} Datei(en) hochladen`}
        </Button>
      )}

      {previews.length === 0 && (
        <div className="flex items-center justify-center h-32 bg-muted/30 rounded-lg">
          <div className="text-center">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Noch keine Medien ausgewählt
            </p>
          </div>
        </div>
      )}

      {imagePreviews.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          ⭐ Klicke auf den Stern, um das Hauptfoto zu wählen
        </p>
      )}
    </div>
  );
};