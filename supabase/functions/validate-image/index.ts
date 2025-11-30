import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MediaValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  mediaType?: 'image' | 'video';
}

function validateMediaMagicBytes(bytes: Uint8Array): MediaValidationResult {
  // Check JPEG magic bytes
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { valid: true, mimeType: 'image/jpeg', mediaType: 'image' };
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
    return { valid: true, mimeType: 'image/png', mediaType: 'image' };
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
    return { valid: true, mimeType: 'image/webp', mediaType: 'image' };
  }

  // Check MP4 magic bytes (ftyp box)
  // MP4 files start with "ftyp" at offset 4
  if (
    bytes[4] === 0x66 && // 'f'
    bytes[5] === 0x74 && // 't'
    bytes[6] === 0x79 && // 'y'
    bytes[7] === 0x70    // 'p'
  ) {
    return { valid: true, mimeType: 'video/mp4', mediaType: 'video' };
  }

  // Check WebM magic bytes (EBML header: 0x1A 0x45 0xDF 0xA3)
  if (
    bytes[0] === 0x1A &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xDF &&
    bytes[3] === 0xA3
  ) {
    return { valid: true, mimeType: 'video/webm', mediaType: 'video' };
  }
  
  return { valid: false, error: 'Ungültiges Format. Erlaubt: JPEG, PNG, WebP (Bilder) oder MP4, WebM (Videos).' };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Verify profile ownership - CRITICAL SECURITY CHECK
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (profile.user_id !== user.id) {
      console.error(`Unauthorized upload attempt: user ${user.id} tried to upload to profile ${profileId}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: You can only upload photos to your own profile' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Profile ownership verified for user ${user.id}`);
    console.log(`Validating media upload for profile ${profileId}: ${fileName}`);

    // Read file bytes for magic byte validation
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Validate magic bytes first to determine media type
    const validation = validateMediaMagicBytes(bytes);
    if (!validation.valid) {
      console.error('Invalid media format:', validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine max file size based on media type
    const isVideo = validation.mediaType === 'video';
    let maxSizeMB = 10; // Default for images

    if (isVideo) {
      maxSizeMB = 50; // Videos up to 50MB
    } else {
      // Fetch max file size for images from site_settings
      const { data: settingsData } = await supabaseClient
        .from('site_settings')
        .select('value')
        .eq('key', 'upload_max_file_size_mb')
        .single();
      maxSizeMB = parseInt(settingsData?.value || '10');
    }

    console.log(`Media type: ${validation.mediaType}, max size: ${maxSizeMB}MB`);

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return new Response(JSON.stringify({ error: `Datei zu groß (max. ${maxSizeMB}MB)` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Media validated successfully: ${validation.mimeType}`);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
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
    const { data: urlData } = supabaseClient.storage
      .from('profile-photos')
      .getPublicUrl(`${profileId}/${fileName}`);

    console.log(`Media uploaded successfully: ${uploadData.path}`);

    return new Response(
      JSON.stringify({
        success: true,
        path: uploadData.path,
        url: urlData.publicUrl,
        media_type: validation.mediaType,
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