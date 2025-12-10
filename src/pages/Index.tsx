import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { lazy, Suspense, useMemo } from 'react';
import { useHomepageProfiles } from "@/hooks/useProfiles";
import { useCategories } from '@/hooks/useCategories';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { useCantons } from '@/hooks/useCitiesByCantonSlim';
import { SEO } from '@/components/SEO';
import { BannerDisplay } from '@/components/BannerDisplay';
import { HeroSection } from '@/components/home/HeroSection';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { sortProfilesByListingType } from '@/lib/profileUtils';
import { useRotationKey } from '@/hooks/useRotationKey';
// Realtime hooks removed for performance - React Query cache (5-15min) is sufficient

// Lazy load non-critical section
const FeaturedProfilesSection = lazy(() => import('@/components/home/FeaturedProfilesSection').then(m => ({ default: m.FeaturedProfilesSection })));

const Index = () => {
  useDesignSettings();
  // Realtime hooks removed - unnecessary WebSocket connections hurt performance
  const rotationKey = useRotationKey();
  
  // Single batch load instead of 9 individual API calls
  const { getSetting } = useSiteSettingsContext();
  
  const siteTitle = getSetting('site_title', 'Verifizierte Profile in der Schweiz');
  const heroSubtitle = getSetting('hero_subtitle');
  const searchKeywordPlaceholder = getSetting('search_keyword_placeholder');
  const searchButtonText = getSetting('search_button_text');
  const metaDescription = getSetting('meta_description', 'Finde verifizierte Profile in deiner Nähe. Anbieter in Zürich, Bern, Basel und weiteren Schweizer Städten.');
  const heroImageUrl = getSetting('design_hero_image_url');
  const heroOverlayOpacity = getSetting('design_hero_overlay_opacity');
  const featuredProfilesTitle = getSetting('home_featured_profiles_title');
  const noProfilesText = getSetting('home_no_profiles_text');
  
  const { 
    data: homepageData, 
    isLoading: isLoadingProfiles 
  } = useHomepageProfiles(100, 0, 0, null);
  
  const topProfiles = homepageData?.topProfiles ?? [];
  
  const featuredProfiles = useMemo(() => {
    return sortProfilesByListingType(topProfiles, rotationKey);
  }, [topProfiles, rotationKey]);
  
  const { data: categories = [] } = useCategories();
  const { data: cantons = [] } = useCantons();

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={siteTitle}
        description={metaDescription}
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

        <BannerDisplay position="top" className="container mx-auto px-4 py-4" />

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
            isLoading={isLoadingProfiles}
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
