export type ProfileStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended';
export type UserRole = 'admin' | 'agency' | 'individual';
export type UserStatus = 'active' | 'suspended';
export type ReportStatus = 'open' | 'closed';

export interface Profile {
  id: string;
  slug: string;
  display_name: string;
  age: number;
  gender?: string;
  city: string;
  canton: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
  categories: string[];
  languages: string[];
  verified: boolean;
  vip: boolean;
  price_range?: string;
  short_bio: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  contact_website?: string;
  status: ProfileStatus;
  owner_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  display_name: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
}

export interface City {
  id: string;
  name: string;
  canton: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
}

export interface Report {
  id: string;
  profile_id: string;
  reason: string;
  message: string;
  created_at: string;
  status: ReportStatus;
}
