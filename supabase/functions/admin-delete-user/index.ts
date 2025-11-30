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
    
    // Create Supabase client with service role key for full access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser }, error: adminError } = await supabaseAdmin.auth.getUser(token);

    if (adminError || !adminUser) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .single();

    if (roleError || !adminRole || adminRole.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Get user ID to delete from request body
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Prevent deleting yourself
    if (userId === adminUser.id) {
      throw new Error('Cannot delete your own account');
    }

    console.log(`Admin ${adminUser.id} deleting user: ${userId}`);

    const deletionLog: string[] = [];

    // 1. Get all profiles for this user
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId);

    const profileIds = profiles?.map(p => p.id) || [];

    if (profileIds.length > 0) {
      // 2. Delete verification submissions
      const { error: verificationError } = await supabaseAdmin
        .from('verification_submissions')
        .delete()
        .in('profile_id', profileIds);
      
      if (!verificationError) deletionLog.push('verification_submissions deleted');

      // 2b. Delete AGB acceptances
      const { error: agbError } = await supabaseAdmin
        .from('agb_acceptances')
        .delete()
        .in('profile_id', profileIds);
      
      if (!agbError) deletionLog.push('agb_acceptances deleted');

      // 3. Delete profile views
      const { error: viewsError } = await supabaseAdmin
        .from('profile_views')
        .delete()
        .in('profile_id', profileIds);
      
      if (!viewsError) deletionLog.push('profile_views deleted');

      // 4. Delete profile contacts
      const { error: contactsError } = await supabaseAdmin
        .from('profile_contacts')
        .delete()
        .in('profile_id', profileIds);
      
      if (!contactsError) deletionLog.push('profile_contacts deleted');

      // 5. Delete profile categories
      const { error: categoriesError } = await supabaseAdmin
        .from('profile_categories')
        .delete()
        .in('profile_id', profileIds);
      
      if (!categoriesError) deletionLog.push('profile_categories deleted');

      // 6. Delete moderation notes
      const { error: notesError } = await supabaseAdmin
        .from('profile_moderation_notes')
        .delete()
        .in('profile_id', profileIds);
      
      if (!notesError) deletionLog.push('profile_moderation_notes deleted');

      // 7. Delete reports
      const { error: reportsError } = await supabaseAdmin
        .from('reports')
        .delete()
        .in('profile_id', profileIds);
      
      if (!reportsError) deletionLog.push('reports deleted');

      // 8. Delete favorites
      const { error: favoritesError } = await supabaseAdmin
        .from('user_favorites')
        .delete()
        .in('profile_id', profileIds);
      
      if (!favoritesError) deletionLog.push('user_favorites deleted');

      // 9. Get photo storage paths before deleting
      const { data: photos } = await supabaseAdmin
        .from('photos')
        .select('storage_path')
        .in('profile_id', profileIds);

      // 10. Delete photos from storage
      if (photos && photos.length > 0) {
        const storagePaths = photos.map(p => p.storage_path);
        const { error: storageError } = await supabaseAdmin
          .storage
          .from('profile-photos')
          .remove(storagePaths);
        
        if (!storageError) deletionLog.push(`${storagePaths.length} photos deleted from storage`);
      }

      // 11. Delete photos records
      const { error: photosError } = await supabaseAdmin
        .from('photos')
        .delete()
        .in('profile_id', profileIds);
      
      if (!photosError) deletionLog.push('photos records deleted');

      // 12. Delete profiles
      const { error: profilesError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (!profilesError) deletionLog.push('profiles deleted');
    }

    // 13. Delete reports created by this user
    const { error: userReportsError } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('reporter_user_id', userId);
    
    if (!userReportsError) deletionLog.push('user reports deleted');

    // 14. Delete user's favorites
    const { error: userFavoritesError } = await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('user_id', userId);
    
    if (!userFavoritesError) deletionLog.push('user favorites deleted');

    // 15. Delete user_roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (!rolesError) deletionLog.push('user_roles deleted');

    // 16. Finally delete the auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }

    deletionLog.push('auth.users deleted');

    console.log('Admin user deletion complete:', deletionLog);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Nutzer und alle Daten erfolgreich gelöscht',
        deleted: deletionLog 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in admin-delete-user:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
