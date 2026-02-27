/**
 * Shared Image Compression Utilities
 * High-quality compression: Max 1200x1600px, 80% WebP quality
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
 * Compress a File to max 1200x1600px at 80% WebP quality
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

      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1600;
      
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
      const quality = 0.80; // 80% quality - good balance
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^.]+$/, extension), 
              { type: mimeType, lastModified: Date.now() }
            );
            console.log(`🗜️ Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${useWebP ? 'WebP' : 'JPEG'})`);
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
 * Compress a Blob to max 1200x1600px at 80% WebP quality
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
      
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1600;
      
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
            console.log(`🗜️ Blob Compressed: ${(blob.size / 1024).toFixed(0)}KB → ${(result.size / 1024).toFixed(0)}KB (${useWebP ? 'WebP' : 'JPEG'})`);
            resolve(result);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        mimeType,
        0.80 // 80% quality - good balance
      );
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(blob);
  });
};
