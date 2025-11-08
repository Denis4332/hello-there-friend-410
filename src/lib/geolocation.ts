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
 * Detects the user's current location using the browser's Geolocation API
 * and performs reverse geocoding via OpenStreetMap Nominatim.
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
          const city =
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

          if (!city) {
            throw new Error('Stadt konnte nicht ermittelt werden');
          }

          resolve({
            city,
            canton,
            postalCode,
            street,
            lat: latitude,
            lng: longitude,
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
