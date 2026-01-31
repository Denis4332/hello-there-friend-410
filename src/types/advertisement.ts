export type BannerPosition = 
  | 'header_banner'
  | 'in_content'
  | 'in_grid'
  | 'footer_banner'
  | 'popup';

export interface Advertisement {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  position: BannerPosition;
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
  // Additional fields from DB
  payment_status?: string | null;
  payment_reference?: string | null;
  payment_method?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  requested_duration?: string | null;
}

export interface BannerConfig {
  name: string;
  desktop: { width: number; height: number };
  mobile: { width: number; height: number };
  maxSlots: number;
  pricePerDay: number;
  pricePerWeek: number;
  pricePerMonth: number;
  aspectRatio: number;
}

export const BANNER_CONFIG: Record<BannerPosition, BannerConfig> = {
  header_banner: {
    name: 'Header Banner',
    desktop: { width: 728, height: 90 },
    mobile: { width: 320, height: 100 },
    maxSlots: 3,
    pricePerDay: 60,
    pricePerWeek: 380,
    pricePerMonth: 1400,
    aspectRatio: 728 / 90,
  },
  in_content: {
    name: 'In-Content Banner',
    desktop: { width: 728, height: 90 },
    mobile: { width: 320, height: 100 },
    maxSlots: 5,
    pricePerDay: 35,
    pricePerWeek: 220,
    pricePerMonth: 800,
    aspectRatio: 728 / 90,
  },
  in_grid: {
    name: 'In-Grid Banner',
    desktop: { width: 300, height: 400 },
    mobile: { width: 300, height: 400 },
    maxSlots: 5,
    pricePerDay: 30,
    pricePerWeek: 190,
    pricePerMonth: 700,
    aspectRatio: 300 / 400,
  },
  footer_banner: {
    name: 'Footer Banner',
    desktop: { width: 728, height: 90 },
    mobile: { width: 320, height: 100 },
    maxSlots: 3,
    pricePerDay: 25,
    pricePerWeek: 160,
    pricePerMonth: 600,
    aspectRatio: 728 / 90,
  },
  popup: {
    name: 'Popup Banner',
    desktop: { width: 300, height: 400 },
    mobile: { width: 300, height: 400 },
    maxSlots: 2,
    pricePerDay: 80,
    pricePerWeek: 500,
    pricePerMonth: 1800,
    aspectRatio: 300 / 400,
  },
};

// Legacy export for backwards compatibility
export interface BannerPackage {
  position: BannerPosition;
  name: string;
  price_per_day: number;
  price_per_week: number;
  price_per_month: number;
  description: string;
  features: string[];
  badge?: string;
}
