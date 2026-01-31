import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { lazy, Suspense, useState, useEffect } from 'react';
import { useHomepageProfiles } from "@/hooks/useProfiles";
import { useCategories } from '@/hooks/useCategories';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { useCantons } from '@/hooks/useCitiesByCantonSlim';
import { SEO } from '@/components/SEO';
import { HeroSection } from '@/components/home/HeroSection';
import { ProfileCardSkeleton } from '@/components/ProfileCardSkeleton';
import { useRotationKey } from '@/hooks/useRotationKey';

// Lazy load non-critical section
const FeaturedProfilesSection = lazy(() => import('@/components/home/FeaturedProfilesSection').then(m => ({ default: m.FeaturedProfilesSection })));

const PROFILES_PER_PAGE = 24;

const Index = () => {
  useDesignSettings();
  const rotationKey = useRotationKey();
  const [currentPage, setCurrentPage] = useState(1);
  
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
  
  // Server-side pagination mit Rotation
  const { 
    data: homepageData, 
    isLoading: isLoadingProfiles 
  } = useHomepageProfiles(currentPage, PROFILES_PER_PAGE, rotationKey);
  
  const profiles = homepageData?.profiles ?? [];
  const totalCount = homepageData?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PROFILES_PER_PAGE);
  
  // Bei Rotation-Änderung zurück auf Seite 1
  useEffect(() => {
    setCurrentPage(1);
  }, [rotationKey]);
  
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

        <Suspense fallback={
          <section className="py-12 bg-muted">
            <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
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
            profiles={profiles}
            isLoading={isLoadingProfiles}
            title={featuredProfilesTitle}
            noProfilesText={noProfilesText}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
