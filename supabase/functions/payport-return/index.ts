import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get secrets
    const secret = Deno.env.get('PAYPORT_SECRET');
    const accessKey = Deno.env.get('PAYPORT_AK');
    const apiBaseUrlRaw = Deno.env.get('PAYPORT_API_BASE_URL') || 'https://test-pip3api.payport.ch';
    const apiBaseUrl = apiBaseUrlRaw.replace(/\/api\/?$/, ''); // Strip trailing /api if present
    const apiInterface = Deno.env.get('PAYPORT_INTERFACE') || 'pip3';

    if (!secret || !accessKey) {
      console.error('Missing PAYPORT_SECRET or PAYPORT_AK');
      return new Response(
        JSON.stringify({ success: false, redirect: '/mein-profil?payment=config_error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse input (query params from PayPort callback)
    const body = await req.json();
    const { id, tk, ts, h } = body;

    console.log('PayPort Return - Received params:', { id, tk, ts, h });

    if (!id || !tk || !ts || !h) {
      console.error('Missing required params:', { id, tk, ts, h });
      return new Response(
        JSON.stringify({ success: false, redirect: '/mein-profil?payment=missing_params' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Verify feedback hash
    // Keys: id, tk, ts (alphabetically sorted)
    const feedbackParams: Record<string, string> = { id, tk, ts };
    const sortedKeys = Object.keys(feedbackParams).sort();
    const prehashFeedback = sortedKeys.map(k => `${k}=${feedbackParams[k]}`).join(';') + ';' + secret;
    const calculatedHash = await sha1(prehashFeedback);

    console.log('Feedback hash verification:', { 
      prehash: prehashFeedback.replace(secret, 'SECRET'), 
      calculated: calculatedHash, 
      received: h 
    });

    if (calculatedHash !== h) {
      console.error('Hash mismatch! Possible tampering.');
      return new Response(
        JSON.stringify({ success: false, redirect: '/mein-profil?payment=hash_error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Call getTransactionStatus
    const tsStatus = Math.floor(Date.now() / 1000).toString();
    const statusParams: Record<string, string> = { ak: accessKey, tk, ts: tsStatus };
    const sortedStatusKeys = Object.keys(statusParams).sort();
    const prehashStatus = sortedStatusKeys.map(k => `${k}=${statusParams[k]}`).join(';') + ';' + secret;
    const hashStatus = await sha1(prehashStatus);

    const statusUrl = `${apiBaseUrl}/${apiInterface}/getTransactionStatus?ak=${accessKey}&tk=${tk}&ts=${tsStatus}&h=${hashStatus}`;
    console.log('Calling getTransactionStatus:', statusUrl);

    const statusResponse = await fetch(statusUrl);
    const statusText = await statusResponse.text();
    console.log('getTransactionStatus response:', statusText);

    let statusData: any;
    try {
      statusData = JSON.parse(statusText);
    } catch {
      console.error('Failed to parse status response');
      return new Response(
        JSON.stringify({ success: false, redirect: '/mein-profil?payment=api_error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if payment is PAID
    const paymentStatus = statusData.paymentStatus || statusData.status;
    console.log('Payment status:', paymentStatus);

    if (paymentStatus === 'PAID') {
      // Step 3: Call releaseTransaction
      const tsRelease = Math.floor(Date.now() / 1000).toString();
      const releaseParams: Record<string, string> = { ak: accessKey, tk, ts: tsRelease };
      const sortedReleaseKeys = Object.keys(releaseParams).sort();
      const prehashRelease = sortedReleaseKeys.map(k => `${k}=${releaseParams[k]}`).join(';') + ';' + secret;
      const hashRelease = await sha1(prehashRelease);

      const releaseUrl = `${apiBaseUrl}/${apiInterface}/releaseTransaction?ak=${accessKey}&tk=${tk}&ts=${tsRelease}&h=${hashRelease}`;
      console.log('Calling releaseTransaction:', releaseUrl);

      const releaseResponse = await fetch(releaseUrl);
      const releaseText = await releaseResponse.text();
      console.log('releaseTransaction response:', releaseText);

      // Step 4: Update profile in database
      // id = orderId = profile.id
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const now = new Date().toISOString();
      const premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          payment_status: 'paid',
          payment_reference: tk,
          updated_at: now,
          premium_until: premiumUntil
        })
        .eq('id', id);

      if (updateError) {
        console.error('Failed to update profile:', updateError);
        // Still redirect to success since payment was successful
      } else {
        console.log('Profile updated successfully:', id);
      }

      return new Response(
        JSON.stringify({ success: true, redirect: '/mein-profil?payment=success' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('Payment not PAID, status:', paymentStatus);
      return new Response(
        JSON.stringify({ success: false, redirect: '/mein-profil?payment=failed', paymentStatus }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('PayPort return error:', error);
    return new Response(
      JSON.stringify({ success: false, redirect: '/mein-profil?payment=error', error: String(error) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
