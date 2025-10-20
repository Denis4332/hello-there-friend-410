import { Link } from 'react-router-dom';

export const AdminHeader = () => {
  return (
    <header className="bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="text-lg font-bold text-primary">
              ESCORIA Admin
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link to="/admin" className="hover:text-primary">
                Dashboard
              </Link>
              <Link to="/admin/profile" className="hover:text-primary">
                Profile
              </Link>
              <Link to="/admin/users" className="hover:text-primary">
                Nutzer
              </Link>
              <Link to="/admin/categories" className="hover:text-primary">
                Kategorien
              </Link>
              <Link to="/admin/cities" className="hover:text-primary">
                Städte
              </Link>
              <Link to="/admin/reports" className="hover:text-primary">
                Meldungen
              </Link>
            </nav>
          </div>
          <Link to="/" className="text-sm hover:text-primary">
            Zur Webseite
          </Link>
        </div>
      </div>
    </header>
  );
};
