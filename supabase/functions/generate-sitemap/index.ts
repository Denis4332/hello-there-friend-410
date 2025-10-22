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
    console.log('Starting sitemap generation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    console.log('Sitemap generated successfully');

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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
