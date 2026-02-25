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

/**
 * Calculate new expiry: if current expiry is still active, extend from it; otherwise from now.
 * Always adds 30 days.
 */
function calcNewExpiry(currentExpiry: string | null): string {
  const now = new Date();
  if (currentExpiry) {
    const current = new Date(currentExpiry);
    if (current > now) {
      // Still active: extend from current expiry
      current.setDate(current.getDate() + 30);
      return current.toISOString();
    }
  }
  // Expired or no expiry: start from now + 30 days
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + 30);
  return newExpiry.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secret = Deno.env.get('PAYPORT_SECRET');
    const accessKey = Deno.env.get('PAYPORT_AK');
    const apiBaseUrlRaw = Deno.env.get('PAYPORT_API_BASE_URL') || 'https://test-pip3api.payport.ch/api';
    const apiBaseUrl = apiBaseUrlRaw.replace(/\/$/, '');
    const apiInterface = Deno.env.get('PAYPORT_INTERFACE') || 'pip3';

    console.log('PayPortReturn CONFIG', { apiBaseUrl, apiInterface, hasAK: !!accessKey, hasSecret: !!secret });

    if (!secret || !accessKey) {
      console.error('PayPortReturn CONFIG_ERROR - Missing PAYPORT_SECRET or PAYPORT_AK');
      return new Response(
        JSON.stringify({ success: false, redirect: '/mein-profil?payment=config_error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let params: Record<string, string> = {};
    const url = new URL(req.url);
    const isGet = req.method === 'GET';

    if (isGet) {
      url.searchParams.forEach((value, key) => { params[key] = value; });
    } else {
      try { params = await req.json(); } catch { params = {}; }
    }

    const { id, tk, ts, h } = params;
    console.log('PayPortReturn RECEIVED', { mode: isGet ? 'GET' : 'POST', id, tk, ts, hasH: !!h });

    if (!tk || !ts || !h) {
      const redirectUrl = `/mein-profil?payment=failed&step=missing_params&ts=${Date.now()}`;
      if (isGet) return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      return new Response(JSON.stringify({ success: false, redirect: redirectUrl }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 1: Verify feedback hash
    const feedbackParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key === 'h' || key === 'debug') continue;
      feedbackParams[key] = String(value ?? '');
    }
    const sortedKeys = Object.keys(feedbackParams).sort();
    const prehashFeedback = sortedKeys.map(k => `${k}=${feedbackParams[k]}`).join(';') + ';' + secret;
    const calculatedHash = await sha1(prehashFeedback);

    if (calculatedHash !== h) {
      console.error('PayPortReturn HASH_MISMATCH');
      const redirectUrl = `/mein-profil?payment=failed&step=hash_error&ts=${Date.now()}`;
      if (isGet) return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      return new Response(JSON.stringify({ success: false, redirect: redirectUrl }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: getTransactionStatus
    const tsStatus = Math.floor(Date.now() / 1000).toString();
    const statusParams: Record<string, string> = { ak: accessKey, tk, ts: tsStatus };
    const sortedStatusKeys = Object.keys(statusParams).sort();
    const prehashStatus = sortedStatusKeys.map(k => `${k}=${statusParams[k]}`).join(';') + ';' + secret;
    const hashStatus = await sha1(prehashStatus);

    const statusUrl = `${apiBaseUrl}/getTransactionStatus?ak=${accessKey}&tk=${tk}&ts=${tsStatus}&h=${hashStatus}`;
    const statusResponse = await fetch(statusUrl);
    const statusText = await statusResponse.text();

    let statusData: any;
    try { statusData = JSON.parse(statusText); } catch {
      const redirectUrl = `/mein-profil?payment=failed&step=api_parse_error&ts=${Date.now()}`;
      if (isGet) return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      return new Response(JSON.stringify({ success: false, redirect: redirectUrl }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const paymentStatus = statusData.paymentStatus || statusData.status;
    console.log('PayPortReturn PAYMENT_STATUS', { paymentStatus, tk });

    if (paymentStatus !== 'PAID') {
      const redirectUrl = `/mein-profil?payment=failed&status=${paymentStatus}&ts=${Date.now()}`;
      if (isGet) return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      return new Response(JSON.stringify({ success: false, redirect: redirectUrl, paymentStatus }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 3: releaseTransaction
    const tsRelease = Math.floor(Date.now() / 1000).toString();
    const releaseParams: Record<string, string> = { ak: accessKey, tk, ts: tsRelease };
    const sortedReleaseKeys = Object.keys(releaseParams).sort();
    const prehashRelease = sortedReleaseKeys.map(k => `${k}=${releaseParams[k]}`).join(';') + ';' + secret;
    const hashRelease = await sha1(prehashRelease);

    const releaseUrl = `${apiBaseUrl}/releaseTransaction?ak=${accessKey}&tk=${tk}&ts=${tsRelease}&h=${hashRelease}`;
    const releaseResponse = await fetch(releaseUrl);
    const releaseText = await releaseResponse.text();

    let releaseData: any = null;
    try { releaseData = JSON.parse(releaseText); } catch { /* ignore */ }
    const releaseCode = releaseData?.responseCode ?? releaseData?.code ?? null;
    const releaseOk = String(releaseCode) === '0';

    if (!releaseOk) {
      console.error('PayPortReturn RELEASE_FAILED', { tk, releaseCode });
      const redirectUrl = `/mein-profil?payment=failed&step=release&ts=${Date.now()}`;
      if (isGet) return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      return new Response(JSON.stringify({ success: false, redirect: redirectUrl }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 4: Database update
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let profileId: string | null = null;
    let matchedBy = 'none';

    // Try by payment_reference = id
    if (id) {
      const { data: byId } = await supabase.from('profiles').select('id').eq('payment_reference', id).limit(2);
      if (byId?.length === 1) { profileId = byId[0].id; matchedBy = 'payment_reference=id'; }
    }
    // Fallback: payment_reference = tk
    if (!profileId) {
      const { data: byTk } = await supabase.from('profiles').select('id').eq('payment_reference', tk).limit(2);
      if (byTk?.length === 1) { profileId = byTk[0].id; matchedBy = 'payment_reference=tk'; }
    }

    if (!profileId) {
      console.error('PayPortReturn DB_LOOKUP_FAILED', { id, tk });
      const redirectUrl = `/mein-profil?payment=failed&step=db_lookup&ts=${Date.now()}`;
      if (isGet) return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      return new Response(JSON.stringify({ success: false, redirect: redirectUrl }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Load current profile to calculate expiry extension
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('listing_type, premium_until, top_ad_until, status')
      .eq('id', profileId)
      .single();

    const listingType = currentProfile?.listing_type || 'basic';
    const previousStatus = currentProfile?.status || 'pending';
    const now = new Date().toISOString();

    // Only auto-activate profiles that were active or inactive (renewal/reactivation)
    // Profiles that are pending/rejected/draft must remain for admin review
    const newStatus = (previousStatus === 'active' || previousStatus === 'inactive')
      ? 'active'
      : previousStatus;

    // Build update with proper expiry calculation
    const updates: Record<string, any> = {
      payment_status: 'paid',
      payment_reference: tk,
      status: newStatus,
      updated_at: now,
    };

    if (listingType === 'top') {
      const newExpiry = calcNewExpiry(currentProfile?.top_ad_until);
      updates.top_ad_until = newExpiry;
      updates.premium_until = newExpiry; // Top gets both
    } else {
      // basic or premium
      updates.premium_until = calcNewExpiry(currentProfile?.premium_until);
    }

    console.log('PayPortReturn DB_UPDATE', { profileId, listingType, updates });

    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select('id');

    if (updateError || !updateData?.length) {
      console.error('PayPortReturn DB_UPDATE_FAILED', { updateError, profileId });
      const redirectUrl = `/mein-profil?payment=failed&step=db_update&ts=${Date.now()}`;
      if (isGet) return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      return new Response(JSON.stringify({ success: false, redirect: redirectUrl }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('PayPortReturn SUCCESS', { profileId, tk });
    const redirectUrl = `/mein-profil?payment=success&ts=${Date.now()}`;
    if (isGet) return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
    return new Response(JSON.stringify({ success: true, redirect: redirectUrl }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('PayPortReturn EXCEPTION', error);
    const redirectUrl = `/mein-profil?payment=error&ts=${Date.now()}`;
    return new Response(
      JSON.stringify({ success: false, redirect: redirectUrl, error: String(error) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
