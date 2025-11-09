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
    `${getOptimizedImageUrl(src, { width: 400, format: 'webp' })} 400w`,
    `${getOptimizedImageUrl(src, { width: 800, format: 'webp' })} 800w`,
    `${getOptimizedImageUrl(src, { width: 1200, format: 'webp' })} 1200w`,
  ].join(', ');

  return (
    <img
      src={getOptimizedImageUrl(src, { width: 800, format: 'webp' })}
      srcSet={srcSet}
      sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
      alt={alt}
      loading={loading}
      decoding="async"
      className={cn(className)}
    />
  );
};
