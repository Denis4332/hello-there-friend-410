import { useState, useEffect } from 'react';
import { getOptimizedImageUrl, supportsWebP } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  quality = 85,
  loading = 'lazy',
  priority = false,
  className 
}: OptimizedImageProps) => {
  const [webpSupported, setWebpSupported] = useState(false);

  useEffect(() => {
    supportsWebP().then(setWebpSupported);
  }, []);

  const optimizedUrl = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format: webpSupported ? 'webp' : 'origin'
  });

  useEffect(() => {
    if (priority && optimizedUrl) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedUrl;
      document.head.appendChild(link);
    }
  }, [priority, optimizedUrl]);

  return (
    <img
      src={optimizedUrl}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      className={cn(className)}
    />
  );
};
