import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🗺️ Starting sitemap generation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client for database queries
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Client with service role for storage operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check if we have a recent sitemap in storage (less than 24 hours old)
    const { data: existingFile, error: fileError } = await supabaseAdmin
      .storage
      .from('sitemaps')
      .list('', { limit: 1, search: 'sitemap.xml' });

    if (!fileError && existingFile && existingFile.length > 0) {
      const fileAge = Date.now() - new Date(existingFile[0].updated_at || existingFile[0].created_at).getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (fileAge < twentyFourHours) {
        console.log('✅ Using cached sitemap (age: ' + Math.round(fileAge / 1000 / 60) + ' minutes)');
        
        // Return the cached sitemap
        const { data: cachedSitemap } = await supabaseAdmin
          .storage
          .from('sitemaps')
          .download('sitemap.xml');

        if (cachedSitemap) {
          const xml = await cachedSitemap.text();
          return new Response(xml, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/xml; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }
    }

    console.log('🔄 Generating fresh sitemap...');

    // Fetch all active profiles with slugs
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('slug, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Fetch all active categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('slug')
      .eq('active', true)
      .order('name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      throw categoriesError;
    }

    // Fetch all distinct cities with active profiles
    const { data: cities, error: citiesError } = await supabase
      .from('profiles')
      .select('city')
      .eq('status', 'active');

    if (citiesError) {
      console.error('Error fetching cities:', citiesError);
      throw citiesError;
    }

    // Get unique cities and generate slugs
    const uniqueCities = [...new Set(cities?.map(c => c.city) || [])];
    const cityData = uniqueCities.map(city => ({
      city,
      slug: city.toLowerCase()
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }));

    console.log(`Found ${profiles?.length || 0} profiles, ${categories?.length || 0} categories, ${cityData.length} cities`);

    // Generate XML sitemap
    const baseUrl = 'https://escoria.ch';
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Static pages - high priority
    const staticPages = [
      { path: '/suche', priority: '0.9' },
      { path: '/staedte', priority: '0.9' },
      { path: '/kategorien', priority: '0.9' },
    ];

    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Profiles - with lastmod
    profiles?.forEach(profile => {
      if (profile.slug) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/profil/${profile.slug}</loc>\n`;
        if (profile.updated_at) {
          const lastmod = new Date(profile.updated_at).toISOString().split('T')[0];
          xml += `    <lastmod>${lastmod}</lastmod>\n`;
        }
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }
    });

    // Cities
    cityData.forEach(city => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/stadt/${city.slug}</loc>\n`;
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    // Categories
    categories?.forEach(category => {
      if (category.slug) {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/kategorie/${category.slug}</loc>\n`;
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }
    });

    // Footer pages - lower priority
    const footerPages = [
      { path: '/kontakt', priority: '0.7' },
      { path: '/agb', priority: '0.5' },
      { path: '/datenschutz', priority: '0.5' },
    ];

    footerPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    // Save to storage
    console.log('💾 Saving sitemap to storage...');
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('sitemaps')
      .upload('sitemap.xml', xml, {
        contentType: 'application/xml',
        upsert: true,
      });

    if (uploadError) {
      console.error('⚠️ Error saving to storage:', uploadError);
      // Continue anyway - we can still return the generated sitemap
    } else {
      console.log('✅ Sitemap saved to storage');
    }

    console.log('✅ Sitemap generated successfully');

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
