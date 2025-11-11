import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Exporting data for user: ${user.id}`);

    // Collect all user data
    const exportData: any = {
      export_info: {
        user_id: user.id,
        email: user.email,
        export_date: new Date().toISOString(),
        format: 'GDPR-compliant JSON export',
      },
      account_data: {
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
      },
      profiles: [],
      photos: [],
      contacts: [],
      categories: [],
      statistics: {
        total_profile_views: 0,
        unique_viewers: 0,
      },
      reports_submitted: [],
    };

    // Get profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    } else if (profiles) {
      exportData.profiles = profiles;

      const profileIds = profiles.map(p => p.id);

      if (profileIds.length > 0) {
        // Get photos
        const { data: photos } = await supabaseAdmin
          .from('photos')
          .select('*')
          .in('profile_id', profileIds);

        if (photos) {
          // Generate public URLs for photos
          exportData.photos = photos.map(photo => ({
            ...photo,
            public_url: `${supabaseUrl}/storage/v1/object/public/profile-photos/${photo.storage_path}`,
          }));
        }

        // Get contacts
        const { data: contacts } = await supabaseAdmin
          .from('profile_contacts')
          .select('*')
          .in('profile_id', profileIds);

        if (contacts) {
          exportData.contacts = contacts;
        }

        // Get categories
        const { data: profileCategories } = await supabaseAdmin
          .from('profile_categories')
          .select(`
            category_id,
            categories (
              id,
              name,
              slug
            )
          `)
          .in('profile_id', profileIds);

        if (profileCategories) {
          exportData.categories = profileCategories;
        }

        // Get profile view statistics
        const { data: viewStats } = await supabaseAdmin
          .from('profile_views')
          .select('id, created_at, session_id, referrer')
          .in('profile_id', profileIds);

        if (viewStats) {
          exportData.statistics.total_profile_views = viewStats.length;
          exportData.statistics.unique_viewers = new Set(viewStats.map(v => v.session_id)).size;
          exportData.statistics.view_details = viewStats;
        }
      }
    }

    // Get reports submitted by user
    const { data: reports } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('reporter_user_id', user.id);

    if (reports) {
      exportData.reports_submitted = reports;
    }

    // Get user role
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    if (userRoles) {
      exportData.user_roles = userRoles;
    }

    // Get verification submissions
    if (exportData.profiles.length > 0) {
      const profileIds = exportData.profiles.map((p: any) => p.id);
      const { data: verifications } = await supabaseAdmin
        .from('verification_submissions')
        .select('id, status, submitted_at, reviewed_at, admin_note')
        .in('profile_id', profileIds);

      if (verifications) {
        exportData.verifications = verifications;
      }
    }

    console.log('Data export complete');

    return new Response(
      JSON.stringify(exportData, null, 2),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="escoria-daten-${user.id}-${Date.now()}.json"`,
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in export-user-data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
