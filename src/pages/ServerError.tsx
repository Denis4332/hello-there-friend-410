import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';

const ServerError = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">500</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Unerwarteter Fehler aufgetreten
          </p>
          <p className="text-muted-foreground mb-6">
            Bitte versuchen Sie es später erneut.
          </p>
          <Link to="/">
            <Button>Zurück zur Startseite</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServerError;
