import { Link } from 'react-router-dom';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
  const { data: copyright } = useSiteSetting('footer_copyright');
  const { data: agbText } = useSiteSetting('footer_agb');
  const { data: datenschutzText } = useSiteSetting('footer_datenschutz');
  const { data: kontaktText } = useSiteSetting('footer_kontakt');
  const { data: adminText } = useSiteSetting('footer_admin');
  const { data: facebookUrl } = useSiteSetting('footer_facebook_url');
  const { data: instagramUrl } = useSiteSetting('footer_instagram_url');
  const { data: twitterUrl } = useSiteSetting('footer_twitter_url');
  const { data: linkedinUrl } = useSiteSetting('footer_linkedin_url');

  const socialLinks = [
    { url: facebookUrl, icon: Facebook, label: 'Facebook' },
    { url: instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: twitterUrl, icon: Twitter, label: 'Twitter' },
    { url: linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
  ].filter(link => link.url && link.url.trim() !== '');

  return (
    <footer className="bg-muted mt-auto py-6">
      <div className="container mx-auto px-4">
        <div className="text-center">
          {socialLinks.length > 0 && (
            <div className="flex justify-center gap-4 mb-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={link.label}
                >
                  <link.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
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
      </div>
    </footer>
  );
};
