import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
  const { data: copyright } = useSiteSetting('footer_copyright');
  const { data: agbText } = useSiteSetting('footer_agb');
  const { data: datenschutzText } = useSiteSetting('footer_datenschutz');
  const { data: kontaktText } = useSiteSetting('footer_kontakt');
  const { data: adminText } = useSiteSetting('footer_admin');
  const { data: ctaText } = useSiteSetting('footer_cta_text');
  const { data: ctaLink } = useSiteSetting('footer_cta_link');
  const { data: facebookUrl } = useSiteSetting('footer_facebook_url');
  const { data: instagramUrl } = useSiteSetting('footer_instagram_url');
  const { data: twitterUrl } = useSiteSetting('footer_twitter_url');
  const { data: linkedinUrl } = useSiteSetting('footer_linkedin_url');
  const { data: sectionInfo } = useSiteSetting('footer_section_info');
  const { data: sectionLegal } = useSiteSetting('footer_section_legal');
  const { data: sectionCta } = useSiteSetting('footer_section_cta');
  const { data: ctaDescription } = useSiteSetting('footer_cta_description');
  const { data: linkPrices } = useSiteSetting('footer_link_prices');
  const { data: linkAdvertising } = useSiteSetting('footer_link_advertising');
  const { data: impressumText } = useSiteSetting('footer_impressum');
  const { data: agbNotice } = useSiteSetting('footer_agb_notice');

  const socialLinks = [
    { url: facebookUrl, icon: Facebook, label: 'Facebook' },
    { url: instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: twitterUrl, icon: Twitter, label: 'Twitter' },
    { url: linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
  ].filter(link => link.url && link.url.trim() !== '');

  return (
    <footer className="bg-muted mt-auto py-12 content-visibility-auto">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Informationen */}
          <div>
            <h3 className="font-semibold mb-4">{sectionInfo || 'Informationen'}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/preise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {linkPrices || 'Preise & Pakete'}
                </Link>
              </li>
              <li>
                <Link to="/bannerpreise" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {linkAdvertising || 'Werbung schalten'}
                </Link>
              </li>
              <li>
                <Link to="/kontakt" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {kontaktText || 'Kontakt'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h3 className="font-semibold mb-4">{sectionLegal || 'Rechtliches'}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/agb" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {agbText || 'AGB'}
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {datenschutzText || 'Datenschutz'}
                </Link>
              </li>
              <li>
                <Link to="/impressum" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {impressumText || 'Impressum'}
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {adminText || 'Admin'}
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-semibold mb-4">{sectionCta || 'Inserat erstellen'}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {ctaDescription || 'Erstelle jetzt dein Inserat und erreiche tausende potenzielle Interessenten in der ganzen Schweiz.'}
            </p>
            <Button asChild className="w-full">
              <Link to={ctaLink || '/auth?mode=signup'}>
                {ctaText || 'Jetzt Inserat erstellen'}
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
              {copyright || '© 2025 Escoria'}
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
