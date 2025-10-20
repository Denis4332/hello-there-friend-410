import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProfileCard } from '@/components/ProfileCard';
import { mockProfiles, mockCities } from '@/data/mockData';

const cityData: Record<string, { name: string; intro: string }> = {
  zuerich: {
    name: 'Zürich',
    intro: 'Finden Sie verifizierte Anbieter und Profile in Zürich. Alle Kontaktdaten werden vor der Freischaltung geprüft, um höchste Qualität und Seriosität zu gewährleisten. Diskrete und professionelle Kontaktaufnahme direkt über die Plattform.',
  },
  basel: {
    name: 'Basel',
    intro: 'Entdecken Sie geprüfte Profile und Agenturen in Basel. Jedes Profil durchläuft einen Verifizierungsprozess, der Identität und Erreichbarkeit sicherstellt. Transparente Darstellung und sichere Kontaktmöglichkeiten für alle Nutzer.',
  },
  bern: {
    name: 'Bern',
    intro: 'Verifizierte Anbieter in Bern mit geprüften Kontaktdaten. Qualität steht bei ESCORIA an erster Stelle – alle Profile werden manuell überprüft. Seriöse Plattform für diskrete und zuverlässige Kontakte in der Bundesstadt.',
  },
  genf: {
    name: 'Genf',
    intro: 'Profile und Agenturen in Genf mit Verifizierung. ESCORIA garantiert echte und aktuelle Kontaktdaten durch sorgfältige Prüfung. Professionelle Abwicklung und höchste Standards für alle Nutzer in der Genferseeregion.',
  },
};

const Stadt = () => {
  const { slug } = useParams();
  const data = slug ? cityData[slug] : null;

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Stadt nicht gefunden</p>
        </main>
        <Footer />
      </div>
    );
  }

  const cityProfiles = mockProfiles.filter(
    (p) => p.city.toLowerCase() === data.name.toLowerCase()
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">
            Anbieter in {data.name} – verifizierte Profile & Agenturen
          </h1>
          <p className="text-muted-foreground mb-8 max-w-3xl">{data.intro}</p>

          {cityProfiles.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {cityProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              Derzeit keine Profile in {data.name} verfügbar.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Stadt;
