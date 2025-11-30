// TypeScript Types for Dating Platform

export type AppRole = 'admin' | 'user';
export type ProfileStatus = 'draft' | 'pending' | 'active' | 'rejected';
export type ReportStatus = 'open' | 'closed';
export type Gender = 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  gender?: Gender;
  city: string;
  canton: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
  about_me?: string;
  languages: string[];
  is_premium: boolean;
  verified_at?: string;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
  // Contact fields
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  telegram?: string;
  instagram?: string;
  // Relations (populated via joins)
  categories?: Category[];
  photos?: Photo[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface Canton {
  id: string;
  name: string;
  abbreviation: string;
}

export interface ProfileCategory {
  profile_id: string;
  category_id: string;
}

export interface Photo {
  id: string;
  profile_id: string;
  storage_path: string;
  is_primary: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  profile_id: string;
  reporter_user_id?: string;
  reason: string;
  message?: string;
  status: ReportStatus;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

// Form validation schemas (for use with react-hook-form + zod)
export interface ProfileFormData {
  display_name: string;
  age: number;
  gender?: Gender;
  city: string;
  canton: string;
  postal_code?: string;
  about_me?: string;
  languages: string[];
  category_ids: string[];
  // Contact fields
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  telegram?: string;
  instagram?: string;
}

export interface SearchFilters {
  city?: string;
  canton?: string;
  postal_code?: string;
  radius_km?: number;
  category_ids?: string[];
  age_min?: number;
  age_max?: number;
  gender?: Gender;
  languages?: string[];
}
