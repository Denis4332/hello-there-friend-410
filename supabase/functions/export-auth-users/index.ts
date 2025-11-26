import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin user authorized, fetching auth users...');

    // Fetch all auth users with pagination
    let allUsers: any[] = [];
    let page = 1;
    const perPage = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error('Error fetching users page', page, error);
        throw error;
      }

      if (data.users.length > 0) {
        allUsers = allUsers.concat(data.users);
        console.log(`Fetched page ${page}, total users so far: ${allUsers.length}`);
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log(`Total auth users fetched: ${allUsers.length}`);

    // Prepare export data with import script
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        total_users: allUsers.length,
        export_source: 'ESCORIA Platform - Lovable Cloud',
        security_warning: '⚠️ THIS FILE CONTAINS SENSITIVE DATA INCLUDING PASSWORD HASHES. STORE SECURELY AND DELETE AFTER SUCCESSFUL IMPORT.',
      },
      users: allUsers.map(user => ({
        id: user.id,
        email: user.email,
        encrypted_password: user.encrypted_password,
        email_confirmed_at: user.email_confirmed_at,
        phone: user.phone,
        phone_confirmed_at: user.phone_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_sign_in_at: user.last_sign_in_at,
        raw_user_meta_data: user.raw_user_meta_data,
        raw_app_meta_data: user.raw_app_meta_data,
        is_super_admin: user.is_super_admin,
        role: user.role,
      })),
      import_instructions: {
        step_1: 'Install dependencies: npm install @supabase/supabase-js',
        step_2: 'Set environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY for NEW project',
        step_3: 'Run the import script below using Node.js',
        step_4: 'Verify all users have been imported successfully',
        step_5: 'DELETE this export file after successful import',
        important_notes: [
          'Import auth users BEFORE importing other tables (profiles, etc.)',
          'User IDs remain the same, maintaining all foreign key relationships',
          'Passwords remain valid - users do NOT need to re-register',
          'Email confirmation status is preserved',
        ],
      },
      import_script: `
// Import script for new Supabase project
// Usage: node import-auth-users.js
// Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function importUsers() {
  const exportData = JSON.parse(fs.readFileSync('auth-users-export.json', 'utf8'));
  
  console.log(\`Importing \${exportData.users.length} users...\`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of exportData.users) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        id: user.id,
        email: user.email,
        password: user.encrypted_password,
        email_confirm: !!user.email_confirmed_at,
        phone: user.phone,
        phone_confirm: !!user.phone_confirmed_at,
        user_metadata: user.raw_user_meta_data || {},
        app_metadata: user.raw_app_meta_data || {},
      });
      
      if (error) {
        console.error(\`Failed to import user \${user.email}:\`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 100 === 0) {
          console.log(\`Progress: \${successCount} users imported...\`);
        }
      }
    } catch (err) {
      console.error(\`Exception importing user \${user.email}:\`, err);
      errorCount++;
    }
  }
  
  console.log(\`\\nImport complete!\`);
  console.log(\`✅ Successfully imported: \${successCount}\`);
  console.log(\`❌ Failed: \${errorCount}\`);
  console.log(\`\\n⚠️  REMEMBER TO DELETE auth-users-export.json AFTER VERIFICATION\`);
}

importUsers().catch(console.error);
`,
    };

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `auth-users-export_${timestamp}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in export-auth-users function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to export auth users. Check edge function logs for details.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
