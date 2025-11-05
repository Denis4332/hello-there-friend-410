import { useState, useEffect } from 'react';
import { PopupBanner } from './PopupBanner';
import { DemoPopupBanner } from './DemoPopupBanner';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';

const STORAGE_KEY_PREFIX = 'banner_shown_';

export const BannerManager = () => {
  const { data: popupAds } = useAdvertisements('popup');
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [showDemoPopup, setShowDemoPopup] = useState(false);

  useEffect(() => {
    // Warte bis Query fertig geladen ist
    if (popupAds === undefined) return;

    // Fall 1: Echte Ads vorhanden - zeige diese
    if (popupAds.length > 0) {
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
      return; // Keine Demo-Popup wenn echte Ads verfügbar
    }

    // Fall 2: Keine echten Ads → Demo-Popup
    // sessionStorage statt localStorage = nur einmal pro Session
    const demoShown = sessionStorage.getItem('demo_popup_shown');
    
    if (!demoShown) {
      const timer = setTimeout(() => {
        setShowDemoPopup(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [popupAds]);

  const shouldShowAd = (ad: Advertisement, lastShown: string | null): boolean => {
    // Session-basierte Sperre für 'always' - nur 1x pro Browser-Session
    if (ad.popup_frequency === 'always') {
      const sessionKey = `${STORAGE_KEY_PREFIX}${ad.id}_session`;
      if (sessionStorage.getItem(sessionKey)) return false;
      return true;
    }

    if (!lastShown) return true;

    const lastShownTime = new Date(lastShown).getTime();
    const now = new Date().getTime();

    switch (ad.popup_frequency) {
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
      
      // Auch Session-Storage setzen für 'always' Frequenz
      if (currentAd.popup_frequency === 'always') {
        const sessionKey = `${STORAGE_KEY_PREFIX}${currentAd.id}_session`;
        sessionStorage.setItem(sessionKey, 'true');
      }
      
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

  // Zeige Demo-Popup wenn konfiguriert
  if (showDemoPopup && !currentAd) {
    return (
      <DemoPopupBanner
        onClose={() => setShowDemoPopup(false)}
      />
    );
  }

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
