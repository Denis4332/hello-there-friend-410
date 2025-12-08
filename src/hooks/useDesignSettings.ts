import { useEffect } from 'react';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

export const useDesignSettings = () => {
  const { getSetting } = useSiteSettingsContext();
  
  const primaryColor = getSetting('design_primary_color');
  const secondaryColor = getSetting('design_secondary_color');
  const accentColor = getSetting('design_accent_color');
  const fontFamily = getSetting('design_font_family');
  const borderRadius = getSetting('design_border_radius');

  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary', primaryColor);
    }
    if (secondaryColor) {
      document.documentElement.style.setProperty('--secondary', secondaryColor);
    }
    if (accentColor) {
      document.documentElement.style.setProperty('--accent', accentColor);
    }
    if (fontFamily) {
      document.documentElement.style.setProperty('--font-family', fontFamily);
    }
    if (borderRadius) {
      document.documentElement.style.setProperty('--radius', borderRadius);
    }
  }, [primaryColor, secondaryColor, accentColor, fontFamily, borderRadius]);

  return {
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
    borderRadius,
  };
};
