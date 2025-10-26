interface GeolocationResult {
  city: string;
  canton: string;
  postalCode: string;
  lat: number;
  lng: number;
}

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

          if (!city) {
            throw new Error('Stadt konnte nicht ermittelt werden');
          }

          resolve({
            city,
            canton,
            postalCode,
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
