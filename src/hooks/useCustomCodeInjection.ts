import { useEffect } from 'react';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

/**
 * Hook to inject custom CSS and JavaScript from CMS settings.
 * ⚠️ SECURITY WARNING: Custom JS is executed via eval() - only admin should have access to these settings.
 */
export const useCustomCodeInjection = () => {
  const { getSetting } = useSiteSettingsContext();
  
  const customCss = getSetting('advanced_custom_css');
  const customJs = getSetting('advanced_custom_js');

  // Inject Custom CSS
  useEffect(() => {
    if (!customCss) return;

    const styleId = 'cms-custom-css';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.type = 'text/css';
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = customCss;

    return () => {
      // Don't remove on cleanup - we want it to persist
    };
  }, [customCss]);

  // Execute Custom JavaScript
  useEffect(() => {
    if (!customJs) return;

    try {
      // Create a function to execute the custom JS in a slightly safer context
      const executeCustomJs = new Function(customJs);
      executeCustomJs();
    } catch (error) {
      console.error('Error executing custom JavaScript from CMS:', error);
    }
  }, [customJs]);

  return {
    hasCustomCss: !!customCss,
    hasCustomJs: !!customJs,
  };
};
