import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const ResponsiveImage = ({ 
  src, 
  alt, 
  sizes,
  className,
  loading = 'lazy'
}: ResponsiveImageProps) => {
  const srcSet = [
    `${getOptimizedImageUrl(src, { width: 320, quality: 75, format: 'webp' })} 320w`,
    `${getOptimizedImageUrl(src, { width: 640, quality: 80, format: 'webp' })} 640w`,
    `${getOptimizedImageUrl(src, { width: 828, quality: 85, format: 'webp' })} 828w`,
    `${getOptimizedImageUrl(src, { width: 1200, quality: 85, format: 'webp' })} 1200w`,
  ].join(', ');

  return (
    <img
      src={getOptimizedImageUrl(src, { width: 640, quality: 80, format: 'webp' })}
      srcSet={srcSet}
      sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={loading === 'eager' ? 'high' : 'auto'}
      className={cn(className)}
    />
  );
};
