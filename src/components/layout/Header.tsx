import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-xl font-bold">
            ESCORIA
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:underline">
              Start
            </Link>
            <Link to="/staedte" className="hover:underline">
              Städte
            </Link>
            <Link to="/kategorien" className="hover:underline">
              Kategorien
            </Link>
            <Link to="/kontakt" className="hover:underline">
              Kontakt
            </Link>
            {user ? (
              <>
                <Link to="/profil/erstellen" className="hover:underline">
                  Profil
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-primary-foreground hover:text-primary-foreground/80"
                >
                  Abmelden
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="secondary" size="sm">
                  Anmelden
                </Button>
              </Link>
            )}
          </nav>
          <button className="md:hidden text-primary-foreground">
            ☰
          </button>
        </div>
      </div>
    </header>
  );
};
