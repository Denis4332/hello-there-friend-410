export interface Advertisement {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: 'popup' | 'top' | 'grid';
  priority: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  clicks: number;
  impressions: number;
  popup_delay_seconds: number;
  popup_frequency: 'once_per_session' | 'once_per_day' | 'always';
  stripe_payment_id: string | null;
  payment_required: boolean;
  price_per_day: number | null;
  created_at: string;
  updated_at: string;
}

export interface BannerPackage {
  position: 'popup' | 'top' | 'grid';
  name: string;
  price_per_day: number;
  price_per_week: number;
  price_per_month: number;
  description: string;
  features: string[];
  badge?: string;
}

// Banner size specifications
export const BANNER_SIZES = {
  grid: {
    width: 430,
    height: 625,
    aspectRatio: '2/3',
    description: 'Hochformat (2:3) - gleiche Größe wie Profilkarten',
  },
  top: {
    width: 1200,
    height: 300,
    aspectRatio: '4/1',
    description: 'Querformat (4:1) - breites Header-Banner',
  },
  popup: {
    width: 800,
    height: 600,
    aspectRatio: '4/3',
    description: 'Medium-Format (4:3) - Modal-Popup',
  },
} as const;
