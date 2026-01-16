import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';
import { useEffect } from 'react';
import { AdvertisementCTA } from './AdvertisementCTA';
import { queueAdEvent } from '@/lib/adEventQueue';

interface BannerDisplayProps {
  position: 'top' | 'grid';
  className?: string;
}

export const BannerDisplay = ({ position, className = '' }: BannerDisplayProps) => {
  const { data: ads, isLoading } = useAdvertisements(position);

  const handleClick = (ad: Advertisement) => {
    // Open link FIRST (synchronously) to prevent mobile popup blockers
    window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    
    // Track click in background via queue
    queueAdEvent(ad.id, 'click');
  };

  useEffect(() => {
    if (!ads || ads.length === 0) return;
    
    const displayedAd = ads[0];
    
    // Delay impression tracking by 3 seconds (user must actually see it)
    const impressionTimer = setTimeout(() => {
      queueAdEvent(displayedAd.id, 'impression');
    }, 3000);
    
    return () => clearTimeout(impressionTimer);
  }, [ads]);

  // Während des Ladens nichts anzeigen (verhindert Placeholder-Flash)
  if (isLoading) {
    return null;
  }

  if (!ads || ads.length === 0) {
    return (
      <div className={className}>
        <AdvertisementCTA position={position} />
      </div>
    );
  }

  // Show only the first ad (exclusive placement)
  const ad = ads[0];

  return (
    <div className={`${className} flex justify-center`}>
      <div
        onClick={() => handleClick(ad)}
        className={`cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${
          position === 'top' 
            ? 'w-full max-w-md mx-auto' 
            : 'w-[350px] max-w-[350px]'
        }`}
      >
        <img
          src={`${ad.image_url}?width=600&resize=contain&quality=70`}
          alt={ad.title}
          loading="lazy"
          decoding="async"
          className="w-full h-auto object-contain"
        />
      </div>
    </div>
  );
};
