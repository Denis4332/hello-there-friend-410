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

    // Read migration files from supabase/migrations directory
    const migrationFiles: string[] = [];
    const migrationsPath = Deno.cwd() + '/supabase/migrations';
    
    try {
      for await (const entry of Deno.readDir(migrationsPath)) {
        if (entry.isFile && entry.name.endsWith('.sql')) {
          migrationFiles.push(entry.name);
        }
      }
    } catch (error) {
      console.error('Error reading migrations directory:', error);
    }

    // Sort migration files by timestamp
    migrationFiles.sort();

    // Combine all migration files
    let combinedSQL = `-- ESCORIA Platform - Complete Database Schema
-- Generated: ${new Date().toISOString()}
-- Total Migrations: ${migrationFiles.length}
-- 
-- Instructions:
-- 1. Create a new Supabase project
-- 2. Go to SQL Editor in Supabase Dashboard
-- 3. Paste and execute this entire SQL file
-- 4. Wait for completion (may take 1-2 minutes)
-- 
-- This includes:
-- - All table definitions
-- - All indexes and constraints
-- - All RLS policies
-- - All database functions and triggers
-- - Storage bucket configurations
--
-- ============================================================

`;

    for (const fileName of migrationFiles) {
      try {
        const filePath = `${migrationsPath}/${fileName}`;
        const content = await Deno.readTextFile(filePath);
        
        combinedSQL += `\n\n-- ============================================================\n`;
        combinedSQL += `-- Migration: ${fileName}\n`;
        combinedSQL += `-- ============================================================\n\n`;
        combinedSQL += content;
      } catch (error) {
        console.error(`Error reading migration file ${fileName}:`, error);
        combinedSQL += `\n\n-- ERROR: Could not read migration ${fileName}\n`;
      }
    }

    combinedSQL += `\n\n-- ============================================================\n`;
    combinedSQL += `-- End of Schema Export\n`;
    combinedSQL += `-- Total Migrations Applied: ${migrationFiles.length}\n`;
    combinedSQL += `-- ============================================================\n`;

    return new Response(
      combinedSQL,
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/sql',
          'Content-Disposition': `attachment; filename="escoria_complete_schema_${new Date().toISOString().split('T')[0]}.sql"`
        } 
      }
    );
  } catch (error) {
    console.error('Error in export-migrations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
