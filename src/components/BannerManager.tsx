import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PopupBanner } from './PopupBanner';
import { DemoPopupBanner } from './DemoPopupBanner';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';

const STORAGE_KEY_PREFIX = 'popup_shown_session_';
const SESSION_POPUP_KEY = 'popup_shown_this_session';
const DEMO_POPUP_KEY = 'demo_popup_shown_this_session';

// Blacklist: Keine Popups auf diesen Seiten
const EXCLUDED_PATHS = [
  '/bannerpreise',
  '/banner/buchen',
  '/auth',
  '/reset-password',
  '/profil/erstellen',
  '/profil/bearbeiten',
  '/mein-profil',
  '/favoriten',
  '/kontakt',
];

export const BannerManager = () => {
  const { data: popupAds } = useAdvertisements('popup');
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const location = useLocation();

  // Prüfe ob auf ausgeschlossener Seite
  const isExcludedPage = EXCLUDED_PATHS.includes(location.pathname) || 
    location.pathname.startsWith('/admin');

  useEffect(() => {
    // Keine Popups auf ausgeschlossenen Seiten
    if (isExcludedPage) return;

    // Warte bis Query fertig geladen ist
    if (popupAds === undefined) return;

    // FESTE REGEL: Nur 1x pro Session
    const alreadyShownThisSession = sessionStorage.getItem(SESSION_POPUP_KEY);
    if (alreadyShownThisSession) return;

    // Fall 1: Echte Ads vorhanden - zeige erste aktive
    if (popupAds.length > 0) {
      const selectedAd = popupAds[0]; // Nur 1 Banner pro Position
      const delay = selectedAd.popup_delay_seconds || 5;
      
      const timer = setTimeout(() => {
        setCurrentAd(selectedAd);
        sessionStorage.setItem(SESSION_POPUP_KEY, 'true');
      }, delay * 1000);

      return () => clearTimeout(timer);
    }

    // Fall 2: Keine echten Ads → Demo-Popup nach 5 Sekunden
    const demoShown = sessionStorage.getItem(DEMO_POPUP_KEY);
    if (demoShown) return;

    const demoTimer = setTimeout(() => {
      setShowDemoPopup(true);
      sessionStorage.setItem(DEMO_POPUP_KEY, 'true');
    }, 5000);

    return () => clearTimeout(demoTimer);
  }, [popupAds, isExcludedPage, location.pathname]);

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
