/**
 * Shared Image Compression Utilities
 * Max dimensions: 1200x1600px, 80% JPEG quality
 * Used by: PhotoUploader, AdminProfileCreateDialog, AdminProfile, BulkImageCompressor
 */

/**
 * Compress a File to max 1200x1600px at 80% JPEG quality
 * @param file - Input image file
 * @returns Compressed File with .jpg extension
 */
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(file); // Fallback to original if canvas not supported
        return;
      }

      // Max dimensions for compressed images
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1600;
      
      let { width, height } = img;
      
      // Calculate new dimensions while maintaining aspect ratio
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with 80% JPEG quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create new file with compressed data
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            console.log(`🗜️ Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original
          }
        },
        'image/jpeg',
        0.8 // 80% quality
      );
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress a Blob to max 1200x1600px at 80% JPEG quality
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
      
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Compression failed'));
          }
        },
        'image/jpeg',
        0.8
      );
      
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(blob);
  });
};
