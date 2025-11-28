import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Swiss Canton coordinates center points (for fallback)
const CANTON_CENTERS: Record<string, { lat: number; lng: number }> = {
  'AG': { lat: 47.4500, lng: 8.2100 },
  'AI': { lat: 47.3317, lng: 9.4083 },
  'AR': { lat: 47.3864, lng: 9.2792 },
  'BE': { lat: 46.9480, lng: 7.4474 },
  'BL': { lat: 47.4833, lng: 7.7333 },
  'BS': { lat: 47.5596, lng: 7.5886 },
  'FR': { lat: 46.8065, lng: 7.1620 },
  'GE': { lat: 46.2044, lng: 6.1432 },
  'GL': { lat: 47.0411, lng: 9.0678 },
  'GR': { lat: 46.8508, lng: 9.5320 },
  'JU': { lat: 47.3659, lng: 7.3456 },
  'LU': { lat: 47.0502, lng: 8.3093 },
  'NE': { lat: 46.9920, lng: 6.9311 },
  'NW': { lat: 46.9578, lng: 8.3650 },
  'OW': { lat: 46.8964, lng: 8.2453 },
  'SG': { lat: 47.4245, lng: 9.3767 },
  'SH': { lat: 47.6961, lng: 8.6350 },
  'SO': { lat: 47.2088, lng: 7.5378 },
  'SZ': { lat: 47.0208, lng: 8.6569 },
  'TG': { lat: 47.5531, lng: 9.2475 },
  'TI': { lat: 46.0037, lng: 8.9511 },
  'UR': { lat: 46.8808, lng: 8.6386 },
  'VD': { lat: 46.5197, lng: 6.6323 },
  'VS': { lat: 46.2333, lng: 7.3500 },
  'ZG': { lat: 47.1724, lng: 8.5174 },
  'ZH': { lat: 47.3769, lng: 8.5417 },
};

// Pre-computed coordinates for major Swiss cities (most common)
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Zürich': { lat: 47.3769, lng: 8.5417 },
  'Genève': { lat: 46.2044, lng: 6.1432 },
  'Genf': { lat: 46.2044, lng: 6.1432 },
  'Basel': { lat: 47.5596, lng: 7.5886 },
  'Bern': { lat: 46.9480, lng: 7.4474 },
  'Lausanne': { lat: 46.5197, lng: 6.6323 },
  'Winterthur': { lat: 47.4984, lng: 8.7235 },
  'Luzern': { lat: 47.0502, lng: 8.3093 },
  'St. Gallen': { lat: 47.4245, lng: 9.3767 },
  'Lugano': { lat: 46.0037, lng: 8.9511 },
  'Biel/Bienne': { lat: 47.1368, lng: 7.2467 },
  'Thun': { lat: 46.7580, lng: 7.6280 },
  'Köniz': { lat: 46.9242, lng: 7.4153 },
  'La Chaux-de-Fonds': { lat: 47.1038, lng: 6.8256 },
  'Schaffhausen': { lat: 47.6961, lng: 8.6350 },
  'Fribourg': { lat: 46.8065, lng: 7.1620 },
  'Chur': { lat: 46.8508, lng: 9.5320 },
  'Neuchâtel': { lat: 46.9920, lng: 6.9311 },
  'Sion': { lat: 46.2333, lng: 7.3500 },
  'Uster': { lat: 47.3474, lng: 8.7217 },
  'Emmen': { lat: 47.0833, lng: 8.2833 },
  'Zug': { lat: 47.1724, lng: 8.5174 },
  'Dübendorf': { lat: 47.3972, lng: 8.6181 },
  'Kriens': { lat: 47.0333, lng: 8.2833 },
  'Dietikon': { lat: 47.4044, lng: 8.4001 },
  'Rapperswil-Jona': { lat: 47.2269, lng: 8.8182 },
  'Montreux': { lat: 46.4312, lng: 6.9107 },
  'Wetzikon': { lat: 47.3260, lng: 8.7979 },
  'Aarau': { lat: 47.3887, lng: 8.0483 },
  'Baden': { lat: 47.4721, lng: 8.2914 },
  'Carouge': { lat: 46.1833, lng: 6.1397 },
  'Wädenswil': { lat: 47.2307, lng: 8.6717 },
  'Frauenfeld': { lat: 47.5531, lng: 9.2475 },
  'Meyrin': { lat: 46.2333, lng: 6.0833 },
  'Wil': { lat: 47.4611, lng: 9.0456 },
  'Allschwil': { lat: 47.5500, lng: 7.5333 },
  'Baar': { lat: 47.1967, lng: 8.5283 },
  'Horgen': { lat: 47.2592, lng: 8.5986 },
  'Bulle': { lat: 46.6192, lng: 7.0578 },
  'Reinach': { lat: 47.4933, lng: 7.5917 },
  'Olten': { lat: 47.3520, lng: 7.9078 },
  'Kreuzlingen': { lat: 47.6467, lng: 9.1750 },
  'Muttenz': { lat: 47.5222, lng: 7.6444 },
  'Bülach': { lat: 47.5214, lng: 8.5392 },
  'Pratteln': { lat: 47.5217, lng: 7.6917 },
  'Renens': { lat: 46.5397, lng: 6.5878 },
  'Nyon': { lat: 46.3833, lng: 6.2333 },
  'Kloten': { lat: 47.4515, lng: 8.5849 },
  'Vevey': { lat: 46.4628, lng: 6.8419 },
  'Vernier': { lat: 46.2167, lng: 6.0833 },
  'Onex': { lat: 46.1833, lng: 6.1000 },
  'Schlieren': { lat: 47.3967, lng: 8.4478 },
  'Burgdorf': { lat: 47.0590, lng: 7.6280 },
  'Herisau': { lat: 47.3864, lng: 9.2792 },
  'Langenthal': { lat: 47.2150, lng: 7.7870 },
  'Schwyz': { lat: 47.0208, lng: 8.6569 },
  'Solothurn': { lat: 47.2088, lng: 7.5378 },
  'Bellinzona': { lat: 46.1953, lng: 9.0236 },
  'Locarno': { lat: 46.1667, lng: 8.8000 },
  'Spiez': { lat: 46.6850, lng: 7.6767 },
  'Interlaken': { lat: 46.6863, lng: 7.8632 },
  'Davos': { lat: 46.8003, lng: 9.8367 },
  'Zermatt': { lat: 46.0207, lng: 7.7491 },
  'Saas-Fee': { lat: 46.1100, lng: 7.9267 },
  'Grindelwald': { lat: 46.6244, lng: 8.0414 },
  'Engelberg': { lat: 46.8217, lng: 8.4017 },
  'Andermatt': { lat: 46.6333, lng: 8.5933 },
  'Arosa': { lat: 46.7833, lng: 9.6833 },
  'St. Moritz': { lat: 46.4986, lng: 9.8383 },
  'Ascona': { lat: 46.1544, lng: 8.7717 },
  'Martigny': { lat: 46.1028, lng: 7.0728 },
  'Sierre': { lat: 46.2917, lng: 7.5333 },
  'Monthey': { lat: 46.2547, lng: 6.9544 },
  'Delémont': { lat: 47.3659, lng: 7.3456 },
  'Porrentruy': { lat: 47.4153, lng: 7.0753 },
  'Grenchen': { lat: 47.1928, lng: 7.3953 },
  'Glarus': { lat: 47.0411, lng: 9.0678 },
  'Stans': { lat: 46.9578, lng: 8.3650 },
  'Sarnen': { lat: 46.8964, lng: 8.2453 },
  'Appenzell': { lat: 47.3317, lng: 9.4083 },
  'Altdorf': { lat: 46.8808, lng: 8.6386 },
  'Einsiedeln': { lat: 47.1267, lng: 8.7517 },
  'Gossau': { lat: 47.4167, lng: 9.2500 },
  'Ebikon': { lat: 47.0833, lng: 8.3417 },
  'Sursee': { lat: 47.1717, lng: 8.1083 },
  'Horw': { lat: 47.0167, lng: 8.3083 },
  'Hochdorf': { lat: 47.1683, lng: 8.2917 },
  'Cham': { lat: 47.1817, lng: 8.4633 },
  'Liestal': { lat: 47.4847, lng: 7.7344 },
  'Binningen': { lat: 47.5417, lng: 7.5667 },
  'Riehen': { lat: 47.5833, lng: 7.6500 },
  'Thalwil': { lat: 47.2925, lng: 8.5617 },
  'Küsnacht': { lat: 47.3192, lng: 8.5836 },
  'Meilen': { lat: 47.2700, lng: 8.6433 },
  'Stäfa': { lat: 47.2417, lng: 8.7250 },
  'Pfäffikon': { lat: 47.3650, lng: 8.7833 },
  'Rüti': { lat: 47.2567, lng: 8.8550 },
  'Affoltern am Albis': { lat: 47.2783, lng: 8.4517 },
  'Opfikon': { lat: 47.4319, lng: 8.5681 },
  'Wallisellen': { lat: 47.4150, lng: 8.5950 },
  'Regensdorf': { lat: 47.4342, lng: 8.4694 },
  'Adliswil': { lat: 47.3103, lng: 8.5244 },
  'Volketswil': { lat: 47.3917, lng: 8.6878 },
  'Bassersdorf': { lat: 47.4433, lng: 8.6283 },
  'Illnau-Effretikon': { lat: 47.4267, lng: 8.7083 },
  'Embrach': { lat: 47.5067, lng: 8.5950 },
  'Oberrieden': { lat: 47.2733, lng: 8.5783 },
  'Richterswil': { lat: 47.2067, lng: 8.6983 },
  'Männedorf': { lat: 47.2550, lng: 8.6983 },
  'Zollikon': { lat: 47.3417, lng: 8.5717 },
  'Erlenbach': { lat: 47.3050, lng: 8.5917 },
  'Langnau am Albis': { lat: 47.2883, lng: 8.5383 },
  'Egg': { lat: 47.2983, lng: 8.6867 },
  'Greifensee': { lat: 47.3683, lng: 8.6817 },
  'Uitikon': { lat: 47.3683, lng: 8.4550 },
  'Rümlang': { lat: 47.4517, lng: 8.5317 },
  // Add more as needed...
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/é|è|ê|ë/g, 'e')
    .replace(/à|â/g, 'a')
    .replace(/ô/g, 'o')
    .replace(/î|ï/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function geocodeLocality(name: string, postalCode: string, canton: string): Promise<{ lat: number; lng: number } | null> {
  // First check pre-computed coordinates
  const cleanName = name.replace(/\s*\d+$/, '').trim(); // Remove trailing numbers like "Lausanne 25"
  
  if (CITY_COORDINATES[cleanName]) {
    return CITY_COORDINATES[cleanName];
  }
  
  if (CITY_COORDINATES[name]) {
    return CITY_COORDINATES[name];
  }
  
  // Try Nominatim geocoding
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `postalcode=${encodeURIComponent(postalCode)}&` +
      `city=${encodeURIComponent(cleanName)}&` +
      `country=Switzerland&` +
      `format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'SwissDateApp/1.0 (contact@example.com)'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    }
  } catch (error) {
    console.error(`Geocoding failed for ${name}:`, error);
  }
  
  // Fallback to canton center
  if (CANTON_CENTERS[canton]) {
    console.log(`Using canton center for ${name} (${canton})`);
    return CANTON_CENTERS[canton];
  }
  
  return null;
}

async function fetchAllLocalities(): Promise<Array<{
  postalCode: string;
  name: string;
  canton: string;
}>> {
  const allLocalities: Array<{ postalCode: string; name: string; canton: string }> = [];
  
  // Fetch for each PLZ range (1000-9999)
  const plzRanges = ['1*', '2*', '3*', '4*', '5*', '6*', '7*', '8*', '9*'];
  
  for (const range of plzRanges) {
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const url = `https://openplzapi.org/ch/Localities?postalCode=${range}&page=${page}&pageSize=50`;
        console.log(`Fetching: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`Error fetching page ${page} for ${range}: ${response.status}`);
          hasMore = false;
          continue;
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
          hasMore = false;
          continue;
        }
        
        for (const item of data) {
          allLocalities.push({
            postalCode: item.postalCode,
            name: item.name,
            canton: item.canton?.shortName || ''
          });
        }
        
        if (data.length < 50) {
          hasMore = false;
        } else {
          page++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error fetching ${range} page ${page}:`, error);
        hasMore = false;
      }
    }
  }
  
  return allLocalities;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting comprehensive Swiss cities import...');
    
    // Fetch all cantons first
    const { data: cantons, error: cantonsError } = await supabase
      .from('cantons')
      .select('id, abbreviation');
    
    if (cantonsError) throw cantonsError;
    
    const cantonMap = new Map(cantons?.map(c => [c.abbreviation, c.id]) || []);
    console.log(`Found ${cantonMap.size} cantons`);
    
    // Fetch all localities from OpenPLZ API
    console.log('Fetching all localities from OpenPLZ API...');
    const localities = await fetchAllLocalities();
    console.log(`Fetched ${localities.length} localities from OpenPLZ API`);
    
    // Deduplicate by name+canton (keep unique cities, not duplicates for same city with different PLZ)
    const uniqueCities = new Map<string, { postalCode: string; name: string; canton: string }>();
    for (const loc of localities) {
      const key = `${loc.name.toLowerCase()}-${loc.canton}`;
      // Keep the one with the lowest/main postal code
      if (!uniqueCities.has(key) || loc.postalCode < uniqueCities.get(key)!.postalCode) {
        uniqueCities.set(key, loc);
      }
    }
    
    console.log(`Unique cities after deduplication: ${uniqueCities.size}`);
    
    // Delete existing cities
    const { error: deleteError } = await supabase
      .from('cities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.error('Error deleting existing cities:', deleteError);
    }
    
    // Process and insert cities in batches
    const cities = Array.from(uniqueCities.values());
    const batchSize = 50;
    let insertedCount = 0;
    let skippedCount = 0;
    let geocodedCount = 0;
    
    for (let i = 0; i < cities.length; i += batchSize) {
      const batch = cities.slice(i, i + batchSize);
      const cityRecords = [];
      
      for (const city of batch) {
        const cantonId = cantonMap.get(city.canton);
        if (!cantonId) {
          console.warn(`Unknown canton: ${city.canton} for ${city.name}`);
          skippedCount++;
          continue;
        }
        
        // Get coordinates
        const coords = await geocodeLocality(city.name, city.postalCode, city.canton);
        if (coords) {
          geocodedCount++;
        }
        
        cityRecords.push({
          name: city.name,
          postal_code: city.postalCode,
          canton_id: cantonId,
          lat: coords?.lat || null,
          lng: coords?.lng || null,
          slug: generateSlug(city.name)
        });
        
        // Small delay for geocoding rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (cityRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('cities')
          .insert(cityRecords);
        
        if (insertError) {
          console.error(`Error inserting batch starting at ${i}:`, insertError);
        } else {
          insertedCount += cityRecords.length;
          console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${cityRecords.length} cities (total: ${insertedCount})`);
        }
      }
    }
    
    // Update profiles with GPS coordinates from cities
    console.log('Updating profiles with GPS coordinates...');
    const { error: updateError } = await supabase.rpc('update_profiles_gps_from_cities');
    
    let profilesUpdated = 0;
    if (updateError) {
      console.log('RPC not available, trying manual update...');
      const { data: profilesToUpdate } = await supabase
        .from('profiles')
        .select('id, city')
        .or('lat.is.null,lng.is.null');
      
      if (profilesToUpdate) {
        for (const profile of profilesToUpdate) {
          const { data: cityData } = await supabase
            .from('cities')
            .select('lat, lng')
            .ilike('name', profile.city)
            .not('lat', 'is', null)
            .limit(1)
            .single();
          
          if (cityData) {
            await supabase
              .from('profiles')
              .update({ lat: cityData.lat, lng: cityData.lng })
              .eq('id', profile.id);
            profilesUpdated++;
          }
        }
      }
    }
    
    const result = {
      success: true,
      totalLocalities: localities.length,
      uniqueCities: uniqueCities.size,
      insertedCities: insertedCount,
      geocodedCities: geocodedCount,
      skippedCities: skippedCount,
      profilesUpdated
    };
    
    console.log('Import completed:', result);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Import error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
