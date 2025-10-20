import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const AGB = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Allgemeine Geschäftsbedingungen</h1>
          <div className="prose max-w-none space-y-4">
            <h2 className="text-xl font-bold">1. Geltungsbereich</h2>
            <p>
              ESCORIA betreibt ein Online-Verzeichnis für Anbieter in der Schweiz. Diese AGB regeln die Nutzung der Plattform sowie die Rechte und Pflichten zwischen Betreiber und Nutzern. Mit der Nutzung akzeptieren Sie diese Bedingungen.
            </p>

            <h2 className="text-xl font-bold">2. Verbot rechtswidriger Inhalte</h2>
            <p>
              Die Veröffentlichung von Inhalten, die gegen schweizerisches Recht verstossen, ist strengstens untersagt. Dies umfasst insbesondere die Darstellung von Minderjährigen, illegale Dienstleistungen sowie diskriminierende oder beleidigende Inhalte.
            </p>

            <h2 className="text-xl font-bold">3. Notice-and-Takedown-Verfahren</h2>
            <p>
              ESCORIA nimmt Hinweise auf rechtswidrige Inhalte ernst. Gemeldete Profile werden unverzüglich geprüft und bei begründetem Verdacht gesperrt. Nutzer können Verstösse über die Meldefunktion anzeigen. Bei wiederholten Verstössen erfolgt ein dauerhafter Ausschluss.
            </p>

            <h2 className="text-xl font-bold">4. Sperrrecht und Haftungsausschluss</h2>
            <p>
              ESCORIA behält sich das Recht vor, Profile ohne Angabe von Gründen zu sperren oder zu löschen. Die Plattform übernimmt keine Haftung für die Richtigkeit der Angaben in Profilen. Nutzer sind selbst verantwortlich für ihre Kontaktaufnahme und Vereinbarungen.
            </p>

            <h2 className="text-xl font-bold">5. Gerichtsstand</h2>
            <p>
              Es gilt ausschliesslich schweizerisches Recht. Gerichtsstand ist der Sitz des Betreibers in der Schweiz.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AGB;
