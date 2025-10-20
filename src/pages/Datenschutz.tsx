import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Datenschutz = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung</h1>
          <div className="prose max-w-none space-y-4">
            <h2 className="text-xl font-bold">1. Datenverarbeitung</h2>
            <p>
              ESCORIA verarbeitet personenbezogene Daten gemäss dem schweizerischen Datenschutzgesetz (DSG). Erfasst werden Kontaktdaten, Profilinformationen sowie technische Daten (IP-Adresse, Browser, Gerät). Die Daten dienen ausschliesslich dem Betrieb der Plattform und werden nicht an Dritte weitergegeben.
            </p>

            <h2 className="text-xl font-bold">2. Zahlungsdaten</h2>
            <p>
              Zahlungsdaten werden ausschliesslich über zertifizierte Payment-Provider verarbeitet. ESCORIA speichert keine Kreditkarten- oder Bankdaten. Transaktionen erfolgen verschlüsselt nach aktuellem Sicherheitsstandard.
            </p>

            <h2 className="text-xl font-bold">3. Cookies und Tracking</h2>
            <p>
              Die Webseite nutzt technisch notwendige Cookies. Tracking-Tools werden nur mit ausdrücklicher Zustimmung aktiviert. Nutzer können über ein Consent-Banner entscheiden, welche Cookies sie akzeptieren möchten. Eine Ablehnung ist jederzeit möglich.
            </p>

            <h2 className="text-xl font-bold">4. Rechte der Nutzer</h2>
            <p>
              Nutzer haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Sperrung ihrer Daten. Anfragen richten Sie bitte an die im Impressum genannte Kontaktadresse.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Datenschutz;
