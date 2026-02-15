import { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToastMessages } from '@/hooks/useToastMessages';
import { cn } from '@/lib/utils';
import { compressImage } from '@/utils/imageCompression';
interface PhotoUploaderProps {
  profileId: string;
  userId?: string; // Optional: vom Parent übergeben für Session-Fallback
  listingType?: 'basic' | 'premium' | 'top';
  onUploadComplete?: () => void;
  onSetPrimary?: (photoId: string) => void; // Callback für DB-Update bei existierenden Fotos
  currentPrimaryId?: string; // ID des aktuellen Hauptfotos aus DB
}

interface MediaPreview {
  id?: string; // DB ID für existierende Fotos
  url: string;
  file?: File;
  uploaded: boolean;
  mediaType: 'image' | 'video';
}

// Tiered limits based on listing type
const MEDIA_LIMITS = {
  basic: { photos: 5 },
  premium: { photos: 10 },
  top: { photos: 15 },
};

const MAX_PHOTO_SIZE_MB = 10;
const ALLOWED_PHOTO_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

export const PhotoUploader = ({ profileId, userId, listingType = 'basic', onUploadComplete, onSetPrimary, currentPrimaryId }: PhotoUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<MediaPreview[]>([]);
  // For NEW (not yet uploaded) photos: which one should become primary after upload
  // This is a separate concept from currentPrimaryId (which is for DB photos)
  const [pendingPrimaryIndex, setPendingPrimaryIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const { showSuccess, showError, showCustomError } = useToastMessages();
  
  const limits = MEDIA_LIMITS[listingType];
  const photoCount = previews.filter(p => p.mediaType === 'image').length;

  // Check if there's already a primary in DB
  const hasDbPrimary = Boolean(currentPrimaryId);

  // Lade existierende Fotos beim Mounten (für Tab-Wechsel Persistenz)
  useEffect(() => {
    const loadExistingPhotos = async () => {
      if (!profileId) {
        setIsLoadingExisting(false);
        return;
      }
      
      try {
        const { data: photos } = await supabase
          .from('photos')
          .select('id, storage_path, is_primary, media_type')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: true });
        
        if (photos && photos.length > 0) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const existingPreviews: MediaPreview[] = photos.map(photo => ({
            id: photo.id,
            url: `${supabaseUrl}/storage/v1/object/public/profile-photos/${photo.storage_path}?v=${photo.id}`,
            uploaded: true,
            mediaType: (photo.media_type as 'image' | 'video') || 'image',
          }));
          
          setPreviews(existingPreviews);
          // Reset pending primary since we loaded from DB
          setPendingPrimaryIndex(null);
        }
      } catch (error) {
        console.error('Fehler beim Laden existierender Fotos:', error);
      } finally {
        setIsLoadingExisting(false);
      }
    };
    
    loadExistingPhotos();
  }, [profileId, currentPrimaryId]); // Re-load when currentPrimaryId changes

  // Browser-Warnung beim Verlassen während Upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = 'Upload läuft noch. Seite wirklich verlassen?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploading]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check count limit
    if (photoCount + files.length > limits.photos) {
      showCustomError(`Maximal ${limits.photos} Fotos erlaubt (${listingType.toUpperCase()})`);
      return;
    }

    // Validate and compress each file
    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
        showCustomError(`${file.name} ist zu groß (max. ${MAX_PHOTO_SIZE_MB}MB). Tipp: Verkleinere das Bild mit einem Online-Tool wie tinypng.com`);
        continue;
      }
      if (!ALLOWED_PHOTO_FORMATS.includes(file.type)) {
        showCustomError(`${file.name} ist kein erlaubtes Bildformat (JPEG, PNG, WebP)`);
        continue;
      }
      
      try {
        const compressedFile = await compressImage(file);
        validFiles.push(compressedFile);
      } catch (err) {
        console.error('Compression failed, using original:', err);
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    // Create local previews
    const newPreviews: MediaPreview[] = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      file,
      uploaded: false,
      mediaType: 'image',
    }));
    
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleUpload = async () => {
    const filesToUpload = previews.filter(p => !p.uploaded && p.file);
    if (filesToUpload.length === 0) return;

    setUploading(true);

    try {
      // 1. Auth-Check - nur für frühe Fehlermeldung
      //    Die Edge Function macht die echte Sicherheitsprüfung mit SERVICE_ROLE_KEY
      let { data: { user } } = await supabase.auth.getUser();
      
      // Wenn kein User, versuche Session-Refresh
      if (!user) {
        console.log('🔄 Session-Refresh versuchen...');
        const { data: refreshData } = await supabase.auth.refreshSession();
        user = refreshData?.user ?? null;
      }
      
      // Nutze userId Prop als Fallback
      const effectiveUserId = user?.id || userId;
      
      if (!effectiveUserId) {
        console.error('❌ Keine User-ID verfügbar');
        showCustomError('Session abgelaufen. Bitte melde dich erneut an.');
        setUploading(false);
        return;
      }

      // WICHTIG: Hole FRISCHE profileId vom Server!
      // Dies umgeht jegliche React-State/Cache/Prop-Probleme
      const { data: userProfile, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', effectiveUserId)
        .maybeSingle();

      if (profileLookupError || !userProfile) {
        console.error('❌ Profil nicht gefunden für User:', effectiveUserId);
        showCustomError('Dein Profil wurde nicht gefunden. Bitte lade die Seite neu.');
        setUploading(false);
        return;
      }

      const actualProfileId = userProfile.id;

      // Debug: Zeige wenn Prop und DB unterschiedlich sind
      if (profileId !== actualProfileId) {
        console.warn('⚠️ profileId MISMATCH! Prop:', profileId, 'DB:', actualProfileId);
      }

      console.log('✅ Auth OK, verwende verifizierte profileId:', actualProfileId);

      // Check existing media in database
      const { data: existingPhotos } = await supabase
        .from('photos')
        .select('id, media_type')
        .eq('profile_id', actualProfileId);

      const existingImagesCount = existingPhotos?.filter(p => p.media_type === 'image' || !p.media_type).length || 0;

      // Set upload progress
      setUploadProgress({ current: 0, total: filesToUpload.length });

      const results: { previewUrl: string; uploadedUrl: string; insertedId?: string }[] = [];

      // PARALLELER Upload in 3er-Batches für bessere Performance
      const BATCH_SIZE = 3;
      
      // Helper function to upload a single file
      const uploadSingleFile = async (preview: MediaPreview, fileIndex: number) => {
        const file = preview.file!;
        const previewIndex = previews.findIndex(p => p.url === preview.url);

        // Generate cryptographically random filename
        const originalExt = file.name.split('.').pop()?.toLowerCase();
        const fileExt = preview.mediaType === 'image' ? 'webp' : originalExt;
        const randomBytes = new Uint8Array(16);
        crypto.getRandomValues(randomBytes);
        const randomName = Array.from(randomBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const fileName = `${randomName}.${fileExt}`;

        // Upload via edge function for server-side validation
        const formData = new FormData();
        formData.append('file', file);
        formData.append('profileId', actualProfileId);
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
        // If no existing images AND this is marked as pending primary OR first new image
        const isFirstNewImage = existingImagesCount === 0 && previewIndex === 0;
        const isPendingPrimary = pendingPrimaryIndex !== null && previewIndex === pendingPrimaryIndex;
        const shouldBePrimary = preview.mediaType === 'image' && !hasDbPrimary && (isPendingPrimary || isFirstNewImage);

        // Insert photo record into database and get the new ID back
        const { data: insertedPhoto, error: dbError } = await supabase.from('photos').insert({
          profile_id: actualProfileId,
          storage_path: data.path,
          is_primary: shouldBePrimary,
          media_type: data.media_type || preview.mediaType,
        }).select('id, is_primary, media_type, storage_path').single();

        if (dbError) throw dbError;

        return { previewUrl: preview.url, uploadedUrl: data.url, insertedId: insertedPhoto?.id };
      };

      // Process files in batches of BATCH_SIZE for parallel upload
      for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
        const batch = filesToUpload.slice(i, i + BATCH_SIZE);
        
        // Upload batch in parallel
        const batchResults = await Promise.all(
          batch.map((preview, batchIndex) => uploadSingleFile(preview, i + batchIndex))
        );
        
        results.push(...batchResults);
        
        // Update progress after each batch
        setUploadProgress({ 
          current: Math.min(i + BATCH_SIZE, filesToUpload.length), 
          total: filesToUpload.length 
        });
      }
      
      // Update previews to mark as uploaded WITH the real DB ID
      setPreviews(prev => prev.map(p => {
        const result = results.find(r => r.previewUrl === p.url);
        if (result) {
          return { 
            ...p, 
            id: result.insertedId, // Store the real DB ID so primary check works
            url: result.uploadedUrl, 
            uploaded: true, 
            file: undefined 
          };
        }
        return p;
      }));

      // Check if this was the first photo - update profile status from draft to pending
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', actualProfileId)
        .maybeSingle();
      
      if (currentProfile?.status === 'draft') {
        await supabase
          .from('profiles')
          .update({ status: 'pending' })
          .eq('id', actualProfileId);
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
      // Adjust pendingPrimaryIndex if needed (only for non-uploaded images)
      if (pendingPrimaryIndex !== null) {
        if (pendingPrimaryIndex === index) {
          // Removed the pending primary, reset
          setPendingPrimaryIndex(null);
        } else if (index < pendingPrimaryIndex) {
          // Adjust index since we removed before it
          setPendingPrimaryIndex(pendingPrimaryIndex - 1);
        }
      }
      return newPreviews;
    });
  };

  // Set a NEW (not yet uploaded) photo as pending primary
  const setPendingPrimary = (index: number) => {
    const preview = previews[index];
    if (preview?.mediaType === 'image' && !preview.uploaded) {
      setPendingPrimaryIndex(index);
    }
  };

  // Check if a photo should show as primary in UI
  const isPrimaryPhoto = (preview: MediaPreview, index: number): boolean => {
    if (preview.uploaded) {
      // For uploaded photos: check against DB primary
      // CRITICAL: Guard against undefined === undefined (causes double-star bug)
      if (!preview.id || !currentPrimaryId) {
        return false;
      }
      return preview.id === currentPrimaryId;
    } else {
      // For new photos: check against pending primary
      // If no pending primary selected and no DB primary, first new image is "default"
      if (pendingPrimaryIndex !== null) {
        return index === pendingPrimaryIndex;
      }
      // If no DB primary exists, first new image becomes default primary
      if (!hasDbPrimary) {
        const newImageIndices = previews
          .map((p, i) => (!p.uploaded && p.mediaType === 'image') ? i : -1)
          .filter(i => i >= 0);
        return newImageIndices.length > 0 && index === newImageIndices[0];
      }
      return false;
    }
  };

  const hasUnuploadedFiles = previews.some(p => !p.uploaded && p.file);
  const imagePreviews = previews.filter(p => p.mediaType === 'image');

  return (
    <div className="space-y-6 relative">
      {/* Upload Overlay mit Warnung */}
      {uploading && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-8 max-w-sm text-center shadow-2xl mx-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="font-bold text-xl mb-3">Upload läuft...</h3>
            <p className="text-amber-500 font-semibold mb-4 flex items-center justify-center gap-2">
              <span className="text-2xl">⚠️</span>
              Bitte Seite NICHT schließen oder neu laden!
            </p>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                {uploadProgress.current}/{uploadProgress.total} Datei{uploadProgress.total !== 1 ? 'en' : ''} hochgeladen
              </p>
              {/* Progress bar */}
              <div className="mt-2 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
            onChange={(e) => handleFileSelect(e)}
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
                  onClick={() => {
                    // Für bereits hochgeladene Fotos: DB aktualisieren
                    if (preview.uploaded && preview.id && onSetPrimary) {
                      onSetPrimary(preview.id);
                    } else if (!preview.uploaded) {
                      // Für neue, noch nicht hochgeladene Fotos: lokaler State
                      setPendingPrimary(index);
                    }
                  }}
                  className={cn(
                    "absolute top-2 left-2 p-1.5 rounded-full transition-all",
                    isPrimaryPhoto(preview, index)
                      ? "bg-primary text-primary-foreground"
                      : "bg-black/50 text-white/70 hover:text-yellow-400"
                  )}
                  title={isPrimaryPhoto(preview, index) 
                    ? (preview.uploaded ? "Hauptfoto" : "Wird Hauptfoto nach Upload") 
                    : "Als Hauptfoto setzen"}
                >
                  <Star 
                    className={cn(
                      "w-4 h-4",
                      isPrimaryPhoto(preview, index) && "fill-current"
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
                {isPrimaryPhoto(preview, index) && (
                  <div className={cn(
                    "absolute bottom-2 left-2 px-2 py-1 text-xs rounded",
                    preview.uploaded 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-amber-500 text-white"
                  )}>
                    {preview.uploaded ? "Hauptfoto" : "→ Hauptfoto"}
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