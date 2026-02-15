import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MediaValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
}

function validateImageMagicBytes(bytes: Uint8Array): MediaValidationResult {
  // Check JPEG magic bytes
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { valid: true, mimeType: 'image/jpeg' };
  }
  
  // Check PNG magic bytes
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A
  ) {
    return { valid: true, mimeType: 'image/png' };
  }
  
  // Check WebP magic bytes (RIFF....WEBP)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { valid: true, mimeType: 'image/webp' };
  }
  
  return { valid: false, error: 'Ungültiges Format. Erlaubt: JPEG, PNG, WebP.' };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // User-Client: Nur für Auth-Prüfung (mit Authorization Header)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Admin-Client: Für DB-Operationen (umgeht RLS!)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Auth-Check mit User-Client
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ User authenticated: ${user.id}`);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const profileId = formData.get('profileId') as string;
    const fileName = formData.get('fileName') as string;

    if (!file || !profileId || !fileName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, profileId, fileName' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Profil-Query mit Admin-Client (umgeht RLS!)
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Fehler beim Laden des Profils' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!profile) {
      console.error('Profile not found for ID:', profileId);
      return new Response(
        JSON.stringify({ error: 'Profil nicht gefunden.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Ownership selbst prüfen (statt RLS)
    // Admin-created profiles have user_id = NULL, allow upload for authenticated admin/user
    if (profile.user_id !== null && profile.user_id !== user.id) {
      console.error(`❌ Unauthorized upload attempt: user ${user.id} tried to upload to profile ${profileId} (owned by ${profile.user_id})`);
      return new Response(
        JSON.stringify({ error: 'Keine Berechtigung für dieses Profil.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ Profile ownership verified for user ${user.id}, profile ${profileId}`);

    // Read file bytes for magic byte validation
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Validate magic bytes
    const validation = validateImageMagicBytes(bytes);
    if (!validation.valid) {
      console.error('Invalid image format:', validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch max file size from site_settings
    const { data: settingsData } = await adminClient
      .from('site_settings')
      .select('value')
      .eq('key', 'upload_max_file_size_mb')
      .single();
    const maxSizeMB = parseInt(settingsData?.value || '10');

    console.log(`Image type: ${validation.mimeType}, max size: ${maxSizeMB}MB`);

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return new Response(JSON.stringify({ error: `Datei zu groß (max. ${maxSizeMB}MB)` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Image validated successfully: ${validation.mimeType}`);

    // 4. Upload to storage mit Admin-Client (umgeht Storage RLS!)
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('profile-photos')
      .upload(`${profileId}/${fileName}`, bytes, {
        contentType: validation.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from('profile-photos')
      .getPublicUrl(`${profileId}/${fileName}`);

    console.log(`✅ Image uploaded successfully: ${uploadData.path}`);

    return new Response(
      JSON.stringify({
        success: true,
        path: uploadData.path,
        url: urlData.publicUrl,
        media_type: 'image',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
