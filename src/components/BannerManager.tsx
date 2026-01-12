import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PopupBanner } from './PopupBanner';
import { DemoPopupBanner } from './DemoPopupBanner';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';

const STORAGE_KEY_PREFIX = 'popup_shown_session_';
const DEMO_POPUP_KEY = 'demo_popup_shown_this_session';

// WHITELIST: Popup NUR auf diesen "Browse"-Seiten
const POPUP_ALLOWED_PATHS = ['/', '/suche', '/kantone', '/kategorien'];
const POPUP_ALLOWED_PREFIXES = ['/kategorie/', '/stadt/'];

export const BannerManager = () => {
  const { data: popupAds } = useAdvertisements('popup');
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const location = useLocation();

  // Prüfe ob auf erlaubter Browse-Seite
  const isPopupAllowedPage = 
    POPUP_ALLOWED_PATHS.includes(location.pathname) ||
    POPUP_ALLOWED_PREFIXES.some(prefix => location.pathname.startsWith(prefix));

  useEffect(() => {
    // Keine Popups auf nicht-erlaubten Seiten
    if (!isPopupAllowedPage) return;

    // Warte bis Query fertig geladen ist
    if (popupAds === undefined) return;

    // Fall 1: Echte Ads vorhanden - zeige erste aktive
    if (popupAds.length > 0) {
      const selectedAd = popupAds[0];
      const delay = selectedAd.popup_delay_seconds || 5;
      
      const timer = setTimeout(() => {
        setCurrentAd(selectedAd);
      }, delay * 1000);

      return () => clearTimeout(timer);
    }

    // Fall 2: Keine echten Ads → Demo-Popup nach 5 Sekunden (1x pro Session)
    const demoShown = sessionStorage.getItem(DEMO_POPUP_KEY);
    if (demoShown) return;

    const demoTimer = setTimeout(() => {
      setShowDemoPopup(true);
      sessionStorage.setItem(DEMO_POPUP_KEY, 'true');
    }, 5000);

    return () => clearTimeout(demoTimer);
  }, [popupAds, isPopupAllowedPage, location.pathname]);

  const handleClose = () => {
    if (currentAd) {
      const storageKey = `${STORAGE_KEY_PREFIX}${currentAd.id}`;
      localStorage.setItem(storageKey, new Date().toISOString());
      
      setCurrentAd(null);
    }
  };

  // FIRE-AND-FORGET: UI wartet nicht auf Tracking-Responses
  const handleImpression = () => {
    if (!currentAd) return;
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_id: currentAd.id, event_type: 'impression' }),
    }).catch(() => {}); // Silent fail
  };

  const handleClick = () => {
    if (!currentAd) return;
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-ad-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ad_id: currentAd.id, event_type: 'click' }),
    }).catch(() => {}); // Silent fail
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
