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
 * Get optimized image URL with transformation parameters
 * Handles both Supabase Storage and external URLs (e.g., Unsplash)
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

  try {
    const url = new URL(baseUrl);
    
    // Handle Unsplash URLs specifically
    if (url.hostname.includes('unsplash.com')) {
      // Modify existing Unsplash parameters for better compression
      if (options.quality) {
        url.searchParams.set('q', Math.min(options.quality, 70).toString());
      }
      if (options.width) {
        url.searchParams.set('w', options.width.toString());
      }
      if (options.format === 'webp') {
        url.searchParams.set('fm', 'webp');
      }
      return url.toString();
    }
    
    // Handle Supabase Storage and other URLs
    if (options.width) url.searchParams.set('width', options.width.toString());
    if (options.height) url.searchParams.set('height', options.height.toString());
    if (options.quality) url.searchParams.set('quality', options.quality.toString());
    if (options.format) url.searchParams.set('format', options.format);
    
    return url.toString();
  } catch (e) {
    // Fallback for invalid URLs
    return baseUrl;
  }
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
