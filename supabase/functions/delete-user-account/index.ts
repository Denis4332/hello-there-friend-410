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

    console.log(`Starting account deletion for user: ${user.id}`);

    // Delete data in order (respecting foreign key constraints)
    const deletionLog: string[] = [];

    // 1. Delete verification submissions
    const { error: verificationError } = await supabaseAdmin
      .from('verification_submissions')
      .delete()
      .eq('profile_id', user.id);
    
    if (verificationError) {
      console.error('Error deleting verifications:', verificationError);
    } else {
      deletionLog.push('verification_submissions deleted');
    }

    // 2. Delete reports (as reporter)
    const { error: reportsError } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('reporter_user_id', user.id);
    
    if (reportsError) {
      console.error('Error deleting reports:', reportsError);
    } else {
      deletionLog.push('reports deleted');
    }

    // 3. Get profile ID first
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id);

    const profileIds = profiles?.map(p => p.id) || [];

    if (profileIds.length > 0) {
      // 4. Delete profile views
      const { error: viewsError } = await supabaseAdmin
        .from('profile_views')
        .delete()
        .in('profile_id', profileIds);
      
      if (viewsError) {
        console.error('Error deleting profile views:', viewsError);
      } else {
        deletionLog.push('profile_views deleted');
      }

      // 5. Delete profile contacts
      const { error: contactsError } = await supabaseAdmin
        .from('profile_contacts')
        .delete()
        .in('profile_id', profileIds);
      
      if (contactsError) {
        console.error('Error deleting profile contacts:', contactsError);
      } else {
        deletionLog.push('profile_contacts deleted');
      }

      // 6. Delete profile categories
      const { error: categoriesError } = await supabaseAdmin
        .from('profile_categories')
        .delete()
        .in('profile_id', profileIds);
      
      if (categoriesError) {
        console.error('Error deleting profile categories:', categoriesError);
      } else {
        deletionLog.push('profile_categories deleted');
      }

      // 7. Get photo storage paths before deleting
      const { data: photos } = await supabaseAdmin
        .from('photos')
        .select('storage_path')
        .in('profile_id', profileIds);

      // 8. Delete photos from storage
      if (photos && photos.length > 0) {
        const storagePaths = photos.map(p => p.storage_path);
        const { error: storageError } = await supabaseAdmin
          .storage
          .from('profile-photos')
          .remove(storagePaths);
        
        if (storageError) {
          console.error('Error deleting photos from storage:', storageError);
        } else {
          deletionLog.push(`${storagePaths.length} photos deleted from storage`);
        }
      }

      // 9. Delete photos records
      const { error: photosError } = await supabaseAdmin
        .from('photos')
        .delete()
        .in('profile_id', profileIds);
      
      if (photosError) {
        console.error('Error deleting photos records:', photosError);
      } else {
        deletionLog.push('photos records deleted');
      }

      // 10. Delete profiles
      const { error: profilesError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('user_id', user.id);
      
      if (profilesError) {
        console.error('Error deleting profiles:', profilesError);
      } else {
        deletionLog.push('profiles deleted');
      }
    }

    // 11. Delete user_roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);
    
    if (rolesError) {
      console.error('Error deleting user roles:', rolesError);
    } else {
      deletionLog.push('user_roles deleted');
    }

    // 12. Finally delete the auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (authDeleteError) {
      throw new Error(`Failed to delete auth user: ${authDeleteError.message}`);
    }

    deletionLog.push('auth.users deleted');

    console.log('Account deletion complete:', deletionLog);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account erfolgreich gelöscht',
        deleted: deletionLog 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in delete-user-account:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
