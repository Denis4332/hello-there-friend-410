import { supabase } from '@/integrations/supabase/client';

/**
 * Result type for geolocation detection
 * @property {string} city - Detected city name (e.g., "Zürich")
 * @property {string} canton - Detected canton name or abbreviation (e.g., "Zürich" or "ZH")
 * @property {string} postalCode - Swiss postal code (PLZ)
 * @property {string} [street] - Optional street address with house number
 * @property {number} lat - GPS latitude coordinate
 * @property {number} lng - GPS longitude coordinate
 */
interface GeolocationResult {
  city: string;
  canton: string;
  postalCode: string;
  street?: string;
  lat: number;
  lng: number;
}

/**
 * Look up the correct city name from the database using postal code
 * This ensures we get the exact city name with canton suffix (e.g., "Stein AG")
 * instead of the simplified Nominatim name (e.g., "Stein")
 */
async function lookupCityByPostalCode(postalCode: string, cantonAbbreviation?: string): Promise<{
  name: string;
  lat: number | null;
  lng: number | null;
} | null> {
  try {
    // First try with canton for accuracy (handles PLZ in multiple cantons)
    if (cantonAbbreviation) {
      const { data: cityWithCanton } = await supabase
        .from('cities')
        .select('name, lat, lng, canton:cantons!inner(abbreviation)')
        .eq('postal_code', postalCode)
        .eq('cantons.abbreviation', cantonAbbreviation)
        .maybeSingle();
      
      if (cityWithCanton) {
        return { name: cityWithCanton.name, lat: cityWithCanton.lat, lng: cityWithCanton.lng };
      }
    }
    
    // Fallback: just PLZ
    const { data: cityByPlz } = await supabase
      .from('cities')
      .select('name, lat, lng')
      .eq('postal_code', postalCode)
      .maybeSingle();
    
    if (cityByPlz) {
      return { name: cityByPlz.name, lat: cityByPlz.lat, lng: cityByPlz.lng };
    }
    
    return null;
  } catch (error) {
    console.error('City lookup failed:', error);
    return null;
  }
}

/**
 * Detects the user's current location using the browser's Geolocation API
 * and performs reverse geocoding via OpenStreetMap Nominatim.
 * Then looks up the correct city name from the database.
 * 
 * @throws {Error} "Geolocation wird von deinem Browser nicht unterstützt" - Browser lacks geolocation support
 * @throws {Error} "Standort-Zugriff wurde verweigert" - User denied location permission
 * @throws {Error} "Standort ist nicht verfügbar" - Position cannot be determined
 * @throws {Error} "Zeitüberschreitung bei Standort-Ermittlung" - Request timeout (10s)
 * @throws {Error} "Stadt konnte nicht ermittelt werden" - Nominatim response lacks city data
 * @throws {Error} "Standort konnte nicht verarbeitet werden" - Nominatim API error
 * 
 * @returns {Promise<GeolocationResult>} Location details with GPS coordinates and address
 * 
 * @example
 * ```typescript
 * try {
 *   const location = await detectLocation();
 *   console.log(`Du bist in ${location.city}, ${location.canton}`);
 *   console.log(`GPS: ${location.lat}, ${location.lng}`);
 * } catch (error) {
 *   toast.error(error.message);
 * }
 * ```
 */
export const detectLocation = async (): Promise<GeolocationResult> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation wird von deinem Browser nicht unterstützt'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use Nominatim for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'de',
              },
            }
          );

          if (!response.ok) {
            throw new Error('Standort konnte nicht ermittelt werden');
          }

          const data = await response.json();
          const address = data.address;

          // Extract city name (try different fields)
          const nominatimCity =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            '';

          // Extract canton (state in OSM)
          const canton = address.state || '';

          // Extract postal code
          const postalCode = address.postcode || '';
          
          // Extract street address (optional)
          const street = address.road 
            ? `${address.road}${address.house_number ? ' ' + address.house_number : ''}`
            : undefined;

          if (!nominatimCity && !postalCode) {
            throw new Error('Stadt konnte nicht ermittelt werden');
          }

          // Find canton abbreviation for DB lookup
          let cantonAbbreviation: string | undefined;
          if (canton) {
            const { data: cantonData } = await supabase
              .from('cantons')
              .select('abbreviation')
              .or(`name.ilike.%${canton}%,abbreviation.ilike.${canton}`)
              .maybeSingle();
            cantonAbbreviation = cantonData?.abbreviation;
          }

          // Look up correct city name from database using PLZ
          // This gets the full name with canton suffix (e.g., "Stein AG" instead of "Stein")
          let finalCity = nominatimCity;
          let finalLat = latitude;
          let finalLng = longitude;

          if (postalCode) {
            const dbCity = await lookupCityByPostalCode(postalCode, cantonAbbreviation);
            if (dbCity) {
              finalCity = dbCity.name; // Use DB name: "Stein AG" instead of "Stein"
              // Use DB coordinates for consistency
              if (dbCity.lat && dbCity.lng) {
                finalLat = dbCity.lat;
                finalLng = dbCity.lng;
              }
            }
          }

          resolve({
            city: finalCity,
            canton,
            postalCode,
            street,
            lat: finalLat,
            lng: finalLng,
          });
        } catch (error) {
          reject(new Error('Standort konnte nicht verarbeitet werden'));
        }
      },
      (error) => {
        let message = 'Standort konnte nicht ermittelt werden';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Standort-Zugriff wurde verweigert';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Standort ist nicht verfügbar';
        } else if (error.code === error.TIMEOUT) {
          message = 'Zeitüberschreitung bei Standort-Ermittlung';
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
