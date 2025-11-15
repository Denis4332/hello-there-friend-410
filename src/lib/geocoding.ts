/**
 * Geocoding utilities for converting postal codes to GPS coordinates
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
}

/**
 * Geocode a Swiss postal code to GPS coordinates using Nominatim (OpenStreetMap)
 * @param postalCode - Swiss postal code (PLZ)
 * @param city - City name
 * @returns GPS coordinates or null if not found
 */
export async function geocodePlz(
  postalCode: string,
  city: string
): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `postalcode=${encodeURIComponent(postalCode)}&` +
      `city=${encodeURIComponent(city)}&` +
      `country=Switzerland&` +
      `format=json&` +
      `limit=1`,
      {
        headers: {
          'User-Agent': 'DateApp/1.0' // Nominatim requires User-Agent
        }
      }
    );

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }

    console.warn('No geocoding results found for:', { postalCode, city });
    return null;
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
}
