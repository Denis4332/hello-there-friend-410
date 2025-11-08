import { ProfileWithRelations } from '@/types/common';

export const mockProfile: ProfileWithRelations = {
  id: 'test-profile-id',
  user_id: 'test-user-id',
  slug: 'test-profile',
  display_name: 'Test User',
  age: 25,
  gender: 'female',
  city: 'Zürich',
  canton: 'ZH',
  postal_code: '8000',
  lat: 47.3769,
  lng: 8.5417,
  languages: ['de', 'en'],
  is_premium: true,
  verified_at: '2024-01-01T00:00:00Z',
  listing_type: 'premium',
  about_me: 'Test bio',
  phone: '+41791234567',
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  photos: [
    {
      id: 'photo-1',
      profile_id: 'test-profile-id',
      storage_path: 'test-path.jpg',
      is_primary: true,
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  profile_categories: [
    {
      category_id: 'cat-1',
      categories: {
        id: 'cat-1',
        name: 'Massage',
        slug: 'massage',
      },
    },
  ],
};

export const mockCategory = {
  id: 'cat-1',
  name: 'Massage',
  slug: 'massage',
  active: true,
  sort_order: 1,
};

export const mockCity = {
  id: 'city-1',
  name: 'Zürich',
  slug: 'zuerich',
  canton_id: 'canton-zh',
  postal_code: '8000',
  lat: 47.3769,
  lng: 8.5417,
};

export const mockCanton = {
  id: 'canton-zh',
  name: 'Zürich',
  abbreviation: 'ZH',
};
