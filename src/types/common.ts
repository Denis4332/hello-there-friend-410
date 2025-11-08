// Common TypeScript types and interfaces

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
export interface ProfileWithRelations {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  gender?: string;
  city: string;
  canton: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
  about_me?: string;
  languages: string[];
  is_premium: boolean;
  verified_at?: string;
  status: string;
  created_at: string;
  updated_at: string;
  slug?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  telegram?: string;
  instagram?: string;
  street_address?: string;
  show_street?: boolean;
  listing_type?: string;
  premium_until?: string;
  top_ad_until?: string;
  photos?: Array<{
    id: string;
    storage_path: string;
    is_primary: boolean;
  }>;
  profile_categories?: Array<{
    category_id: string;
    categories: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}
