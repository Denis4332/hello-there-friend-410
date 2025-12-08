import { useEffect } from 'react';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

/**
 * Hook to dynamically set favicon from CMS settings.
 * Supports .ico, .png, .svg, and other image formats.
 */
export const useFaviconSetting = () => {
  const { getSetting } = useSiteSettingsContext();
  
  const faviconUrl = getSetting('design_favicon_url');

  useEffect(() => {
    if (!faviconUrl) return;

    // Find existing favicon link or create new one
    let linkElement = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;

    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.rel = 'icon';
      document.head.appendChild(linkElement);
    }

    // Determine type based on URL extension
    const extension = faviconUrl.split('.').pop()?.toLowerCase();
    let type = 'image/x-icon';
    
    if (extension === 'png') {
      type = 'image/png';
    } else if (extension === 'svg') {
      type = 'image/svg+xml';
    } else if (extension === 'gif') {
      type = 'image/gif';
    } else if (extension === 'webp') {
      type = 'image/webp';
    }

    linkElement.type = type;
    linkElement.href = faviconUrl;

    // Also update apple-touch-icon if it exists
    const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (appleTouchIcon && (extension === 'png' || extension === 'svg')) {
      appleTouchIcon.href = faviconUrl;
    }
  }, [faviconUrl]);

  return { faviconUrl };
};
