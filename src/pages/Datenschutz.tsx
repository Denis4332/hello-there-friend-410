import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const Datenschutz = () => {
  // SEO Settings
  const { data: seoTitle } = useSiteSetting('seo_datenschutz_title');
  const { data: seoDescription } = useSiteSetting('seo_datenschutz_description');
  
  // Section 1 - Verantwortliche Stelle
  const { data: title } = useSiteSetting('legal_privacy_title');
  const { data: intro } = useSiteSetting('legal_privacy_intro');
  const { data: section1Title } = useSiteSetting('legal_privacy_section1_title');
  const { data: section1Content } = useSiteSetting('legal_privacy_section1_content');
  const { data: contactInfo } = useSiteSetting('legal_privacy_contact');

  // Section 2 - Art der verarbeiteten Daten
  const { data: section2Title } = useSiteSetting('legal_privacy_section2_title');
  const { data: section2Content } = useSiteSetting('legal_privacy_section2_content');

  // Section 3 - Zweck und Rechtsgrundlage
  const { data: section3Title } = useSiteSetting('legal_privacy_section3_title');
  const { data: section3Content } = useSiteSetting('legal_privacy_section3_content');

  // Section 4 - Speicherdauer
  const { data: section4Title } = useSiteSetting('legal_privacy_section4_title');
  const { data: section4Content } = useSiteSetting('legal_privacy_section4_content');

  // Section 5 - Weitergabe von Daten
  const { data: section5Title } = useSiteSetting('legal_privacy_section5_title');
  const { data: section5Content } = useSiteSetting('legal_privacy_section5_content');

  // Section 6 - Ihre Rechte
  const { data: section6Title } = useSiteSetting('legal_privacy_section6_title');
  const { data: section6Content } = useSiteSetting('legal_privacy_section6_content');

  // Section 7 - Datensicherheit
  const { data: section7Title } = useSiteSetting('legal_privacy_section7_title');
  const { data: section7Content } = useSiteSetting('legal_privacy_section7_content');

  // Section 8 - Zahlungsdaten
  const { data: section8Title } = useSiteSetting('legal_privacy_section8_title');
  const { data: section8Content } = useSiteSetting('legal_privacy_section8_content');

  // Section 9 - Cookies und Tracking
  const { data: section9Title } = useSiteSetting('legal_privacy_section9_title');
  const { data: section9Content } = useSiteSetting('legal_privacy_section9_content');

  // Section 10 - Profilsichtbarkeit
  const { data: section10Title } = useSiteSetting('legal_privacy_section10_title');
  const { data: section10Content } = useSiteSetting('legal_privacy_section10_content');

  // Section 11 - Beschwerderecht
  const { data: section11Title } = useSiteSetting('legal_privacy_section11_title');
  const { data: section11Content } = useSiteSetting('legal_privacy_section11_content');

  // Section 12 - Änderungen
  const { data: section12Title } = useSiteSetting('legal_privacy_section12_title');
  const { data: section12Content } = useSiteSetting('legal_privacy_section12_content');

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title={seoTitle || title || 'Datenschutz'}
        description={seoDescription || 'Datenschutzerklärung - Erfahre wie wir deine Daten schützen.'}
      />
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">{title || 'Datenschutzerklärung'}</h1>
          <div className="prose max-w-none space-y-6">
            <p className="text-lg text-muted-foreground">
              {intro || 'ESCORIA nimmt den Schutz Ihrer persönlichen Daten sehr ernst. Diese Datenschutzerklärung informiert Sie umfassend über die Verarbeitung Ihrer personenbezogenen Daten gemäss dem schweizerischen Datenschutzgesetz (DSG) und der EU-Datenschutz-Grundverordnung (DSGVO).'}
            </p>

            {/* Section 1 */}
            <h2 className="text-2xl font-bold mt-8">{section1Title || '1. Verantwortliche Stelle'}</h2>
            <p>
              {section1Content || 'Verantwortlich für die Datenverarbeitung auf dieser Website ist ESCORIA. Kontaktdaten finden Sie in unserem Impressum.'}
            </p>

            {/* Section 2 */}
            <h2 className="text-2xl font-bold mt-8">{section2Title || '2. Art der verarbeiteten Daten'}</h2>
            <div 
              className="prose-content"
              dangerouslySetInnerHTML={{ 
                __html: section2Content || `<p>Wir verarbeiten folgende Kategorien personenbezogener Daten:</p>
<ul>
<li><strong>Profilinformationen:</strong> Anzeigename, Alter, Geschlecht, Standort (Stadt, Kanton, Postleitzahl), GPS-Koordinaten, Sprachen, Beschreibungstext</li>
<li><strong>Kontaktdaten (optional):</strong> Telefonnummer, WhatsApp, E-Mail, Website, Instagram, Telegram, Strassenadresse</li>
<li><strong>Medieninhalte:</strong> Hochgeladene Fotos und Profilbilder</li>
<li><strong>Technische Daten:</strong> IP-Adresse, Browser-Typ, Gerätetyp, Betriebssystem, Zugriffszeitpunkt</li>
<li><strong>Nutzungsstatistiken:</strong> Profilaufrufe, Suchhistorie, Kontaktanfragen, Session-IDs, Referrer-URLs</li>
<li><strong>Authentifizierungsdaten:</strong> E-Mail-Adresse, verschlüsseltes Passwort, Login-Zeitstempel</li>
<li><strong>Zahlungsinformationen:</strong> Transaktions-IDs von Payment-Providern (keine vollständigen Zahlungsdaten)</li>
</ul>` 
              }} 
            />

            {/* Section 3 */}
            <h2 className="text-2xl font-bold mt-8">{section3Title || '3. Zweck und Rechtsgrundlage der Datenverarbeitung'}</h2>
            <div 
              className="prose-content"
              dangerouslySetInnerHTML={{ 
                __html: section3Content || `<p>Die Verarbeitung Ihrer Daten erfolgt zu folgenden Zwecken:</p>
<ul>
<li><strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> Erstellung und Verwaltung Ihres Profils, Bereitstellung der Plattform-Funktionen</li>
<li><strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> Sicherstellung der Plattform-Sicherheit, Betrugsbekämpfung, Analyse und Optimierung der Nutzererfahrung</li>
<li><strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):</strong> Erfüllung gesetzlicher Aufbewahrungspflichten</li>
<li><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Verwendung von optionalen Cookies und Tracking-Tools (nur nach ausdrücklicher Zustimmung)</li>
</ul>` 
              }} 
            />

            {/* Section 4 */}
            <h2 className="text-2xl font-bold mt-8">{section4Title || '4. Speicherdauer'}</h2>
            <p>
              {section4Content || 'Ihre Daten werden gespeichert, solange Ihr Account aktiv ist. Nach Löschung Ihres Accounts werden alle personenbezogenen Daten innerhalb von 30 Tagen vollständig entfernt. Ausnahme: Daten, die aus rechtlichen Gründen länger aufbewahrt werden müssen (z.B. für Abrechnungszwecke), werden nach Ablauf der gesetzlichen Aufbewahrungsfristen gelöscht.'}
            </p>

            {/* Section 5 */}
            <h2 className="text-2xl font-bold mt-8">{section5Title || '5. Weitergabe von Daten'}</h2>
            <div 
              className="prose-content"
              dangerouslySetInnerHTML={{ 
                __html: section5Content || `<p>Eine Weitergabe Ihrer Daten an Dritte erfolgt <strong>nicht</strong>, ausser in folgenden Fällen:</p>
<ul>
<li>Sie haben ausdrücklich eingewilligt (Art. 6 Abs. 1 lit. a DSGVO)</li>
<li>Die Weitergabe ist zur Vertragserfüllung erforderlich (z.B. Payment-Provider)</li>
<li>Eine gesetzliche Verpflichtung besteht (z.B. behördliche Anfragen)</li>
</ul>` 
              }} 
            />

            {/* Section 6 */}
            <h2 className="text-2xl font-bold mt-8">{section6Title || '6. Ihre Rechte (DSGVO-konforme Auskunft)'}</h2>
            <div 
              className="prose-content"
              dangerouslySetInnerHTML={{ 
                __html: section6Content || `<p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
<div class="bg-muted/50 p-4 rounded-lg space-y-4">
<div>
<h3 class="font-bold">✓ Auskunftsrecht (Art. 15 DSGVO)</h3>
<p class="text-sm">Sie können jederzeit Auskunft über die zu Ihrer Person gespeicherten Daten erhalten.</p>
</div>
<div>
<h3 class="font-bold">✓ Recht auf Datenexport (Art. 20 DSGVO - Datenportabilität)</h3>
<p class="text-sm">Sie können alle Ihre Daten in einem strukturierten, maschinenlesbaren Format exportieren.</p>
</div>
<div>
<h3 class="font-bold">✓ Recht auf Löschung (Art. 17 DSGVO - "Recht auf Vergessenwerden")</h3>
<p class="text-sm">Sie können Ihren Account und alle zugehörigen Daten jederzeit vollständig löschen lassen.</p>
</div>
<div>
<h3 class="font-bold">✓ Recht auf Berichtigung (Art. 16 DSGVO)</h3>
<p class="text-sm">Sie können fehlerhafte oder unvollständige Daten jederzeit korrigieren.</p>
</div>
<div>
<h3 class="font-bold">✓ Widerspruchsrecht (Art. 21 DSGVO)</h3>
<p class="text-sm">Sie können der Verarbeitung Ihrer Daten jederzeit widersprechen.</p>
</div>
<div>
<h3 class="font-bold">✓ Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</h3>
<p class="text-sm">Sie können die Verarbeitung Ihrer Daten unter bestimmten Voraussetzungen einschränken lassen.</p>
</div>
</div>` 
              }} 
            />
            <p className="mt-4">
              <strong>Kontakt für Datenschutzanfragen:</strong> {contactInfo || 'Bitte richten Sie alle Anfragen an die im Impressum genannte E-Mail-Adresse.'}
            </p>

            {/* Section 7 */}
            <h2 className="text-2xl font-bold mt-8">{section7Title || '7. Datensicherheit'}</h2>
            <div 
              className="prose-content"
              dangerouslySetInnerHTML={{ 
                __html: section7Content || `<p>Wir setzen umfassende Sicherheitsmaßnahmen zum Schutz Ihrer Daten ein:</p>
<ul>
<li><strong>SSL/TLS-Verschlüsselung:</strong> Alle Datenübertragungen erfolgen verschlüsselt über HTTPS</li>
<li><strong>Passwort-Sicherheit:</strong> Passwörter werden mit modernen Hashing-Algorithmen (bcrypt) gespeichert</li>
<li><strong>Leaked Password Protection:</strong> Automatische Prüfung gegen bekannte kompromittierte Passwörter</li>
<li><strong>Rate Limiting:</strong> Schutz vor Brute-Force-Angriffen durch Zugriffsbeschränkungen</li>
<li><strong>Row Level Security (RLS):</strong> Datenbankzugriff wird auf Benutzerebene kontrolliert</li>
<li><strong>Regelmäßige Security Audits:</strong> Kontinuierliche Überprüfung und Aktualisierung der Sicherheitsmaßnahmen</li>
</ul>` 
              }} 
            />

            {/* Section 8 */}
            <h2 className="text-2xl font-bold mt-8">{section8Title || '8. Zahlungsdaten'}</h2>
            <p>
              {section8Content || 'Zahlungsdaten werden ausschliesslich über zertifizierte, PCI-DSS-konforme Payment-Provider (z.B. Stripe) verarbeitet. ESCORIA speichert keine vollständigen Kreditkarten- oder Bankdaten. Wir erhalten lediglich eine Transaktions-ID zur Zuordnung der Zahlung. Alle Transaktionen erfolgen verschlüsselt nach aktuellem Sicherheitsstandard (TLS 1.3).'}
            </p>

            {/* Section 9 */}
            <h2 className="text-2xl font-bold mt-8">{section9Title || '9. Cookies und Tracking'}</h2>
            <div 
              className="prose-content"
              dangerouslySetInnerHTML={{ 
                __html: section9Content || `<p>Wir verwenden folgende Arten von Cookies:</p>
<div class="space-y-3">
<div>
<h3 class="font-semibold">Technisch notwendige Cookies (immer aktiv)</h3>
<p class="text-sm text-muted-foreground">Diese Cookies sind für die Basisfunktionalität der Website erforderlich: Session-Cookie für Login-Status, LocalStorage für Auth-Token und Session-Verwaltung, Präferenz-Cookies (z.B. Spracheinstellung)</p>
</div>
<div>
<h3 class="font-semibold">Optionale Cookies (nur mit Zustimmung)</h3>
<p class="text-sm text-muted-foreground">Tracking-Tools und Analyse-Cookies werden nur mit Ihrer ausdrücklichen Zustimmung aktiviert.</p>
</div>
<div>
<h3 class="font-semibold">Kein Third-Party-Tracking</h3>
<p class="text-sm text-muted-foreground">ESCORIA verwendet keine Marketing-Cookies oder Third-Party-Tracker ohne Ihre ausdrückliche Zustimmung.</p>
</div>
</div>` 
              }} 
            />

            {/* Section 10 */}
            <h2 className="text-2xl font-bold mt-8">{section10Title || '10. Profilsichtbarkeit'}</h2>
            <div 
              className="prose-content"
              dangerouslySetInnerHTML={{ 
                __html: section10Content || `<p>Ihr Profil ist nach Freischaltung durch unser Moderationsteam öffentlich einsehbar. Folgende Daten sind für alle Besucher sichtbar:</p>
<ul>
<li>Anzeigename, Alter, Standort (Stadt, Kanton)</li>
<li>Profilfotos und Beschreibungstext</li>
<li>Von Ihnen freigegebene Kontaktdaten (optional)</li>
<li>Kategorien und Sprachen</li>
</ul>
<p><strong>Ihre E-Mail-Adresse</strong> (Login) ist <strong>niemals</strong> öffentlich sichtbar.</p>` 
              }} 
            />

            {/* Section 11 */}
            <h2 className="text-2xl font-bold mt-8">{section11Title || '11. Beschwerderecht bei Aufsichtsbehörde'}</h2>
            <div 
              className="prose-content"
              dangerouslySetInnerHTML={{ 
                __html: section11Content || `<p>Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren.</p>
<p class="text-sm text-muted-foreground mt-2"><strong>Schweiz:</strong> Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB)<br/><strong>EU:</strong> Zuständige Aufsichtsbehörde Ihres Aufenthaltslandes</p>` 
              }} 
            />

            {/* Section 12 */}
            <h2 className="text-2xl font-bold mt-8">{section12Title || '12. Änderungen dieser Datenschutzerklärung'}</h2>
            <p>
              {section12Content || 'Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie an geänderte Rechtslage oder Änderungen unserer Dienste anzupassen. Die aktuelle Version finden Sie stets auf dieser Seite.'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Letzte Aktualisierung:</strong> {new Date().toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Datenschutz;
