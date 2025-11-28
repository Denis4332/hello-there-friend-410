import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const AGB = () => {
  const { data: title } = useSiteSetting('legal_agb_title');
  const { data: seoTitle } = useSiteSetting('seo_agb_title');
  const { data: seoDescription } = useSiteSetting('seo_agb_description');
  const { data: section1Title } = useSiteSetting('legal_agb_section1_title');
  const { data: section1Content } = useSiteSetting('legal_agb_section1_content');
  const { data: section2Title } = useSiteSetting('legal_agb_section2_title');
  const { data: section2Content } = useSiteSetting('legal_agb_section2_content');
  const { data: section3Title } = useSiteSetting('legal_agb_section3_title');
  const { data: section3Content } = useSiteSetting('legal_agb_section3_content');
  const { data: section4Title } = useSiteSetting('legal_agb_section4_title');
  const { data: section4Content } = useSiteSetting('legal_agb_section4_content');
  const { data: section5Title } = useSiteSetting('legal_agb_section5_title');
  const { data: section5Content } = useSiteSetting('legal_agb_section5_content');

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
