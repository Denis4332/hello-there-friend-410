import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PopupBanner } from './PopupBanner';
import { DemoPopupBanner } from './DemoPopupBanner';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';

const STORAGE_KEY_PREFIX = 'banner_shown_';

export const BannerManager = () => {
  const { data: popupAds } = useAdvertisements('popup');
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const [adRotationTrigger, setAdRotationTrigger] = useState(0);
  const location = useLocation();

  // Reset Pop-up bei Route-Wechsel
  useEffect(() => {
    setCurrentAd(null);
    setAdRotationTrigger(prev => prev + 1);
  }, [location.pathname]);

  useEffect(() => {
    // Warte bis Query fertig geladen ist
    if (popupAds === undefined) return;

    // Fall 1: Echte Ads vorhanden - zeige diese
    if (popupAds.length > 0) {
      // Filtere verfügbare Ads
      const availableAds = popupAds.filter(ad => {
        const storageKey = `${STORAGE_KEY_PREFIX}${ad.id}`;
        const lastShown = localStorage.getItem(storageKey);
        return shouldShowAd(ad, lastShown);
      });

      if (availableAds.length > 0) {
        // ROTATION: Zufällige Ad auswählen (Multi-Advertiser Support)
        const randomIndex = Math.floor(Math.random() * availableAds.length);
        const selectedAd = availableAds[randomIndex];
        
        const timer = setTimeout(() => {
          setCurrentAd(selectedAd);
        }, selectedAd.popup_delay_seconds * 1000);

        return () => clearTimeout(timer);
      }
      return; // Keine Demo-Popup wenn echte Ads verfügbar
    }

    // Fall 2: Keine echten Ads → Demo-Popup (bei jeder Navigation)
    const timer = setTimeout(() => {
      setShowDemoPopup(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [popupAds, adRotationTrigger]);

  const shouldShowAd = (ad: Advertisement, lastShown: string | null): boolean => {
    // 'always' Frequenz: Zeige bei jedem Navigation-Wechsel (mit Mindestabstand)
    if (ad.popup_frequency === 'always') {
      if (!lastShown) return true;
      
      const lastShownTime = new Date(lastShown).getTime();
      const now = new Date().getTime();
      
      // Mindestabstand: 30 Sekunden (verhindert Spam bei schnellem Klicken)
      return now - lastShownTime > 30 * 1000;
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
