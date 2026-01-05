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

    // Parse input - support both GET (direct PayPort callback) and POST (frontend invoke)
    let params: Record<string, string> = {};
    const url = new URL(req.url);
    const isGet = req.method === 'GET';
    const debug = url.searchParams.get('debug') === '1';

    if (isGet) {
      // Direct GET from PayPort
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      console.log('PayPort Return - GET mode, params:', params);
    } else {
      // POST from frontend invoke
      try {
        params = await req.json();
      } catch {
        params = {};
      }
      console.log('PayPort Return - POST mode, params:', params);
    }

    const { id, tk, ts, h } = params;

    if (!tk || !ts || !h) {
      console.error('Missing required params:', { id, tk, ts, h });
      const redirectUrl = `/mein-profil?payment=missing_params&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Verify feedback hash
    // Build prehash from ALL received params except 'h', alphabetically sorted
    const feedbackParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'h' && key !== 'debug' && value) {
        feedbackParams[key] = value;
      }
    }
    const sortedKeys = Object.keys(feedbackParams).sort();
    const prehashFeedback = sortedKeys.map(k => `${k}=${feedbackParams[k]}`).join(';') + ';' + secret;
    const calculatedHash = await sha1(prehashFeedback);

    console.log('Feedback hash verification:', { 
      prehash: prehashFeedback.replace(secret, 'SECRET'), 
      calculated: calculatedHash, 
      received: h,
      match: calculatedHash === h
    });

    if (calculatedHash !== h) {
      console.error('Hash mismatch! Possible tampering.');
      const redirectUrl = `/mein-profil?payment=hash_error&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Feedback hash verified OK');

    // Step 2: Call getTransactionStatus
    const tsStatus = Math.floor(Date.now() / 1000).toString();
    const statusParams: Record<string, string> = { ak: accessKey, tk, ts: tsStatus };
    const sortedStatusKeys = Object.keys(statusParams).sort();
    const prehashStatus = sortedStatusKeys.map(k => `${k}=${statusParams[k]}`).join(';') + ';' + secret;
    const hashStatus = await sha1(prehashStatus);

    const statusUrl = `${apiBaseUrl}/${apiInterface}/getTransactionStatus?ak=${accessKey}&tk=${tk}&ts=${tsStatus}&h=${hashStatus}`;
    console.log('Calling getTransactionStatus:', statusUrl.replace(accessKey, 'AK'));

    const statusResponse = await fetch(statusUrl);
    const statusText = await statusResponse.text();
    console.log('getTransactionStatus response:', statusText);

    let statusData: any;
    try {
      statusData = JSON.parse(statusText);
    } catch {
      console.error('Failed to parse status response, raw:', statusText);
      const redirectUrl = `/mein-profil?payment=api_error&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if payment is PAID
    const paymentStatus = statusData.paymentStatus || statusData.status;
    console.log('Payment status from API:', paymentStatus);

    if (paymentStatus === 'PAID') {
      // Step 3: Call releaseTransaction
      const tsRelease = Math.floor(Date.now() / 1000).toString();
      const releaseParams: Record<string, string> = { ak: accessKey, tk, ts: tsRelease };
      const sortedReleaseKeys = Object.keys(releaseParams).sort();
      const prehashRelease = sortedReleaseKeys.map(k => `${k}=${releaseParams[k]}`).join(';') + ';' + secret;
      const hashRelease = await sha1(prehashRelease);

      const releaseUrl = `${apiBaseUrl}/${apiInterface}/releaseTransaction?ak=${accessKey}&tk=${tk}&ts=${tsRelease}&h=${hashRelease}`;
      console.log('Calling releaseTransaction:', releaseUrl.replace(accessKey, 'AK'));

      const releaseResponse = await fetch(releaseUrl);
      const releaseText = await releaseResponse.text();
      console.log('releaseTransaction response:', releaseText);

      // Step 4: Update profile in database
      // Find profile by payment_reference (which was set during checkout)
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // First, find the profile by payment_reference (could be id or tk)
      let profileId: string | null = null;
      
      // Try to find by payment_reference = id (set during checkout)
      if (id) {
        const { data: profileById } = await supabase
          .from('profiles')
          .select('id, payment_status, payment_reference')
          .eq('payment_reference', id)
          .maybeSingle();
        
        if (profileById) {
          profileId = profileById.id;
          console.log('DB lookup OK - found by payment_reference=id:', { profileId, matchedId: id });
        }
      }

      // Fallback: try to find by payment_reference = tk
      if (!profileId) {
        const { data: profileByTk } = await supabase
          .from('profiles')
          .select('id, payment_status, payment_reference')
          .eq('payment_reference', tk)
          .maybeSingle();
        
        if (profileByTk) {
          profileId = profileByTk.id;
          console.log('DB lookup OK - found by payment_reference=tk:', { profileId, matchedTk: tk });
        }
      }

      if (!profileId) {
        console.error('DB lookup FAILED - no profile found for payment_reference:', { id, tk });
        // Payment was successful but we can't update the profile
        // Still redirect to success but log the issue
        const redirectUrl = `/mein-profil?payment=success&db_warning=true&ts=${Date.now()}`;
        if (isGet) {
          return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
        }
        return new Response(
          JSON.stringify({ success: true, redirect: redirectUrl, warning: 'Profile not found for update' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update the profile
      const now = new Date().toISOString();
      const premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          payment_status: 'paid',
          payment_reference: tk, // Update to tk for future reference
          updated_at: now,
          premium_until: premiumUntil
        })
        .eq('id', profileId)
        .select('id');

      if (updateError) {
        console.error('DB update FAILED:', updateError);
      } else {
        const rowcount = updateData?.length || 0;
        console.log('DB update OK:', { profileId, rowcount });
      }

      const redirectUrl = `/mein-profil?payment=success&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: true, redirect: redirectUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('Payment not PAID, status:', paymentStatus);
      const redirectUrl = `/mein-profil?payment=failed&status=${paymentStatus}&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl, paymentStatus }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('PayPort return error:', error);
    const redirectUrl = `/mein-profil?payment=error&ts=${Date.now()}`;
    return new Response(
      JSON.stringify({ success: false, redirect: redirectUrl, error: String(error) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
