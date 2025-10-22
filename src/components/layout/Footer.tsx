import { Link } from 'react-router-dom';
import { useSiteSetting } from '@/hooks/useSiteSettings';

export const Footer = () => {
  const { data: copyright } = useSiteSetting('footer_copyright');
  const { data: agbText } = useSiteSetting('footer_agb');
  const { data: datenschutzText } = useSiteSetting('footer_datenschutz');
  const { data: kontaktText } = useSiteSetting('footer_kontakt');
  const { data: adminText } = useSiteSetting('footer_admin');

  return (
    <footer className="bg-muted mt-auto py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>
          {copyright || '© 2025 Escoria'} ·{' '}
          <Link to="/agb" className="hover:underline">
            {agbText || 'AGB'}
          </Link>{' '}
          ·{' '}
          <Link to="/datenschutz" className="hover:underline">
            {datenschutzText || 'Datenschutz'}
          </Link>{' '}
          ·{' '}
          <Link to="/kontakt" className="hover:underline">
            {kontaktText || 'Kontakt'}
          </Link>{' '}
          ·{' '}
          <Link to="/admin/login" className="hover:underline">
            {adminText || 'Admin'}
          </Link>
        </p>
      </div>
    </footer>
  );
};
