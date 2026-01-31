import { BaseBanner } from './BaseBanner';

interface InGridBannerProps {
  className?: string;
}

export const InGridBanner = ({ className = '' }: InGridBannerProps) => {
  return <BaseBanner position="in_grid" className={className} />;
};
