import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';

const Impressum = () => {
  const { getSetting } = useSiteSettingsContext();

  const title = getSetting('impressum_title');
  const seoTitle = getSetting('seo_impressum_title');
  const seoDescription = getSetting('seo_impressum_description');
  const operatorNote = getSetting('impressum_operator_note');
  const companyName = getSetting('impressum_company_name');
  const address = getSetting('impressum_address');
  const email = getSetting('impressum_email');
  const phone = getSetting('impressum_phone');
  const additionalInfo = getSetting('impressum_additional_info');

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={seoTitle || title || 'Impressum'}
        description={seoDescription || 'Impressum und rechtliche Informationen'}
      />
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{title || 'Impressum'}</h1>
        
        <div className="prose prose-sm max-w-none space-y-6">
          {operatorNote && (
            <p className="text-muted-foreground font-medium bg-muted/50 p-4 rounded-lg">
              {operatorNote}
            </p>
          )}

          {companyName && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Angaben gemäss Schweizer Recht</h2>
              <p className="text-muted-foreground whitespace-pre-line">{companyName}</p>
            </section>
          )}

          {address && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Adresse</h2>
              <p className="text-muted-foreground whitespace-pre-line">{address}</p>
            </section>
          )}

          {(email || phone) && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
              {email && <p className="text-muted-foreground">E-Mail: {email}</p>}
              {phone && <p className="text-muted-foreground">Telefon: {phone}</p>}
            </section>
          )}

          {additionalInfo && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Weitere Informationen</h2>
              <div 
                className="text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: additionalInfo }}
              />
            </section>
          )}

          {!companyName && !address && !email && !phone && !additionalInfo && (
            <p className="text-muted-foreground">
              Impressum-Inhalt wird vom Administrator gepflegt.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Impressum;