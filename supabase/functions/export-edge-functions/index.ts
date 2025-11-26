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

    // Read edge functions from supabase/functions directory
    const functionsData: any[] = [];
    const functionsPath = Deno.cwd() + '/supabase/functions';
    
    try {
      for await (const entry of Deno.readDir(functionsPath)) {
        if (entry.isDirectory && entry.name !== '_shared') {
          const functionName = entry.name;
          const indexPath = `${functionsPath}/${functionName}/index.ts`;
          
          try {
            const code = await Deno.readTextFile(indexPath);
            functionsData.push({
              name: functionName,
              path: `supabase/functions/${functionName}/index.ts`,
              code: code,
              size: code.length
            });
          } catch (error) {
            console.error(`Error reading function ${functionName}:`, error);
            functionsData.push({
              name: functionName,
              path: `supabase/functions/${functionName}/index.ts`,
              error: 'Could not read function code'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error reading functions directory:', error);
    }

    // Sort by name
    functionsData.sort((a, b) => a.name.localeCompare(b.name));

    const exportData = {
      generated_at: new Date().toISOString(),
      total_functions: functionsData.length,
      functions: functionsData,
      deployment_instructions: {
        step_1: "Install Supabase CLI: npm install -g supabase",
        step_2: "Login to Supabase: supabase login",
        step_3: "Link your project: supabase link --project-ref YOUR_PROJECT_REF",
        step_4: "Deploy functions: supabase functions deploy",
        note: "Each function must be in its own directory under supabase/functions/"
      }
    };

    return new Response(
      JSON.stringify(exportData, null, 2),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="escoria_edge_functions_${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );
  } catch (error) {
    console.error('Error in export-edge-functions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
