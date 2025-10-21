// TypeScript Types for Dating Platform

export type AppRole = 'admin' | 'user';
export type ProfileStatus = 'pending' | 'active' | 'rejected';
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
  // Relations (joined data)
  categories?: Category[];
  photos?: Photo[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
  created_at: string;
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

export interface Canton {
  id: string;
  name: string;
  abbreviation: string;
}

// Search/Filter types
export interface ProfileFilters {
  city?: string;
  canton?: string;
  postal_code?: string;
  radius_km?: number;
  min_age?: number;
  max_age?: number;
  gender?: Gender;
  categories?: string[];
  languages?: string[];
  is_premium?: boolean;
  verified_only?: boolean;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}
