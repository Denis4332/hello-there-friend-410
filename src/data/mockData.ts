/**
 * ESCORIA Datenmodell (Frontend-Seed)
 * 
 * TODO Backend: Diese Daten werden später via REST/GraphQL API geladen
 * 
 * Profile Schema:
 * - id: UUID (Primary Key)
 * - slug: string (Unique, URL-friendly)
 * - display_name: string (Öffentlicher Name)
 * - age: number
 * - gender?: string (optional)
 * - city: string
 * - canton: string
 * - postal_code?: string
 * - lat?: number (Geocoding via Google Places)
 * - lng?: number (Geocoding via Google Places)
 * - categories: string[] (Foreign Keys zu Category)
 * - languages: string[] (ISO 639-1 Codes)
 * - verified: boolean (Admin-Verifizierung)
 * - vip: boolean (Premium-Status)
 * - price_range?: string (z.B. "200-400 CHF")
 * - short_bio: string (Max 500 Zeichen)
 * - contact_phone?: string (Format: +41 XX XXX XX XX)
 * - contact_whatsapp?: string (Format: +41 XX XXX XX XX)
 * - contact_website?: string
 * - status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended'
 * - owner_user_id?: UUID (Foreign Key zu User)
 * - created_at: ISO 8601 Timestamp
 * - updated_at: ISO 8601 Timestamp
 * 
 * User Schema:
 * - id: UUID
 * - email: string (Unique)
 * - role: 'admin' | 'agency' | 'individual'
 * - status: 'active' | 'suspended'
 * - display_name: string
 * 
 * Category Schema:
 * - id: UUID
 * - name: string
 * - slug: string (Unique)
 * - active: boolean
 * - sort_order: number
 * 
 * City Schema:
 * - id: UUID
 * - name: string
 * - canton: string
 * - postal_code?: string
 * - lat?: number
 * - lng?: number
 * 
 * Report Schema:
 * - id: UUID
 * - profile_id: UUID (Foreign Key)
 * - reason: string
 * - message: string
 * - created_at: ISO 8601 Timestamp
 * - status: 'open' | 'closed'
 */

import { Profile, Category, City, User, Report } from '@/types/escoria';

export const mockProfiles: Profile[] = [
  {
    id: '1',
    slug: 'lara',
    display_name: 'Lara',
    age: 25,
    city: 'Zürich',
    canton: 'Zürich',
    categories: ['Freelancer', 'Service'],
    languages: ['de', 'en'],
    verified: true,
    vip: true,
    short_bio: 'Lara, 25, zuverlässig & freundlich. Diskret, stilvoll, professionell – Termine nach Vereinbarung in Zürich.',
    contact_whatsapp: '+41 79 000 00 00',
    status: 'approved',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  },
  {
    id: '2',
    slug: 'anna',
    display_name: 'Anna',
    age: 30,
    city: 'Basel',
    canton: 'Basel-Stadt',
    categories: ['Freelancer'],
    languages: ['de', 'fr'],
    verified: true,
    vip: false,
    short_bio: 'Anna, 30, organisiert & kommunikativ. Begleitung für Events und private Anlässe – seriös & verlässlich.',
    contact_phone: '+41 61 000 00 00',
    status: 'approved',
    created_at: '2025-01-14T09:00:00Z',
    updated_at: '2025-01-14T09:00:00Z',
  },
  {
    id: '3',
    slug: 'tom',
    display_name: 'Tom',
    age: 28,
    city: 'Bern',
    canton: 'Bern',
    categories: ['Freelancer'],
    languages: ['de', 'en'],
    verified: false,
    vip: false,
    short_bio: 'Tom, 28, sportlich & aufmerksam. Unterstützung bei individuellen Terminen – flexibel in Bern & Umgebung.',
    contact_whatsapp: '+41 78 000 00 00',
    status: 'approved',
    created_at: '2025-01-13T14:00:00Z',
    updated_at: '2025-01-13T14:00:00Z',
  },
  {
    id: '4',
    slug: 'mia',
    display_name: 'Mia',
    age: 22,
    city: 'Genf',
    canton: 'Genf',
    categories: ['Lifestyle', 'Service'],
    languages: ['fr', 'en'],
    verified: false,
    vip: true,
    short_bio: 'Mia, 22, mehrsprachig & stilvoll. Persönliche Begleitung für Anlässe in Genf – dezent & zuverlässig.',
    contact_phone: '+41 22 000 00 00',
    status: 'approved',
    created_at: '2025-01-12T11:00:00Z',
    updated_at: '2025-01-12T11:00:00Z',
  },
];

export const mockCategories: Category[] = [
  { id: '1', name: 'Freelancer', slug: 'freelancer', active: true, sort_order: 1 },
  { id: '2', name: 'Agenturen', slug: 'agenturen', active: true, sort_order: 2 },
  { id: '3', name: 'Studios', slug: 'studios', active: true, sort_order: 3 },
  { id: '4', name: 'Lifestyle', slug: 'lifestyle', active: true, sort_order: 4 },
  { id: '5', name: 'Events', slug: 'events', active: true, sort_order: 5 },
  { id: '6', name: 'Service', slug: 'service', active: true, sort_order: 6 },
];

export const mockCities: City[] = [
  { id: '1', name: 'Zürich', canton: 'Zürich', postal_code: '8000' },
  { id: '2', name: 'Basel', canton: 'Basel-Stadt', postal_code: '4000' },
  { id: '3', name: 'Bern', canton: 'Bern', postal_code: '3000' },
  { id: '4', name: 'Genf', canton: 'Genf', postal_code: '1200' },
];

export const mockUsers: User[] = [
  { 
    id: '1', 
    email: 'admin@escoria.ch', 
    role: 'admin', 
    status: 'active', 
    display_name: 'Admin' 
  },
  { 
    id: '2', 
    email: 'lara@example.com', 
    role: 'individual', 
    status: 'active', 
    display_name: 'Lara' 
  },
  { 
    id: '3', 
    email: 'anna@example.com', 
    role: 'individual', 
    status: 'active', 
    display_name: 'Anna' 
  },
  { 
    id: '4', 
    email: 'agency@example.com', 
    role: 'agency', 
    status: 'active', 
    display_name: 'Agentur XY' 
  },
];

export const mockReports: Report[] = [
  {
    id: '1',
    profile_id: '3',
    reason: 'Verdacht auf Fake-Profil',
    message: 'Kontaktdaten stimmen nicht, Bilder stammen vermutlich aus dem Internet.',
    created_at: '2025-01-18T14:30:00Z',
    status: 'open',
  },
];
