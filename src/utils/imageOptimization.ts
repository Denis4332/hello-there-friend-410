/**
 * Image optimization utilities for lazy loading and performance
 */

/**
 * Preload critical images (e.g., hero images, above-the-fold content)
 * @param src - Image URL to preload
 */
export const preloadImage = (src: string): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

/**
 * Create a low-quality image placeholder (LQIP) data URL
 * This can be used as a blur placeholder while the full image loads
 * @param width - Placeholder width
 * @param height - Placeholder height
 * @returns Base64 encoded SVG data URL
 */
export const createPlaceholder = (width: number = 400, height: number = 500): string => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#e5e7eb"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="20" fill="#9ca3af" text-anchor="middle" dy=".3em">
        Lädt...
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Get optimized Supabase Storage URL with transformation parameters
 * Note: Supabase Storage supports image transformations
 * @param baseUrl - Original image URL
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  baseUrl: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'origin';
  }
): string => {
  if (!options) return baseUrl;

  // Supabase Storage supports URL parameters for transformations
  const params = new URLSearchParams();
  
  if (options.width) params.append('width', options.width.toString());
  if (options.height) params.append('height', options.height.toString());
  if (options.quality) params.append('quality', options.quality.toString());
  if (options.format) params.append('format', options.format);

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Check if browser supports WebP format
 * @returns Promise<boolean> - true if WebP is supported
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    const img = new Image();
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    img.src = webP;
  });
};

/**
 * Intersection Observer for lazy loading images
 * Use this to load images only when they're about to enter viewport
 */
export const createLazyLoadObserver = (
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px', // Load 50px before entering viewport
    threshold: 0.01,
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, defaultOptions);
};
