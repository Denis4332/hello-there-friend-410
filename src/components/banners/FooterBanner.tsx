import { BaseBanner } from './BaseBanner';

interface FooterBannerProps {
  className?: string;
}

export const FooterBanner = ({ className = '' }: FooterBannerProps) => {
  return <BaseBanner position="footer_banner" className={className} />;
};
