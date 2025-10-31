import { useState, useEffect } from 'react';
import { PopupBanner } from './PopupBanner';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';

const STORAGE_KEY_PREFIX = 'banner_shown_';

export const BannerManager = () => {
  const { data: popupAds } = useAdvertisements('popup');
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);

  useEffect(() => {
    if (!popupAds || popupAds.length === 0) return;

    const showPopup = () => {
      // Find first eligible ad
      for (const ad of popupAds) {
        const storageKey = `${STORAGE_KEY_PREFIX}${ad.id}`;
        const lastShown = localStorage.getItem(storageKey);

        if (shouldShowAd(ad, lastShown)) {
          const timer = setTimeout(() => {
            setCurrentAd(ad);
          }, ad.popup_delay_seconds * 1000);

          return () => clearTimeout(timer);
        }
      }
    };

    showPopup();
  }, [popupAds]);

  const shouldShowAd = (ad: Advertisement, lastShown: string | null): boolean => {
    if (!lastShown) return true;

    const lastShownTime = new Date(lastShown).getTime();
    const now = new Date().getTime();

    switch (ad.popup_frequency) {
      case 'always':
        return true;
      case 'once_per_day':
        return now - lastShownTime > 24 * 60 * 60 * 1000;
      case 'once_per_session':
      default:
        return false;
    }
  };

  const handleClose = () => {
    if (currentAd) {
      const storageKey = `${STORAGE_KEY_PREFIX}${currentAd.id}`;
      localStorage.setItem(storageKey, new Date().toISOString());
      setCurrentAd(null);
    }
  };

  const handleImpression = async () => {
    if (!currentAd) return;
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id: currentAd.id,
          event_type: 'impression',
        }),
      });
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  };

  const handleClick = async () => {
    if (!currentAd) return;
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ad_id: currentAd.id,
          event_type: 'click',
        }),
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  };

  if (!currentAd) return null;

  return (
    <PopupBanner
      ad={currentAd}
      onClose={handleClose}
      onImpression={handleImpression}
      onClick={handleClick}
    />
  );
};
