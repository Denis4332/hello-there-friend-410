import { useEffect, useRef } from 'react';
import { useAdvertisement } from '@/hooks/useAdvertisements';
import { BannerPosition, BANNER_CONFIG } from '@/types/advertisement';
import { queueAdEvent } from '@/lib/adEventQueue';
import { BannerCTA } from './BannerCTA';

interface BaseBannerProps {
  position: BannerPosition;
  className?: string;
}

export const BaseBanner = ({ position, className = '' }: BaseBannerProps) => {
  const { ad, isLoading } = useAdvertisement(position);
  const impressionTracked = useRef(false);
  const config = BANNER_CONFIG[position];
  const isVertical = position === 'in_grid' || position === 'popup';

  const handleClick = () => {
    if (!ad) return;
    // Open link FIRST (synchronously) to prevent mobile popup blockers
    window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    // Track click in background via queue
    queueAdEvent(ad.id, 'click');
  };

  useEffect(() => {
    if (!ad || impressionTracked.current) return;
    
    // Track impression after 3 seconds (user must actually see it)
    const impressionTimer = setTimeout(() => {
      queueAdEvent(ad.id, 'impression');
      impressionTracked.current = true;
    }, 3000);
    
    return () => clearTimeout(impressionTimer);
  }, [ad]);

  // Reset tracking when ad changes
  useEffect(() => {
    impressionTracked.current = false;
  }, [ad?.id]);

  // Hide during loading to prevent flash
  if (isLoading) {
    return null;
  }

  // Show CTA if no ad available
  if (!ad) {
    return <BannerCTA position={position} className={className} />;
  }

  return (
    <div className={`${className} flex justify-center`}>
      <div
        onClick={handleClick}
      className={`cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${
        isVertical 
          ? 'w-[300px] max-w-[300px]' 
          : 'w-full max-w-[728px] mx-auto'
      }`}
        style={{
          aspectRatio: `${config.desktop.width} / ${config.desktop.height}`,
        }}
      >
        <img
          src={`${ad.image_url}?width=${config.desktop.width}&resize=contain&quality=70`}
          alt={ad.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};
