import { useEffect } from 'react';
import { useSiteSetting } from './useSiteSettings';

export const useDesignSettings = () => {
  const { data: primaryColor } = useSiteSetting('design_primary_color');
  const { data: secondaryColor } = useSiteSetting('design_secondary_color');
  const { data: accentColor } = useSiteSetting('design_accent_color');

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
  }, [primaryColor, secondaryColor, accentColor]);

  return {
    primaryColor,
    secondaryColor,
    accentColor,
  };
};
