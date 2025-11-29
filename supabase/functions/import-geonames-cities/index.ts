import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import JSZip from 'https://esm.sh/jszip@3.10.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeoNamesEntry {
  postalCode: string;
  placeName: string;
  adminCode1: string; // Canton abbreviation (ZH, BE, etc.)
  latitude: number;
  longitude: number;
}

interface Canton {
  id: string;
  abbreviation: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🚀 Starting GeoNames Swiss cities import...');

    // Step 1: Download CH.zip from GeoNames
    console.log('📥 Downloading CH.zip from GeoNames...');
    const geoNamesUrl = 'https://download.geonames.org/export/zip/CH.zip';
    const response = await fetch(geoNamesUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download GeoNames data: ${response.statusText}`);
    }

    const zipBuffer = await response.arrayBuffer();
    console.log(`📦 Downloaded ${(zipBuffer.byteLength / 1024).toFixed(1)} KB`);

    // Step 2: Unzip and extract CH.txt
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBuffer);
    const chFile = zipContent.file('CH.txt');
    
    if (!chFile) {
      throw new Error('CH.txt not found in ZIP file');
    }

    const csvContent = await chFile.async('string');
    console.log('📄 Extracted CH.txt');

    // Step 3: Get all cantons from database
    const { data: cantons, error: cantonsError } = await supabase
      .from('cantons')
      .select('id, abbreviation');

    if (cantonsError) {
      throw new Error(`Failed to fetch cantons: ${cantonsError.message}`);
    }

    const cantonMap = new Map<string, string>();
    (cantons as Canton[]).forEach(c => {
      cantonMap.set(c.abbreviation, c.id);
    });
    console.log(`📍 Loaded ${cantons.length} cantons`);

    // Step 4: Parse TAB-separated data
    // Format: country_code, postal_code, place_name, admin_name1, admin_code1, admin_name2, admin_code2, admin_name3, admin_code3, latitude, longitude, accuracy
    const lines = csvContent.split('\n').filter(line => line.trim());
    const entries: GeoNamesEntry[] = [];
    
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 11) {
        const postalCode = parts[1];
        const placeName = parts[2];
        const adminCode1 = parts[4]; // Canton abbreviation
        const latitude = parseFloat(parts[9]);
        const longitude = parseFloat(parts[10]);

        if (placeName && adminCode1 && !isNaN(latitude) && !isNaN(longitude)) {
          entries.push({
            postalCode,
            placeName,
            adminCode1,
            latitude,
            longitude,
          });
        }
      }
    }

    console.log(`📊 Parsed ${entries.length} entries from GeoNames`);

    // Step 5: Deduplicate by place_name + canton (keep first occurrence with coordinates)
    const uniqueCities = new Map<string, GeoNamesEntry>();
    for (const entry of entries) {
      const key = `${entry.placeName.toLowerCase()}_${entry.adminCode1}`;
      if (!uniqueCities.has(key)) {
        uniqueCities.set(key, entry);
      }
    }

    console.log(`🔄 Deduplicated to ${uniqueCities.size} unique cities`);

    // Step 6: Prepare cities for upsert
    const citiesToInsert: Array<{
      name: string;
      slug: string;
      canton_id: string;
      postal_code: string;
      lat: number;
      lng: number;
    }> = [];

    let skippedNoCantonId = 0;

    for (const entry of uniqueCities.values()) {
      const cantonId = cantonMap.get(entry.adminCode1);
      
      if (!cantonId) {
        skippedNoCantonId++;
        continue;
      }

      // Create unique slug: placename-canton-plz (to avoid duplicates)
      const baseSlug = entry.placeName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Make slug unique by adding canton and PLZ
      const slug = `${baseSlug}-${entry.adminCode1.toLowerCase()}-${entry.postalCode}`;

      citiesToInsert.push({
        name: entry.placeName,
        slug: slug,
        canton_id: cantonId,
        postal_code: entry.postalCode,
        lat: entry.latitude,
        lng: entry.longitude,
      });
    }

    console.log(`📝 Prepared ${citiesToInsert.length} cities for insert (skipped ${skippedNoCantonId} due to unknown canton)`);

    // Step 7: Delete ALL existing cities first (clean slate)
    console.log('🗑️ Clearing existing cities...');
    const { error: deleteError } = await supabase
      .from('cities')
      .delete()
      .gte('created_at', '1900-01-01'); // Delete all rows

    if (deleteError) {
      console.error('Delete error:', deleteError.message);
      throw new Error(`Failed to clear cities: ${deleteError.message}`);
    }
    console.log('✅ Cities table cleared');

    // Step 8: Insert in batches of 200 (smaller batches for reliability)
    const batchSize = 200;
    let insertedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < citiesToInsert.length; i += batchSize) {
      const batch = citiesToInsert.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('cities')
        .insert(batch);

      if (insertError) {
        console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, insertError.message);
        errors.push(insertError.message);
        errorCount += batch.length;
      } else {
        insertedCount += batch.length;
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(citiesToInsert.length / batchSize)} (${insertedCount}/${citiesToInsert.length})`);
      }
    }
    
    if (errors.length > 0) {
      console.log('First 3 errors:', errors.slice(0, 3));
    }

    // Step 9: Update profiles without GPS coordinates
    console.log('🔄 Updating profiles without GPS...');
    const { data: profilesWithoutGPS, error: profilesError } = await supabase
      .from('profiles')
      .select('id, city, canton')
      .or('lat.is.null,lng.is.null');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    let updatedProfiles = 0;
    if (profilesWithoutGPS && profilesWithoutGPS.length > 0) {
      for (const profile of profilesWithoutGPS) {
        // Find city in our new cities table
        const { data: cityData } = await supabase
          .from('cities')
          .select('lat, lng')
          .ilike('name', profile.city)
          .limit(1)
          .maybeSingle();

        if (cityData && cityData.lat && cityData.lng) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ lat: cityData.lat, lng: cityData.lng })
            .eq('id', profile.id);

          if (!updateError) {
            updatedProfiles++;
          }
        }
      }
    }

    // Step 10: Get final counts
    const { count: totalCities } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true });

    const { count: citiesWithGPS } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true })
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    const { count: profilesStillWithoutGPS } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('lat.is.null,lng.is.null');

    const result = {
      success: true,
      message: 'GeoNames import completed successfully',
      stats: {
        geoNamesEntriesParsed: entries.length,
        uniqueCitiesFound: uniqueCities.size,
        citiesInserted: insertedCount,
        citiesWithErrors: errorCount,
        totalCitiesInDB: totalCities,
        citiesWithGPS: citiesWithGPS,
        profilesUpdated: updatedProfiles,
        profilesStillWithoutGPS: profilesStillWithoutGPS,
      },
    };

    console.log('🎉 Import completed!', JSON.stringify(result.stats, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Import failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
