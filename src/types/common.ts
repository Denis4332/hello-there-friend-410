// Common TypeScript types and interfaces
import { Profile, Photo } from './dating';

export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

export interface Canton {
  id: string;
  name: string;
  abbreviation: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  canton_id?: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  label: string;
  description?: string;
  type: string;
  category: string;
}

export interface DropdownOption {
  id: string;
  category: string;
  value: string;
  label: string;
  sort_order: number;
  active: boolean;
}

// Profile with extended fields for display
export type ProfileWithRelations = Profile & {
  slug?: string;
  photos?: Photo[];
  profile_categories?: Array<{
    category_id: string;
    categories: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  listing_type?: string;
  street_address?: string;
  show_street?: boolean;
  premium_until?: string;
  top_ad_until?: string;
  availability_status?: string;
  last_seen_at?: string;
};
