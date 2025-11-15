import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { useTopProfiles, useLocalProfiles, useFeaturedProfiles } from '@/hooks/useProfiles';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { useCantons } from '@/hooks/useCitiesByCantonSlim';
import { SEO } from '@/components/SEO';
import { BannerDisplay } from '@/components/BannerDisplay';
import { AdvertisementCTA } from '@/components/AdvertisementCTA';
import { HeroSection } from '@/components/home/HeroSection';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { detectLocation } from '@/lib/geolocation';
import { sortProfilesByListingType } from '@/lib/profileUtils';

// Lazy load non-critical section
const FeaturedProfilesSection = lazy(() => import('@/components/home/FeaturedProfilesSection').then(m => ({ default: m.FeaturedProfilesSection })));

const Index = () => {
  useDesignSettings();
  
  const [userCanton, setUserCanton] = useState<string | null>(null);
  const [geoDetectionAttempted, setGeoDetectionAttempted] = useState(false);
  
  // Geo-Detection beim Mount
  useEffect(() => {
    detectLocation()
      .then(location => {
        setUserCanton(location.canton);
        setGeoDetectionAttempted(true);
      })
      .catch(() => {
        setGeoDetectionAttempted(true);
      });
  }, []);
  
  // OPTION A: 3 TOP schweizweit + 5 Premium/Basic lokal
  const { data: topProfiles = [], isLoading: loadingTop } = useTopProfiles(3);
  const { data: localProfiles = [], isLoading: loadingLocal } = useLocalProfiles(userCanton, 5);
  const { data: fallbackProfiles = [], isLoading: loadingFallback } = useFeaturedProfiles(8);
  
  // Merge und sortiere Profile
  const featuredProfiles = useMemo(() => {
    if (!geoDetectionAttempted) return [];
    
    // Wenn Geo-Detection erfolgreich: TOP + Local
    if (userCanton && localProfiles.length > 0) {
      const combined = [...topProfiles, ...localProfiles];
      return sortProfilesByListingType(combined);
    }
    
    // Fallback: Alle schweizweit
    return sortProfilesByListingType(fallbackProfiles);
  }, [geoDetectionAttempted, userCanton, topProfiles, localProfiles, fallbackProfiles]);
  
  const loadingProfiles = !geoDetectionAttempted || loadingTop || loadingLocal || loadingFallback;
  
  const { data: categories = [] } = useCategories();
  const { data: cantons = [] } = useCantons();
  
  const { data: siteTitle } = useSiteSetting('site_title');
  const { data: heroSubtitle } = useSiteSetting('hero_subtitle');
  const { data: searchKeywordPlaceholder } = useSiteSetting('search_keyword_placeholder');
  const { data: searchButtonText } = useSiteSetting('search_button_text');
  const { data: metaDescription } = useSiteSetting('meta_description');
  const { data: heroImageUrl } = useSiteSetting('design_hero_image_url');
  const { data: heroOverlayOpacity } = useSiteSetting('design_hero_overlay_opacity');
  const { data: featuredProfilesTitle } = useSiteSetting('home_featured_profiles_title');
  const { data: noProfilesText } = useSiteSetting('home_no_profiles_text');

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={siteTitle || "Verifizierte Anbieter in der Schweiz"}
        description={metaDescription || "Finde verifizierte Begleitservice-Anbieter in deiner Nähe. Escort Services in Zürich, Bern, Basel und weiteren Schweizer Städten."}
        url="https://escoria.ch"
      />
      <Header />
      <main className="flex-1">
        <HeroSection
          siteTitle={siteTitle}
          heroSubtitle={heroSubtitle}
          searchKeywordPlaceholder={searchKeywordPlaceholder}
          searchButtonText={searchButtonText}
          heroImageUrl={heroImageUrl}
          heroOverlayOpacity={heroOverlayOpacity}
          cantons={cantons}
          categories={categories}
        />

        <BannerDisplay position="top" className="container mx-auto px-4 py-8" />

        <Suspense fallback={
          <section className="py-12 bg-muted">
            <div className="container mx-auto px-4">
              <div className="h-8 bg-muted-foreground/20 rounded w-1/4 mb-6 animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProfileCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </section>
        }>
          <FeaturedProfilesSection
            profiles={featuredProfiles}
            isLoading={loadingProfiles}
            title={featuredProfilesTitle}
            noProfilesText={noProfilesText}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
