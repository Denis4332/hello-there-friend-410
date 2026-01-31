import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSiteSettingsContext } from '@/contexts/SiteSettingsContext';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
  // Single batch load instead of 19 individual API calls
  const { getSetting } = useSiteSettingsContext();
  
  const copyright = getSetting('footer_copyright', '© 2025 Escoria');
  const agbText = getSetting('footer_agb', 'AGB');
  const datenschutzText = getSetting('footer_datenschutz', 'Datenschutz');
  const kontaktText = getSetting('footer_kontakt', 'Kontakt');
  const adminText = getSetting('footer_admin', 'Admin');
  const ctaText = getSetting('footer_cta_text', 'Jetzt Inserat erstellen');
  const ctaLink = getSetting('footer_cta_link', '/auth?mode=signup');
  const facebookUrl = getSetting('footer_facebook_url');
  const instagramUrl = getSetting('footer_instagram_url');
  const twitterUrl = getSetting('footer_twitter_url');
  const linkedinUrl = getSetting('footer_linkedin_url');
  const sectionInfo = getSetting('footer_section_info', 'Informationen');
  const sectionLegal = getSetting('footer_section_legal', 'Rechtliches');
  const sectionCta = getSetting('footer_section_cta', 'Inserat erstellen');
  const ctaDescription = getSetting('footer_cta_description', 'Erstelle jetzt dein Inserat und erreiche tausende potenzielle Interessenten in der ganzen Schweiz.');
  const linkPrices = getSetting('footer_link_prices', 'Preise & Pakete');
  const impressumText = getSetting('footer_impressum', 'Impressum');
  const agbNotice = getSetting('footer_agb_notice');

  const socialLinks = [
    { url: facebookUrl, icon: Facebook, label: 'Facebook' },
    { url: instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: twitterUrl, icon: Twitter, label: 'Twitter' },
    { url: linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
  ].filter(link => link.url && link.url.trim() !== '');

  return (
    <footer className="bg-muted mt-auto py-12 content-visibility-auto">
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Informationen */}
          <div>
            <h3 className="font-semibold mb-4">{sectionInfo}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/preise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {linkPrices}
                </Link>
              </li>
              <li>
                <Link to="/kontakt" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {kontaktText}
                </Link>
              </li>
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h3 className="font-semibold mb-4">{sectionLegal}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/agb" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {agbText}
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {datenschutzText}
                </Link>
              </li>
              <li>
                <Link to="/impressum" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {impressumText}
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {adminText}
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-semibold mb-4">{sectionCta}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {ctaDescription}
            </p>
            <Button asChild className="w-full">
              <Link to={ctaLink}>
                {ctaText}
              </Link>
            </Button>
          </div>
        </div>

        {/* Social & Copyright */}
        <div className="border-t border-border pt-6">
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
              {copyright}
            </p>
            {agbNotice && (
              <p className="text-xs text-muted-foreground/70 mt-2">
                {agbNotice}{' '}
                <Link to="/agb" className="underline hover:text-foreground transition-colors">
                  AGB lesen
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
