import { BaseBanner } from './BaseBanner';

interface HeaderBannerProps {
  className?: string;
}

export const HeaderBanner = ({ className = '' }: HeaderBannerProps) => {
  return <BaseBanner position="header_banner" className={className} />;
};
