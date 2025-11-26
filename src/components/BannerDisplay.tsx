import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';
import { useEffect, useState, useCallback } from 'react';
import { AdvertisementCTA } from './AdvertisementCTA';

interface BannerDisplayProps {
  position: 'top' | 'grid';
  className?: string;
}

export const BannerDisplay = ({ position, className = '' }: BannerDisplayProps) => {
  const { data: ads } = useAdvertisements(position);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // Weighted random selection based on priority
  const getWeightedRandomAd = useCallback((ads: Advertisement[]) => {
    const totalWeight = ads.reduce((sum, ad) => sum + (ad.priority || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < ads.length; i++) {
      random -= (ads[i].priority || 1);
      if (random <= 0) return i;
    }
    return 0;
  }, []);

  // Initial weighted selection
  useEffect(() => {
    if (ads && ads.length > 0) {
      setCurrentAdIndex(getWeightedRandomAd(ads));
    }
  }, [ads, getWeightedRandomAd]);

  // Auto-rotation every 30 seconds for fair share
  useEffect(() => {
    if (!ads || ads.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentAdIndex(getWeightedRandomAd(ads));
    }, 30000);
    
    return () => clearInterval(interval);
  }, [ads, getWeightedRandomAd]);

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
    
    const displayedAd = ads[currentAdIndex] || ads[0];
    
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
  }, [ads, currentAdIndex]);

  if (!ads || ads.length === 0) {
    return (
      <div className={className}>
        <AdvertisementCTA position={position} />
      </div>
    );
  }

  // Show rotating ad for fair share
  const ad = ads[currentAdIndex] || ads[0];

  return (
    <div className={`${className} flex justify-center`}>
      <div
        onClick={() => handleClick(ad)}
        className="cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow w-[300px] max-w-[300px]"
      >
        <img
          src={ad.image_url}
          alt={ad.title}
          className="w-full h-auto max-h-[250px] object-contain"
        />
      </div>
    </div>
  );
};
