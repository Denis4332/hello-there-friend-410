import { useState } from 'react';
import { createPlaceholder } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';

interface BlurImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export const BlurImage = ({ 
  src, 
  alt, 
  width = 400, 
  height = 500,
  className 
}: BlurImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const placeholder = createPlaceholder(width, height);

  return (
    <div className="relative">
      {!loaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 blur-lg"
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          'transition-opacity duration-300',
          loaded ? 'opacity-100' : 'opacity-0',
          className
        )}
      />
    </div>
  );
};
