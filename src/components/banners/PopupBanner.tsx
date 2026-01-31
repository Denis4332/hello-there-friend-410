import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAdvertisement } from '@/hooks/useAdvertisements';
import { queueAdEvent } from '@/lib/adEventQueue';
import { Button } from '@/components/ui/button';
import { BannerCTA } from './BannerCTA';

const STORAGE_KEY_PREFIX = 'popup_shown_session_';
const DEMO_POPUP_KEY = 'demo_popup_shown_this_session';
const POPUP_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

// WHITELIST: Popup ONLY on these "browse" pages
const POPUP_ALLOWED_PATHS = ['/', '/suche', '/kantone', '/kategorien'];
const POPUP_ALLOWED_PREFIXES = ['/kategorie/', '/stadt/'];

export const PopupBanner = () => {
  const { ad, isLoading } = useAdvertisement('popup');
  const [isVisible, setIsVisible] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const impressionTracked = useRef(false);
  const location = useLocation();

  // Check if on allowed browse page
  const isPopupAllowedPage = 
    POPUP_ALLOWED_PATHS.includes(location.pathname) ||
    POPUP_ALLOWED_PREFIXES.some(prefix => location.pathname.startsWith(prefix));

  useEffect(() => {
    // No popups on non-allowed pages
    if (!isPopupAllowedPage) return;
    
    // Wait until loading finished
    if (isLoading) return;

    // Case 1: Real ad available
    if (ad) {
      const storageKey = `${STORAGE_KEY_PREFIX}${ad.id}`;
      const lastShown = localStorage.getItem(storageKey);
      
      // Check cooldown
      if (lastShown) {
        const timeSinceLastShown = Date.now() - new Date(lastShown).getTime();
        if (timeSinceLastShown < POPUP_COOLDOWN_MS) {
          return;
        }
      }
      
      const delay = ad.popup_delay_seconds || 5;
      
      const timer = setTimeout(() => {
        setShowPopup(true);
        setTimeout(() => setIsVisible(true), 100);
      }, delay * 1000);

      return () => clearTimeout(timer);
    }

    // Case 2: No real ads -> Demo popup after 5 seconds (once per session)
    const demoShown = sessionStorage.getItem(DEMO_POPUP_KEY);
    if (demoShown) return;

    const demoTimer = setTimeout(() => {
      setShowDemo(true);
      setTimeout(() => setIsVisible(true), 100);
      sessionStorage.setItem(DEMO_POPUP_KEY, 'true');
    }, 5000);

    return () => clearTimeout(demoTimer);
  }, [ad, isLoading, isPopupAllowedPage, location.pathname]);

  // Track impression
  useEffect(() => {
    if (!ad || !showPopup || impressionTracked.current) return;
    
    const timer = setTimeout(() => {
      queueAdEvent(ad.id, 'impression');
      impressionTracked.current = true;
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [ad, showPopup]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (ad) {
        const storageKey = `${STORAGE_KEY_PREFIX}${ad.id}`;
        localStorage.setItem(storageKey, new Date().toISOString());
      }
      setShowPopup(false);
      setShowDemo(false);
    }, 300);
  };

  const handleClick = () => {
    if (!ad) return;
    // Open link FIRST (synchronously) to prevent mobile popup blockers
    window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    // Track click in background
    queueAdEvent(ad.id, 'click');
  };

  // Demo popup
  if (showDemo && !showPopup) {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      >
        <div
          className={`relative w-[90vw] max-w-[300px] bg-background rounded-lg shadow-2xl transform transition-all duration-300 ${
            isVisible ? 'scale-100' : 'scale-95'
          }`}
          style={{ aspectRatio: '3/4' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/90 hover:bg-background h-10 w-10 rounded-full shadow-lg"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
          <BannerCTA position="popup" />
        </div>
      </div>
    );
  }

  // Real popup
  if (!showPopup || !ad) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-[90vw] max-w-[300px] bg-background rounded-lg shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
        style={{ aspectRatio: '3/4' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 md:top-4 md:right-4 z-10 bg-background/90 hover:bg-background h-10 w-10 rounded-full shadow-lg"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </Button>

        <div
          className="cursor-pointer rounded-lg overflow-hidden w-full h-full"
          onClick={handleClick}
        >
          <img
            src={ad.image_url}
            alt={ad.title}
            loading="lazy"
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
        </div>
      </div>
    </div>
  );
};
