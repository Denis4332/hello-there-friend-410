import { supabase } from '@/integrations/supabase/client';

/**
 * Result type for geolocation detection
 */
interface GeolocationResult {
  city: string;
  canton: string; // Abbreviation e.g. "ZH"
  postalCode: string;
  street?: string;
  lat: number;
  lng: number;
}

/**
 * Haversine distance in km between two GPS coordinates
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Detects the user's current location using Browser Geolocation API,
 * then finds the nearest city from the DB (no Nominatim dependency).
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
          // Load cities with canton info from DB
          const { data: cities, error } = await supabase
            .from('cities')
            .select('name, postal_code, lat, lng, canton:cantons!inner(abbreviation)');

          if (error || !cities || cities.length === 0) {
            throw new Error('Städte konnten nicht geladen werden');
          }

          // Find nearest city by Haversine
          let nearest = cities[0];
          let minDist = Infinity;

          for (const city of cities) {
            if (city.lat == null || city.lng == null) continue;
            const dist = haversineKm(latitude, longitude, Number(city.lat), Number(city.lng));
            if (dist < minDist) {
              minDist = dist;
              nearest = city;
            }
          }

          const cantonAbbr = (nearest.canton as any)?.abbreviation || '';

          resolve({
            city: nearest.name,
            canton: cantonAbbr,
            postalCode: nearest.postal_code || '',
            lat: nearest.lat ? Number(nearest.lat) : latitude,
            lng: nearest.lng ? Number(nearest.lng) : longitude,
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
