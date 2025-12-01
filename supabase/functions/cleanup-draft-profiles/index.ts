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
    console.log('🧹 Starting cleanup of old draft profiles...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find draft profiles older than 7 days with no photos
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get profiles that are draft, older than 7 days
    const { data: draftProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, display_name, created_at')
      .eq('status', 'draft')
      .lt('created_at', sevenDaysAgo.toISOString());

    if (fetchError) {
      console.error('❌ Error fetching draft profiles:', fetchError);
      throw fetchError;
    }

    if (!draftProfiles || draftProfiles.length === 0) {
      console.log('✅ No old draft profiles to clean up');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No old draft profiles to clean up',
          deleted_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${draftProfiles.length} draft profiles older than 7 days`);

    // Filter to only profiles with no photos
    const profilesToDelete: string[] = [];
    
    for (const profile of draftProfiles) {
      const { data: photos, error: photoError } = await supabase
        .from('photos')
        .select('id')
        .eq('profile_id', profile.id)
        .limit(1);

      if (photoError) {
        console.error(`❌ Error checking photos for profile ${profile.id}:`, photoError);
        continue;
      }

      if (!photos || photos.length === 0) {
        profilesToDelete.push(profile.id);
        console.log(`🗑️ Marking for deletion: ${profile.display_name} (${profile.id}), created: ${profile.created_at}`);
      }
    }

    if (profilesToDelete.length === 0) {
      console.log('✅ All draft profiles have photos, nothing to delete');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All draft profiles have photos',
          deleted_count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🗑️ Deleting ${profilesToDelete.length} draft profiles...`);

    // Delete associated data for each profile
    for (const profileId of profilesToDelete) {
      // Delete profile categories
      await supabase.from('profile_categories').delete().eq('profile_id', profileId);
      
      // Delete profile contacts
      await supabase.from('profile_contacts').delete().eq('profile_id', profileId);
      
      // Delete profile moderation notes
      await supabase.from('profile_moderation_notes').delete().eq('profile_id', profileId);
      
      // Delete profile views
      await supabase.from('profile_views').delete().eq('profile_id', profileId);
      
      // Delete reports
      await supabase.from('reports').delete().eq('profile_id', profileId);
      
      // Delete favorites
      await supabase.from('user_favorites').delete().eq('profile_id', profileId);
      
      // Delete verification submissions
      await supabase.from('verification_submissions').delete().eq('profile_id', profileId);
      
      // Delete AGB acceptances
      await supabase.from('agb_acceptances').delete().eq('profile_id', profileId);
    }

    // Delete the profiles themselves
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .in('id', profilesToDelete);

    if (deleteError) {
      console.error('❌ Error deleting profiles:', deleteError);
      throw deleteError;
    }

    console.log(`✅ Successfully deleted ${profilesToDelete.length} old draft profiles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${profilesToDelete.length} old draft profiles`,
        deleted_count: profilesToDelete.length,
        deleted_profile_ids: profilesToDelete
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Cleanup failed';
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
