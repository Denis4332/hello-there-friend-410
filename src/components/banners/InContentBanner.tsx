import { BaseBanner } from './BaseBanner';

interface InContentBannerProps {
  className?: string;
}

export const InContentBanner = ({ className = '' }: InContentBannerProps) => {
  return <BaseBanner position="in_content" className={className} />;
};
