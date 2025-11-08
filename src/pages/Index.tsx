import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useFeaturedProfiles } from '@/hooks/useProfiles';
import { useCategories } from '@/hooks/useCategories';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { useDesignSettings } from '@/hooks/useDesignSettings';
import { useCantons } from '@/hooks/useCitiesByCantonSlim';
import { SEO } from '@/components/SEO';
import { BannerDisplay } from '@/components/BannerDisplay';
import { AdvertisementCTA } from '@/components/AdvertisementCTA';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProfilesSection } from '@/components/home/FeaturedProfilesSection';

const Index = () => {
  useDesignSettings();
  
  const { data: featuredProfiles = [], isLoading: loadingProfiles } = useFeaturedProfiles(8);
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

        <FeaturedProfilesSection
          profiles={featuredProfiles}
          isLoading={loadingProfiles}
          title={featuredProfilesTitle}
          noProfilesText={noProfilesText}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
