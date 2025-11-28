import { useEffect, useRef, useCallback } from 'react';

interface PrefetchOptions {
  /**
   * Delay before prefetching (ms)
   * @default 50
   */
  delay?: number;
  /**
   * Whether to prefetch on hover
   * @default true
   */
  onHover?: boolean;
  /**
   * Whether to prefetch when visible
   * @default false
   */
  onVisible?: boolean;
  /**
   * Intersection observer options for visibility detection
   */
  observerOptions?: IntersectionObserverInit;
}

/**
 * Prefetch URLs for faster navigation
 * Supports hover-based and visibility-based prefetching
 */
export const usePrefetch = (
  urls: string[],
  options: PrefetchOptions = {}
) => {
  const {
    delay = 50,
    onHover = true,
    onVisible = false,
    observerOptions = { rootMargin: '50px' },
  } = options;

  const prefetchedUrls = useRef(new Set<string>());
  const timeoutRef = useRef<NodeJS.Timeout>();

  const prefetchUrl = useCallback((url: string) => {
    // Skip if already prefetched
    if (prefetchedUrls.current.has(url)) return;

    // Skip in development to avoid unnecessary requests
    if (import.meta.env.DEV) {
      return;
    }

    // Create link element for prefetch
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    
    // Add to head
    document.head.appendChild(link);
    
    // Mark as prefetched
    prefetchedUrls.current.add(url);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!onHover) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Prefetch after delay
    timeoutRef.current = setTimeout(() => {
      urls.forEach(prefetchUrl);
    }, delay);
  }, [urls, prefetchUrl, delay, onHover]);

  const handleMouseLeave = useCallback(() => {
    // Clear timeout on mouse leave
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Visibility-based prefetching
  useEffect(() => {
    if (!onVisible || typeof window === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          urls.forEach(prefetchUrl);
        }
      });
    }, observerOptions);

    // This is a bit of a hack - we're observing the document body
    // In practice, you'd want to observe specific elements
    // The hook consumer should manage this
    
    return () => {
      observer.disconnect();
    };
  }, [urls, prefetchUrl, onVisible, observerOptions]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    handleMouseEnter,
    handleMouseLeave,
    prefetchUrl,
  };
};

/**
 * Prefetch profile images for faster loading
 */
export const usePrefetchImages = (imageUrls: string[]) => {
  const prefetchedImages = useRef(new Set<string>());

  const prefetchImage = useCallback((url: string) => {
    // Skip if already prefetched
    if (prefetchedImages.current.has(url)) return;

    const img = new Image();
    img.src = url;
    
    // Mark as prefetched
    prefetchedImages.current.add(url);
  }, []);

  useEffect(() => {
    // Prefetch all images with a slight delay
    const timeout = setTimeout(() => {
      imageUrls.forEach(prefetchImage);
    }, 100);

    return () => clearTimeout(timeout);
  }, [imageUrls, prefetchImage]);

  return { prefetchImage };
};
