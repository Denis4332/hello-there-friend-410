import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

const AGB = () => {
  const { getSetting } = useSiteSettingsContext();

  const title = getSetting('legal_agb_title');
  const seoTitle = getSetting('seo_agb_title');
  const seoDescription = getSetting('seo_agb_description');
  const section1Title = getSetting('legal_agb_section1_title');
  const section1Content = getSetting('legal_agb_section1_content');
  const section2Title = getSetting('legal_agb_section2_title');
  const section2Content = getSetting('legal_agb_section2_content');
  const section3Title = getSetting('legal_agb_section3_title');
  const section3Content = getSetting('legal_agb_section3_content');
  const section4Title = getSetting('legal_agb_section4_title');
  const section4Content = getSetting('legal_agb_section4_content');
  const section5Title = getSetting('legal_agb_section5_title');
  const section5Content = getSetting('legal_agb_section5_content');

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={seoTitle || title || 'AGB'}
        description={seoDescription || 'Allgemeine Geschäftsbedingungen'}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">{title || 'Allgemeine Geschäftsbedingungen'}</h1>
          <div className="prose max-w-none space-y-4">
            {section1Title && (
              <>
                <h2 className="text-xl font-bold">{section1Title}</h2>
                <p>{section1Content}</p>
              </>
            )}

            {section2Title && (
              <>
                <h2 className="text-xl font-bold">{section2Title}</h2>
                <p>{section2Content}</p>
              </>
            )}

            {section3Title && (
              <>
                <h2 className="text-xl font-bold">{section3Title}</h2>
                <p>{section3Content}</p>
              </>
            )}

            {section4Title && (
              <>
                <h2 className="text-xl font-bold">{section4Title}</h2>
                <p>{section4Content}</p>
              </>
            )}

            {section5Title && (
              <>
                <h2 className="text-xl font-bold">{section5Title}</h2>
                <p>{section5Content}</p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AGB;