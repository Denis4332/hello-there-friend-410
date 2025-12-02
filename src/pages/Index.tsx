import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { lazy, Suspense, useMemo } from 'react';
import { useHomepageProfiles } from "@/hooks/useProfiles";
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { useCantons } from '@/hooks/useCitiesByCantonSlim';
import { SEO } from '@/components/SEO';
import { BannerDisplay } from '@/components/BannerDisplay';
import { HeroSection } from '@/components/home/HeroSection';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { sortProfilesByListingType } from '@/lib/profileUtils';
import { useRotationKey } from '@/hooks/useRotationKey';
import { useProfilesRealtime } from '@/hooks/useProfilesRealtime';

// Lazy load non-critical section
const FeaturedProfilesSection = lazy(() => import('@/components/home/FeaturedProfilesSection').then(m => ({ default: m.FeaturedProfilesSection })));

const Index = () => {
  useDesignSettings();
  useProfilesRealtime(); // Listen for realtime profile changes (admin approval)
  const rotationKey = useRotationKey(); // Auto-rotate every 30 minutes
  
  // SIMPLIFIED: Nur TOP-Ads schweizweit anzeigen auf Homepage
  const { 
    data: homepageData, 
    isLoading: isLoadingProfiles 
  } = useHomepageProfiles(100, 0, 0, null); // Alle TOP-Ads holen
  
  const topProfiles = homepageData?.topProfiles ?? [];
  
  const featuredProfiles = useMemo(() => {
    // Nur TOP-Ads anzeigen, sortiert mit Rotation
    return sortProfilesByListingType(topProfiles, rotationKey);
  }, [topProfiles, rotationKey]);
  
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
        title={siteTitle || "Verifizierte Profile in der Schweiz"}
        description={metaDescription || "Finde verifizierte Profile in deiner Nähe. Anbieter in Zürich, Bern, Basel und weiteren Schweizer Städten."}
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
