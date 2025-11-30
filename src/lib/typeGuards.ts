/**
 * Type guard utilities for runtime validation of API responses.
 * Ensures type safety when receiving data from Supabase.
 */

import { Profile, Photo, Category } from '@/types/dating';
import { ProfileWithRelations } from '@/types/common';

/**
 * Validates if a value is a valid Profile object
 * @param value - Value to validate
 * @returns {boolean} True if value matches Profile interface
 */
export function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== 'object') return false;
  const p = value as any;
  
  return (
    typeof p.id === 'string' &&
    // user_id removed for security (not exposed in public_profiles view)
    typeof p.display_name === 'string' &&
    typeof p.age === 'number' &&
    typeof p.city === 'string' &&
    typeof p.canton === 'string' &&
    Array.isArray(p.languages) &&
    typeof p.is_premium === 'boolean' &&
    (p.status === 'draft' || p.status === 'active' || p.status === 'inactive' || p.status === 'pending')
  );
}

/**
 * Validates if a value is a valid Photo object
 * @param value - Value to validate
 * @returns {boolean} True if value matches Photo interface
 */
export function isPhoto(value: unknown): value is Photo {
  if (!value || typeof value !== 'object') return false;
  const p = value as any;
  
  return (
    typeof p.id === 'string' &&
    typeof p.profile_id === 'string' &&
    typeof p.storage_path === 'string' &&
    typeof p.is_primary === 'boolean'
  );
}

/**
 * Validates if a value is a valid Category object
 * @param value - Value to validate
 * @returns {boolean} True if value matches Category interface
 */
export function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== 'object') return false;
  const c = value as any;
  
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.slug === 'string' &&
    typeof c.active === 'boolean'
  );
}

/**
 * Validates an array of values using a type guard
 * @param arr - Array to validate
 * @param guard - Type guard function
 * @returns {boolean} True if all elements pass the guard
 */
export function isArrayOf<T>(
  arr: unknown,
  guard: (value: unknown) => value is T
): arr is T[] {
  return Array.isArray(arr) && arr.every(guard);
}

/**
 * Validates and transforms a Supabase profile response.
 * Logs errors for debugging if validation fails.
 * 
 * @param data - Raw data from Supabase query
 * @returns {ProfileWithRelations | null} Validated profile or null
 */
export function validateProfileResponse(data: unknown): ProfileWithRelations | null {
  if (!data) return null;
  
  // Basic structure validation (relaxed for ProfileWithRelations)
  if (typeof data !== 'object') {
    console.error('❌ Invalid profile data received from API:', data);
    return null;
  }
  
  const p = data as any;
  
  // Validate core fields
  if (
    typeof p.id !== 'string' ||
    typeof p.display_name !== 'string' ||
    typeof p.city !== 'string' ||
    typeof p.canton !== 'string'
  ) {
    console.error('❌ Profile missing required fields:', data);
    return null;
  }
  
  return data as ProfileWithRelations;
}

/**
 * Validates and transforms an array of Supabase profile responses.
 * Filters out invalid profiles and logs warnings.
 * 
 * @param data - Raw array from Supabase query
 * @returns {ProfileWithRelations[]} Array of validated profiles
 */
export function validateProfilesResponse(data: unknown): ProfileWithRelations[] {
  if (!Array.isArray(data)) {
    console.error('❌ Expected array of profiles, got:', typeof data);
    return [];
  }
  
  const validProfiles = data.filter((item) => {
    const result = validateProfileResponse(item);
    if (!result) {
      console.warn('⚠️ Skipping invalid profile:', item);
    }
    return result !== null;
  });
  
  return validProfiles as ProfileWithRelations[];
}
