import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search';

interface GeocodingResult {
  lat: number;
  lng: number;
}

async function geocodePlz(postalCode: string, city: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_API}?` +
      `postalcode=${encodeURIComponent(postalCode)}&` +
      `city=${encodeURIComponent(city)}&` +
      `country=Switzerland&` +
      `format=json&` +
      `limit=1`,
      {
        headers: {
          'User-Agent': 'Escoria/1.0'
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

    return null;
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active profiles without coordinates
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, city, postal_code')
      .eq('status', 'active')
      .is('lat', null)
      .is('lng', null)
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No profiles need geocoding', count: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    let successCount = 0;
    let failCount = 0;

    // Process each profile with rate limiting (1 request per second)
    for (const profile of profiles) {
      if (!profile.postal_code || !profile.city) {
        failCount++;
        continue;
      }

      const coords = await geocodePlz(profile.postal_code, profile.city);
      
      if (coords) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ lat: coords.lat, lng: coords.lng })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`Failed to update profile ${profile.id}:`, updateError);
          failCount++;
        } else {
          successCount++;
        }
      } else {
        failCount++;
      }

      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(
      JSON.stringify({
        message: 'Geocoding completed',
        total: profiles.length,
        success: successCount,
        failed: failCount
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
