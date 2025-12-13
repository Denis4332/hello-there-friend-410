import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import DOMPurify from 'dompurify';

const Datenschutz = () => {
  const { getSetting } = useSiteSettingsContext();

  // SEO Settings
  const seoTitle = getSetting('seo_datenschutz_title', 'Datenschutz');
  const seoDescription = getSetting('seo_datenschutz_description', 'Datenschutzerklärung');

  // Hauptinfos
  const title = getSetting('legal_privacy_title', 'Datenschutzerklärung');
  const stand = getSetting('legal_privacy_stand', '');
  const intro = getSetting('legal_privacy_intro', '');
  const contact = getSetting('legal_privacy_contact', '');

  // Alle 13 Abschnitte
  const sections = Array.from({ length: 13 }, (_, i) => ({
    title: getSetting(`legal_privacy_section${i + 1}_title`, ''),
    content: getSetting(`legal_privacy_section${i + 1}_content`, ''),
  }));

  // Footer
  const responsible = getSetting('legal_privacy_responsible', '');
  const contactFooter = getSetting('legal_privacy_contact_footer', '');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={seoTitle} description={seoDescription} />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <article className="prose prose-lg max-w-none dark:prose-invert">
            {/* Titel und Stand */}
            <h1 className="text-3xl font-bold mb-2">{title}</h1>
            {stand && <p className="text-muted-foreground text-sm mb-6">{stand}</p>}

            {/* Intro */}
            {intro && <p className="mb-4">{intro}</p>}
            {contact && <p className="mb-8 text-muted-foreground">{contact}</p>}

            <hr className="my-8 border-border" />

            {/* Alle Abschnitte */}
            <div className="space-y-8">
              {sections.map((section, index) => (
                section.title && (
                  <section key={index}>
                    <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                    {section.content && (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_li]:text-foreground [&_p]:mb-3"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(section.content),
                        }}
                      />
                    )}
                  </section>
                )
              ))}
            </div>

            {/* Footer mit verantwortlicher Stelle */}
            {(responsible || contactFooter) && (
              <>
                <hr className="my-8 border-border" />
                <div className="text-sm text-muted-foreground space-y-1">
                  {responsible && <p><strong>Verantwortliche Stelle:</strong> {responsible}</p>}
                  {contactFooter && <p>{contactFooter}</p>}
                </div>
              </>
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Datenschutz;
