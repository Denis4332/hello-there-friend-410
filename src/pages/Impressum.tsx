import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import DOMPurify from 'dompurify';

const Impressum = () => {
  const { getSetting } = useSiteSettingsContext();

  const title = getSetting('impressum_title');
  const seoTitle = getSetting('seo_impressum_title');
  const seoDescription = getSetting('seo_impressum_description');
  
  // Betreiberin / Anbieterin
  const companyName = getSetting('impressum_company_name');
  const address = getSetting('impressum_address');
  
  // Kontakt
  const email = getSetting('impressum_email');
  const phone = getSetting('impressum_phone');
  
  // Rechtliche Angaben
  const uid = getSetting('impressum_uid');
  const register = getSetting('impressum_register');
  const representation = getSetting('impressum_representation');
  
  // Weitere Sektionen
  const websitePurpose = getSetting('impressum_website_purpose');
  const hostingInfo = getSetting('impressum_hosting_info');
  const copyrightLiability = getSetting('impressum_copyright_liability');

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={seoTitle || title || 'Impressum'}
        description={seoDescription || 'Impressum und rechtliche Informationen'}
      />
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{title || 'Impressum'}</h1>
        
        <div className="prose prose-sm max-w-none space-y-8">
          {/* Betreiberin / Anbieterin */}
          {companyName && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Betreiberin / Anbieterin</h2>
              <p className="text-muted-foreground font-medium">{companyName}</p>
              {address && (
                <p className="text-muted-foreground whitespace-pre-line">{address}</p>
              )}
            </section>
          )}

          {/* Kontakt */}
          {(email || phone) && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
              {email && <p className="text-muted-foreground">E-Mail: {email}</p>}
              {phone && <p className="text-muted-foreground">Telefon: {phone}</p>}
            </section>
          )}

          {/* Rechtliche Angaben */}
          {(uid || register || representation) && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Rechtliche Angaben</h2>
              {uid && <p className="text-muted-foreground">UID: {uid}</p>}
              {register && <p className="text-muted-foreground">Handelsregister-Nr.: {register}</p>}
              {representation && <p className="text-muted-foreground">Vertretung: {representation}</p>}
            </section>
          )}

          {/* Zweck der Website */}
          {websitePurpose && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Zweck der Website</h2>
              <p className="text-muted-foreground">{websitePurpose}</p>
            </section>
          )}

          {/* Hosting / Technischer Betrieb */}
          {hostingInfo && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Hosting / Technischer Betrieb</h2>
              <div 
                className="text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(hostingInfo) }}
              />
            </section>
          )}

          {/* Urheberrecht & Haftung */}
          {copyrightLiability && (
            <section>
              <h2 className="text-xl font-semibold mb-2">Urheberrecht & Haftung</h2>
              <p className="text-muted-foreground">{copyrightLiability}</p>
            </section>
          )}

          {/* Fallback wenn nichts konfiguriert */}
          {!companyName && !address && !email && !phone && !uid && (
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
