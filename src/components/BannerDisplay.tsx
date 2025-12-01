import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';
import { useEffect } from 'react';
import { AdvertisementCTA } from './AdvertisementCTA';

interface BannerDisplayProps {
  position: 'top' | 'grid';
  className?: string;
}

export const BannerDisplay = ({ position, className = '' }: BannerDisplayProps) => {
  const { data: ads } = useAdvertisements(position);

  const handleClick = async (ad: Advertisement) => {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id: ad.id,
          event_type: 'click',
        }),
      });
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to track click:', error);
    }
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
          src={ad.image_url}
          alt={ad.title}
          className="w-full h-auto object-contain"
        />
      </div>
    </div>
  );
};
