import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-muted mt-auto py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>
          © 2025 Escoria ·{' '}
          <Link to="/agb" className="hover:underline">
            AGB
          </Link>{' '}
          ·{' '}
          <Link to="/datenschutz" className="hover:underline">
            Datenschutz
          </Link>{' '}
          ·{' '}
          <Link to="/kontakt" className="hover:underline">
            Kontakt
          </Link>{' '}
          ·{' '}
          <Link to="/admin/login" className="hover:underline">
            Admin
          </Link>
        </p>
      </div>
    </footer>
  );
};
