import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const Datenschutz = () => {
  const { data: title } = useSiteSetting('legal_privacy_title');
  const { data: intro } = useSiteSetting('legal_privacy_intro');
  const { data: section1Title } = useSiteSetting('legal_privacy_section1_title');
  const { data: section1Content } = useSiteSetting('legal_privacy_section1_content');
  const { data: contactInfo } = useSiteSetting('legal_privacy_contact');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">{title || 'Datenschutzerklärung'}</h1>
          <div className="prose max-w-none space-y-6">
            <p className="text-lg text-muted-foreground">
              {intro || 'ESCORIA nimmt den Schutz Ihrer persönlichen Daten sehr ernst. Diese Datenschutzerklärung informiert Sie umfassend über die Verarbeitung Ihrer personenbezogenen Daten gemäss dem schweizerischen Datenschutzgesetz (DSG) und der EU-Datenschutz-Grundverordnung (DSGVO).'}
            </p>

            <h2 className="text-2xl font-bold mt-8">{section1Title || '1. Verantwortliche Stelle'}</h2>
            <p>
              {section1Content || 'Verantwortlich für die Datenverarbeitung auf dieser Website ist ESCORIA. Kontaktdaten finden Sie in unserem Impressum.'}
            </p>

            <h2 className="text-2xl font-bold mt-8">2. Art der verarbeiteten Daten</h2>
            <p>Wir verarbeiten folgende Kategorien personenbezogener Daten:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Profilinformationen:</strong> Anzeigename, Alter, Geschlecht, Standort (Stadt, Kanton, Postleitzahl), GPS-Koordinaten, Sprachen, Beschreibungstext</li>
              <li><strong>Kontaktdaten (optional):</strong> Telefonnummer, WhatsApp, E-Mail, Website, Instagram, Telegram, Strassenadresse</li>
              <li><strong>Medieninhalte:</strong> Hochgeladene Fotos und Profilbilder</li>
              <li><strong>Technische Daten:</strong> IP-Adresse, Browser-Typ, Gerätetyp, Betriebssystem, Zugriffszeitpunkt</li>
              <li><strong>Nutzungsstatistiken:</strong> Profilaufrufe, Suchhistorie, Kontaktanfragen, Session-IDs, Referrer-URLs</li>
              <li><strong>Authentifizierungsdaten:</strong> E-Mail-Adresse, verschlüsseltes Passwort, Login-Zeitstempel</li>
              <li><strong>Zahlungsinformationen:</strong> Transaktions-IDs von Payment-Providern (keine vollständigen Zahlungsdaten)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8">3. Zweck und Rechtsgrundlage der Datenverarbeitung</h2>
            <p>Die Verarbeitung Ihrer Daten erfolgt zu folgenden Zwecken:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):</strong> Erstellung und Verwaltung Ihres Profils, Bereitstellung der Plattform-Funktionen</li>
              <li><strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> Sicherstellung der Plattform-Sicherheit, Betrugsbekämpfung, Analyse und Optimierung der Nutzererfahrung</li>
              <li><strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):</strong> Erfüllung gesetzlicher Aufbewahrungspflichten</li>
              <li><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):</strong> Verwendung von optionalen Cookies und Tracking-Tools (nur nach ausdrücklicher Zustimmung)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8">4. Speicherdauer</h2>
            <p>
              Ihre Daten werden gespeichert, solange Ihr Account aktiv ist. Nach Löschung Ihres Accounts werden alle personenbezogenen Daten innerhalb von 30 Tagen vollständig entfernt. 
              Ausnahme: Daten, die aus rechtlichen Gründen länger aufbewahrt werden müssen (z.B. für Abrechnungszwecke), werden nach Ablauf der gesetzlichen Aufbewahrungsfristen gelöscht.
            </p>

            <h2 className="text-2xl font-bold mt-8">5. Weitergabe von Daten</h2>
            <p>
              Eine Weitergabe Ihrer Daten an Dritte erfolgt <strong>nicht</strong>, ausser in folgenden Fällen:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Sie haben ausdrücklich eingewilligt (Art. 6 Abs. 1 lit. a DSGVO)</li>
              <li>Die Weitergabe ist zur Vertragserfüllung erforderlich (z.B. Payment-Provider)</li>
              <li>Eine gesetzliche Verpflichtung besteht (z.B. behördliche Anfragen)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8">6. Ihre Rechte (DSGVO-konforme Auskunft)</h2>
            <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
            
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <div>
                <h3 className="font-bold">✓ Auskunftsrecht (Art. 15 DSGVO)</h3>
                <p className="text-sm">Sie können jederzeit Auskunft über die zu Ihrer Person gespeicherten Daten erhalten.</p>
              </div>
              
              <div>
                <h3 className="font-bold">✓ Recht auf Datenexport (Art. 20 DSGVO - Datenportabilität)</h3>
                <p className="text-sm">
                  Sie können alle Ihre Daten in einem strukturierten, maschinenlesbaren Format exportieren. 
                  <br />
                  <strong>So geht's:</strong> Gehe zu <a href="/user/dashboard" className="text-primary underline">Dashboard → Datenschutz & Sicherheit → "Deine Daten exportieren"</a>
                </p>
              </div>
              
              <div>
                <h3 className="font-bold">✓ Recht auf Löschung (Art. 17 DSGVO - "Recht auf Vergessenwerden")</h3>
                <p className="text-sm">
                  Sie können Ihren Account und alle zugehörigen Daten jederzeit vollständig löschen lassen.
                  <br />
                  <strong>So geht's:</strong> Gehe zu <a href="/user/dashboard" className="text-primary underline">Dashboard → Datenschutz & Sicherheit → "Account vollständig löschen"</a>
                  <br />
                  <span className="text-destructive font-medium">Achtung: Diese Aktion ist irreversibel!</span>
                </p>
              </div>
              
              <div>
                <h3 className="font-bold">✓ Recht auf Berichtigung (Art. 16 DSGVO)</h3>
                <p className="text-sm">
                  Sie können fehlerhafte oder unvollständige Daten jederzeit korrigieren.
                  <br />
                  <strong>So geht's:</strong> Gehe zu <a href="/profil/bearbeiten" className="text-primary underline">Profil bearbeiten</a>
                </p>
              </div>
              
              <div>
                <h3 className="font-bold">✓ Widerspruchsrecht (Art. 21 DSGVO)</h3>
                <p className="text-sm">Sie können der Verarbeitung Ihrer Daten jederzeit widersprechen, indem Sie Ihren Account löschen.</p>
              </div>
              
              <div>
                <h3 className="font-bold">✓ Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</h3>
                <p className="text-sm">Sie können die Verarbeitung Ihrer Daten unter bestimmten Voraussetzungen einschränken lassen.</p>
              </div>
            </div>

            <p className="mt-4">
              <strong>Kontakt für Datenschutzanfragen:</strong> {contactInfo || 'Bitte richten Sie alle Anfragen an die im Impressum genannte E-Mail-Adresse.'}
            </p>

            <h2 className="text-2xl font-bold mt-8">7. Datensicherheit</h2>
            <p>Wir setzen umfassende Sicherheitsmaßnahmen zum Schutz Ihrer Daten ein:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>SSL/TLS-Verschlüsselung:</strong> Alle Datenübertragungen erfolgen verschlüsselt über HTTPS</li>
              <li><strong>Passwort-Sicherheit:</strong> Passwörter werden mit modernen Hashing-Algorithmen (bcrypt) gespeichert</li>
              <li><strong>Leaked Password Protection:</strong> Automatische Prüfung gegen bekannte kompromittierte Passwörter</li>
              <li><strong>Rate Limiting:</strong> Schutz vor Brute-Force-Angriffen durch Zugriffsbeschränkungen</li>
              <li><strong>Row Level Security (RLS):</strong> Datenbankzugriff wird auf Benutzerebene kontrolliert</li>
              <li><strong>Regelmäßige Security Audits:</strong> Kontinuierliche Überprüfung und Aktualisierung der Sicherheitsmaßnahmen</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8">8. Zahlungsdaten</h2>
            <p>
              Zahlungsdaten werden ausschliesslich über zertifizierte, PCI-DSS-konforme Payment-Provider (z.B. Stripe) verarbeitet. 
              ESCORIA speichert <strong>keine vollständigen Kreditkarten- oder Bankdaten</strong>. 
              Wir erhalten lediglich eine Transaktions-ID zur Zuordnung der Zahlung. 
              Alle Transaktionen erfolgen verschlüsselt nach aktuellem Sicherheitsstandard (TLS 1.3).
            </p>

            <h2 className="text-2xl font-bold mt-8">9. Cookies und Tracking</h2>
            <p>Wir verwenden folgende Arten von Cookies:</p>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Technisch notwendige Cookies (immer aktiv)</h3>
                <p className="text-sm text-muted-foreground">
                  Diese Cookies sind für die Basisfunktionalität der Website erforderlich:
                </p>
                <ul className="list-disc list-inside text-sm ml-4">
                  <li>Session-Cookie für Login-Status</li>
                  <li>LocalStorage für Auth-Token und Session-Verwaltung</li>
                  <li>Präferenz-Cookies (z.B. Spracheinstellung)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold">Optionale Cookies (nur mit Zustimmung)</h3>
                <p className="text-sm text-muted-foreground">
                  Tracking-Tools und Analyse-Cookies werden <strong>nur</strong> mit Ihrer ausdrücklichen Zustimmung aktiviert.
                  Sie können über ein Consent-Banner entscheiden, welche Cookies Sie akzeptieren möchten. 
                  Eine Ablehnung ist jederzeit möglich und hat keinen Einfluss auf die Nutzung der Plattform.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold">Kein Third-Party-Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  ESCORIA verwendet <strong>keine</strong> Marketing-Cookies oder Third-Party-Tracker (z.B. Google Analytics, Facebook Pixel) ohne Ihre ausdrückliche Zustimmung.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-8">10. Profilsichtbarkeit</h2>
            <p>
              Ihr Profil ist nach Freischaltung durch unser Moderationsteam öffentlich einsehbar. 
              Folgende Daten sind für alle Besucher sichtbar:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Anzeigename, Alter, Standort (Stadt, Kanton)</li>
              <li>Profilfotos und Beschreibungstext</li>
              <li>Von Ihnen freigegebene Kontaktdaten (optional)</li>
              <li>Kategorien und Sprachen</li>
            </ul>
            <p className="mt-2">
              <strong>Ihre E-Mail-Adresse</strong> (Login) ist <strong>niemals</strong> öffentlich sichtbar.
            </p>

            <h2 className="text-2xl font-bold mt-8">11. Beschwerderecht bei Aufsichtsbehörde</h2>
            <p>
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <strong>Schweiz:</strong> Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB)
              <br />
              <strong>EU:</strong> Zuständige Aufsichtsbehörde Ihres Aufenthaltslandes
            </p>

            <h2 className="text-2xl font-bold mt-8">12. Änderungen dieser Datenschutzerklärung</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, um sie an geänderte Rechtslage oder Änderungen unserer Dienste anzupassen. 
              Die aktuelle Version finden Sie stets auf dieser Seite.
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
