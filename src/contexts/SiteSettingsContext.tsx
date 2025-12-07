import React, { createContext, useContext, ReactNode } from 'react';
import { useBatchSiteSettings, SiteSettingsMap } from '@/hooks/useBatchSiteSettings';

interface SiteSettingsContextType {
  settings: SiteSettingsMap;
  getSetting: (key: string, fallback?: string) => string;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const { settings, getSetting, isLoading } = useBatchSiteSettings();

  return (
    <SiteSettingsContext.Provider value={{ settings, getSetting, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

/**
 * Hook to access batch-loaded site settings.
 * Use getSetting(key, fallback) for individual values.
 */
export const useSiteSettingsContext = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettingsContext must be used within a SiteSettingsProvider');
  }
  return context;
};
