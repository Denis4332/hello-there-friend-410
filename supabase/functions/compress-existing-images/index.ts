import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Compress image using sharp-like approach with canvas
async function compressImageBlob(imageData: ArrayBuffer, mimeType: string): Promise<Uint8Array> {
  // For edge function, we'll use a simpler resize approach
  // Since we can't use browser canvas, we'll use the image as-is but with quality reduction
  // The main compression happens client-side now
  return new Uint8Array(imageData);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all photos from database
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id, storage_path, media_type')
      .or('media_type.is.null,media_type.eq.image');

    if (photosError) {
      throw new Error(`Failed to fetch photos: ${photosError.message}`);
    }

    console.log(`Found ${photos?.length || 0} photos to process`);

    const results = {
      total: photos?.length || 0,
      processed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Process each photo
    for (const photo of photos || []) {
      try {
        // Download the image
        const { data: imageData, error: downloadError } = await supabase.storage
          .from('profile-photos')
          .download(photo.storage_path);

        if (downloadError) {
          results.errors.push(`Download failed for ${photo.storage_path}: ${downloadError.message}`);
          results.skipped++;
          continue;
        }

        // Check file size - skip if already small (under 500KB)
        const originalSize = imageData.size;
        if (originalSize < 500 * 1024) {
          console.log(`Skipping ${photo.storage_path} - already small (${(originalSize / 1024).toFixed(0)}KB)`);
          results.skipped++;
          continue;
        }

        // Convert blob to array buffer for processing
        const arrayBuffer = await imageData.arrayBuffer();
        
        // Create compressed version using Canvas API simulation
        // Note: In Deno, we'd need sharp or similar for real compression
        // For now, we'll log the files that need compression
        console.log(`Would compress: ${photo.storage_path} (${(originalSize / 1024 / 1024).toFixed(2)}MB)`);
        
        results.processed++;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Error processing ${photo.storage_path}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Analyzed ${results.total} photos. ${results.processed} need compression, ${results.skipped} already optimized.`,
        results,
        note: 'For actual compression of existing images, use a batch script with sharp/imagemagick locally, or re-upload images through the app which now auto-compresses.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
