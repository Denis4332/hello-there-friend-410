import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PopupBanner } from './PopupBanner';
import { DemoPopupBanner } from './DemoPopupBanner';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { Advertisement } from '@/types/advertisement';

const STORAGE_KEY_PREFIX = 'banner_shown_';
const DEMO_POPUP_KEY = 'demo_popup_last_shown';
const SESSION_KEY = 'demo_popup_shown_this_session';
const NEVER_SHOW_KEY = 'demo_popup_never_show';
const MIN_INTERVAL = 30 * 60 * 1000; // 30 Minuten in Millisekunden

export const BannerManager = () => {
  const { data: popupAds } = useAdvertisements('popup');
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const [adRotationTrigger, setAdRotationTrigger] = useState(0);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [exitIntentTriggered, setExitIntentTriggered] = useState(false);
  const location = useLocation();

  // Reset Pop-up bei Route-Wechsel
  useEffect(() => {
    setCurrentAd(null);
    setShowDemoPopup(false);
    setExitIntentTriggered(false);
    setAdRotationTrigger(prev => prev + 1);
  }, [location.pathname]);

  // Exit-Intent Detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // User will Seite verlassen (Maus geht nach oben raus)
      if (e.clientY <= 0 && !exitIntentTriggered) {
        setExitIntentTriggered(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [exitIntentTriggered]);

  // Scroll Detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollPercentage(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial berechnen
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // WICHTIG: Kein Pop-up auf Banner-Preis-Seite anzeigen
    if (location.pathname === '/bannerpreise') {
      return;
    }

    // Check ob User "Nie mehr anzeigen" geklickt hat
    const neverShow = localStorage.getItem(NEVER_SHOW_KEY);
    if (neverShow === 'true') {
      return;
    }

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

    // Fall 2: Keine echten Ads → Demo-Popup mit intelligentem Timing
    const isNewSession = !sessionStorage.getItem(SESSION_KEY);
    const lastShown = localStorage.getItem(DEMO_POPUP_KEY);

    // REGEL 1: Neue Session → intelligentes Timing
    // REGEL 2: Gleiche Session → nur nach 30 Min
    const timeBasedShouldShow = isNewSession || 
      (!lastShown || (new Date().getTime() - new Date(lastShown).getTime()) > MIN_INTERVAL);

    if (!timeBasedShouldShow) return;

    // INTELLIGENTES TIMING:
    // 1. Exit-Intent = SOFORT zeigen
    if (exitIntentTriggered) {
      setShowDemoPopup(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
      return;
    }

    // 2. Scroll-basiert (50% gescrollt) = nach 3 Sekunden zeigen
    if (scrollPercentage >= 50) {
      const scrollTimer = setTimeout(() => {
        setShowDemoPopup(true);
        sessionStorage.setItem(SESSION_KEY, 'true');
      }, 3000);
      return () => clearTimeout(scrollTimer);
    }

    // 3. Zeit-basiert als Fallback = nach 10 Sekunden zeigen
    const fallbackTimer = setTimeout(() => {
      setShowDemoPopup(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
    }, 10000);
    return () => clearTimeout(fallbackTimer);

  }, [popupAds, adRotationTrigger, exitIntentTriggered, scrollPercentage]);

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
