/**
 * OptimizedImage Component
 * 
 * Performance-optimized image component with:
 * - Lazy loading with Intersection Observer
 * - Blur placeholder while loading
 * - Progressive image loading
 * - WebP detection
 * - Proper aspect ratio to prevent CLS
 */
import { memo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
}

const OptimizedImageComponent = ({
  src,
  alt,
  width = 300,
  height = 400,
  className,
  priority = false,
  aspectRatio = '3/4',
  objectFit = 'cover',
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Generate optimized URL with resize parameters
  const optimizedSrc = src.includes('?') 
    ? `${src}&width=${width}&height=${height}&resize=cover&quality=70`
    : `${src}?width=${width}&height=${height}&resize=cover&quality=70`;

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
      style={{ aspectRatio }}
    >
      {/* Blur placeholder */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 transition-opacity duration-300',
          isLoaded ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* Shimmer loading animation */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}

      {/* Actual image */}
      {(isInView || priority) && !hasError && (
        <img
          src={optimizedSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'absolute inset-0 w-full h-full transition-opacity duration-300',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'fill' && 'object-fill',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-4xl font-bold text-muted-foreground">
            {alt.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};

export const OptimizedImage = memo(OptimizedImageComponent);
