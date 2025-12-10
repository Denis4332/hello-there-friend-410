/**
 * Shared Image Compression Utilities
 * ULTRA-AGGRESSIVE compression: Max 500x650px, 55% WebP quality
 * Used by: PhotoUploader, AdminProfileCreateDialog, AdminProfile, BulkImageCompressor
 */

/**
 * Check WebP support
 */
const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

/**
 * Compress a File to max 500x650px at 55% WebP quality (ultra-aggressive for mobile)
 * Falls back to JPEG if WebP not supported
 * @param file - Input image file
 * @returns Compressed File with .webp or .jpg extension
 */
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(file);
        return;
      }

      // ULTRA-AGGRESSIVE: Max dimensions for mobile performance
      const MAX_WIDTH = 500;
      const MAX_HEIGHT = 650;
      
      let { width, height } = img;
      
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try WebP first (30-40% smaller), fallback to JPEG
      const useWebP = supportsWebP();
      const mimeType = useWebP ? 'image/webp' : 'image/jpeg';
      const extension = useWebP ? '.webp' : '.jpg';
      const quality = 0.55; // 55% quality - ultra aggressive
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^.]+$/, extension), 
              { type: mimeType, lastModified: Date.now() }
            );
            console.log(`🗜️ Ultra-Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${useWebP ? 'WebP' : 'JPEG'})`);
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        mimeType,
        quality
      );
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress a Blob to max 500x650px at 55% WebP quality (ultra-aggressive)
 * Used by BulkImageCompressor for existing images
 * @param blob - Input image blob
 * @returns Compressed Blob
 */
export const compressImageBlob = async (blob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      const MAX_WIDTH = 500;
      const MAX_HEIGHT = 650;
      
      let { width, height } = img;
      
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try WebP first, fallback to JPEG
      const useWebP = supportsWebP();
      const mimeType = useWebP ? 'image/webp' : 'image/jpeg';
      
      canvas.toBlob(
        (result) => {
          if (result) {
            console.log(`🗜️ Blob Ultra-Compressed: ${(blob.size / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB (${useWebP ? 'WebP' : 'JPEG'})`);
            resolve(result);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        mimeType,
        0.55 // 55% quality - ultra aggressive
      );
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(blob);
  });
};
