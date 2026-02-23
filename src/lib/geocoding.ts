import { supabase } from '@/integrations/supabase/client';

export interface GeocodingResult {
  lat: number;
  lng: number;
}

/**
 * Look up GPS coordinates from DB by city name and canton.
 * Falls back to null if not found (no external API calls).
 */
export async function geocodePlz(
  postalCode: string,
  city: string
): Promise<GeocodingResult | null> {
  try {
    // Try by postal code first
    if (postalCode) {
      const { data } = await supabase
        .from('cities')
        .select('lat, lng')
        .eq('postal_code', postalCode)
        .maybeSingle();

      if (data?.lat && data?.lng) {
        return { lat: Number(data.lat), lng: Number(data.lng) };
      }
    }

    // Fallback: search by city name
    if (city) {
      const { data } = await supabase
        .from('cities')
        .select('lat, lng')
        .ilike('name', `%${city}%`)
        .limit(1)
        .maybeSingle();

      if (data?.lat && data?.lng) {
        return { lat: Number(data.lat), lng: Number(data.lng) };
      }
    }

    return null;
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
}
