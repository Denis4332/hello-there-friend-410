import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import DOMPurify from 'dompurify';

const AGB = () => {
  const { getSetting } = useSiteSettingsContext();

  const title = getSetting('legal_agb_title');
  const seoTitle = getSetting('seo_agb_title');
  const seoDescription = getSetting('seo_agb_description');
  const stand = getSetting('legal_agb_stand');
  const intro = getSetting('legal_agb_intro');

  // All 18 sections
  const sections = [
    { title: getSetting('legal_agb_section1_title'), content: getSetting('legal_agb_section1_content') },
    { title: getSetting('legal_agb_section2_title'), content: getSetting('legal_agb_section2_content') },
    { title: getSetting('legal_agb_section3_title'), content: getSetting('legal_agb_section3_content') },
    { title: getSetting('legal_agb_section4_title'), content: getSetting('legal_agb_section4_content') },
    { title: getSetting('legal_agb_section5_title'), content: getSetting('legal_agb_section5_content') },
    { title: getSetting('legal_agb_section6_title'), content: getSetting('legal_agb_section6_content') },
    { title: getSetting('legal_agb_section7_title'), content: getSetting('legal_agb_section7_content') },
    { title: getSetting('legal_agb_section8_title'), content: getSetting('legal_agb_section8_content') },
    { title: getSetting('legal_agb_section9_title'), content: getSetting('legal_agb_section9_content') },
    { title: getSetting('legal_agb_section10_title'), content: getSetting('legal_agb_section10_content') },
    { title: getSetting('legal_agb_section11_title'), content: getSetting('legal_agb_section11_content') },
    { title: getSetting('legal_agb_section12_title'), content: getSetting('legal_agb_section12_content') },
    { title: getSetting('legal_agb_section13_title'), content: getSetting('legal_agb_section13_content') },
    { title: getSetting('legal_agb_section14_title'), content: getSetting('legal_agb_section14_content') },
    { title: getSetting('legal_agb_section15_title'), content: getSetting('legal_agb_section15_content') },
    { title: getSetting('legal_agb_section16_title'), content: getSetting('legal_agb_section16_content') },
    { title: getSetting('legal_agb_section17_title'), content: getSetting('legal_agb_section17_content') },
    { title: getSetting('legal_agb_section18_title'), content: getSetting('legal_agb_section18_content') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={seoTitle || title || 'AGB'}
        description={seoDescription || 'Allgemeine Geschäftsbedingungen'}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">{title || 'Allgemeine Geschäftsbedingungen (AGB) für escoria.ch'}</h1>
          
          {stand && (
            <p className="text-muted-foreground mb-6">{stand}</p>
          )}

          {intro && (
            <div 
              className="bg-muted/50 rounded-lg p-4 mb-8 prose prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(intro) }}
            />
          )}

          <div className="border-t pt-6 space-y-8">
            {sections.map((section, index) => (
              section.title && (
                <section key={index} className="space-y-3">
                  <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                  {section.content && (
                    <div 
                      className="prose prose-sm max-w-none text-muted-foreground [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:text-foreground [&_strong]:font-medium"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.content) }}
                    />
                  )}
                </section>
              )
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AGB;
