import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';
import { useEffect } from 'react';
import { AdvertisementCTA } from './AdvertisementCTA';

interface BannerDisplayProps {
  position: 'top' | 'grid';
  className?: string;
}

export const BannerDisplay = ({ position, className = '' }: BannerDisplayProps) => {
  const { data: ads, isLoading } = useAdvertisements(position);

  const handleClick = (ad: Advertisement) => {
    // Open link FIRST (synchronously) to prevent mobile popup blockers
    window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    
    // Track click in background
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ad_id: ad.id,
        event_type: 'click',
      }),
    }).catch(error => console.error('Failed to track click:', error));
  };

  useEffect(() => {
    if (!ads || ads.length === 0) return;
    
    const displayedAd = ads[0];
    
    const trackImpression = async (ad: Advertisement) => {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ad_id: ad.id,
            event_type: 'impression',
          }),
        });
      } catch (error) {
        console.error('Failed to track impression:', error);
      }
    };

    trackImpression(displayedAd);
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
          src={`${ad.image_url}?width=800&resize=contain`}
          alt={ad.title}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-auto object-contain"
        />
      </div>
    </div>
  );
};
