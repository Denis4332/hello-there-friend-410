import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header to verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // List of buckets to export
    const buckets = ['profile-photos', 'site-assets', 'advertisements', 'verification-photos'];
    const allFiles: any[] = [];

    for (const bucket of buckets) {
      try {
        const { data: files, error } = await supabase.storage.from(bucket).list('', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

        if (error) {
          console.error(`Error listing bucket ${bucket}:`, error);
          allFiles.push({
            bucket,
            error: error.message
          });
          continue;
        }

        if (files && files.length > 0) {
          for (const file of files) {
            // Generate signed URL (valid for 7 days)
            const { data: signedUrl, error: urlError } = await supabase.storage
              .from(bucket)
              .createSignedUrl(file.name, 604800); // 7 days in seconds

            if (signedUrl) {
              allFiles.push({
                bucket,
                filename: file.name,
                size: file.metadata?.size || 0,
                created_at: file.created_at,
                signed_url: signedUrl.signedUrl,
                expires_at: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
                download_path: `${bucket}/${file.name}`
              });
            } else {
              console.error(`Error creating signed URL for ${bucket}/${file.name}:`, urlError);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing bucket ${bucket}:`, error);
      }
    }

    const exportData = {
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 604800000).toISOString(),
      total_files: allFiles.length,
      total_buckets: buckets.length,
      files: allFiles,
      download_instructions: {
        note: "Signed URLs are valid for 7 days",
        method_1: "Download files manually by opening each signed_url in browser",
        method_2: "Use a download manager or script to batch download all URLs",
        example_script: "wget -i urls.txt (create urls.txt with one signed_url per line)"
      },
      upload_instructions: {
        step_1: "Create storage buckets in new Supabase project",
        step_2: "Upload files to corresponding bucket using Supabase Dashboard or CLI",
        step_3: "Match the download_path structure (bucket/filename)"
      }
    };

    return new Response(
      JSON.stringify(exportData, null, 2),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="escoria_storage_urls_${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );
  } catch (error) {
    console.error('Error in export-storage-urls:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
