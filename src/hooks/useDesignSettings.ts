import { useEffect } from 'react';
import { useSiteSetting } from './useSiteSettings';

export const useDesignSettings = () => {
  const { data: primaryColor } = useSiteSetting('design_primary_color');
  const { data: secondaryColor } = useSiteSetting('design_secondary_color');
  const { data: accentColor } = useSiteSetting('design_accent_color');
  const { data: fontFamily } = useSiteSetting('design_font_family');
  const { data: borderRadius } = useSiteSetting('design_border_radius');

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
