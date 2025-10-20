import { Link } from 'react-router-dom';

export const Header = () => {
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
            <Link to="/admin/login" className="hover:underline">
              Login
            </Link>
          </nav>
          <button className="md:hidden text-primary-foreground">
            ☰
          </button>
        </div>
      </div>
    </header>
  );
};
