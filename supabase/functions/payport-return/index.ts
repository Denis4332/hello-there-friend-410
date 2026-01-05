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
    // PAYPORT_API_BASE_URL muss /api enthalten, z.B. "https://test-pip3api.payport.ch/api"
    const apiBaseUrlRaw = Deno.env.get('PAYPORT_API_BASE_URL') || 'https://test-pip3api.payport.ch/api';
    // NUR trailing slash entfernen, /api NICHT entfernen!
    const apiBaseUrl = apiBaseUrlRaw.replace(/\/$/, '');
    const apiInterface = Deno.env.get('PAYPORT_INTERFACE') || 'pip3';

    // Log config at start for debugging
    console.log('PayPortReturn CONFIG', { 
      apiBaseUrl, 
      apiInterface, 
      hasAK: !!accessKey, 
      hasSecret: !!secret 
    });

    if (!secret || !accessKey) {
      console.error('PayPortReturn CONFIG_ERROR - Missing PAYPORT_SECRET or PAYPORT_AK');
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
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } else {
      try {
        params = await req.json();
      } catch {
        params = {};
      }
    }

    const { id, tk, ts, h } = params;
    console.log('PayPortReturn RECEIVED', { mode: isGet ? 'GET' : 'POST', id, tk, ts, hasH: !!h, paramKeys: Object.keys(params) });

    if (!tk || !ts || !h) {
      console.error('PayPortReturn MISSING_PARAMS', { id, tk, ts, h });
      const redirectUrl = `/mein-profil?payment=failed&step=missing_params&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Verify feedback hash - include ALL params except 'h' and 'debug'
    const feedbackParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key === 'h' || key === 'debug') continue;
      // IMPORTANT: include even empty/falsy values
      feedbackParams[key] = String(value ?? '');
    }
    const sortedKeys = Object.keys(feedbackParams).sort();
    const prehashFeedback = sortedKeys.map(k => `${k}=${feedbackParams[k]}`).join(';') + ';' + secret;
    const calculatedHash = await sha1(prehashFeedback);

    const hashOk = calculatedHash === h;
    console.log('PayPortReturn HASH_VERIFY', {
      ok: hashOk,
      receivedKeys: sortedKeys,
      prehashMasked: prehashFeedback.replace(secret, 'SECRET'),
      calculated: calculatedHash,
      received: h
    });

    if (!hashOk) {
      console.error('PayPortReturn HASH_MISMATCH');
      const redirectUrl = `/mein-profil?payment=failed&step=hash_error&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl }),
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
    console.log('PayPortReturn STATUS_CALL', statusUrl.replace(accessKey, 'AK'));

    const statusResponse = await fetch(statusUrl);
    const statusText = await statusResponse.text();
    console.log('PayPortReturn STATUS_RAW', statusText);

    let statusData: any;
    try {
      statusData = JSON.parse(statusText);
    } catch {
      console.error('PayPortReturn STATUS_PARSE_FAILED', { raw: statusText });
      const redirectUrl = `/mein-profil?payment=failed&step=api_parse_error&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentStatus = statusData.paymentStatus || statusData.status;
    console.log('PayPortReturn PAYMENT_STATUS', { paymentStatus, tk });

    if (paymentStatus !== 'PAID') {
      console.log('PayPortReturn NOT_PAID', { paymentStatus, tk });
      const redirectUrl = `/mein-profil?payment=failed&status=${paymentStatus}&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl, paymentStatus }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Call releaseTransaction
    const tsRelease = Math.floor(Date.now() / 1000).toString();
    const releaseParams: Record<string, string> = { ak: accessKey, tk, ts: tsRelease };
    const sortedReleaseKeys = Object.keys(releaseParams).sort();
    const prehashRelease = sortedReleaseKeys.map(k => `${k}=${releaseParams[k]}`).join(';') + ';' + secret;
    const hashRelease = await sha1(prehashRelease);

    const releaseUrl = `${apiBaseUrl}/${apiInterface}/releaseTransaction?ak=${accessKey}&tk=${tk}&ts=${tsRelease}&h=${hashRelease}`;
    console.log('PayPortReturn RELEASE_CALL', releaseUrl.replace(accessKey, 'AK'));

    const releaseResponse = await fetch(releaseUrl);
    const releaseText = await releaseResponse.text();
    console.log('PayPortReturn RELEASE_RAW', releaseText);

    // Parse and verify release response
    let releaseData: any = null;
    try {
      releaseData = JSON.parse(releaseText);
    } catch {
      // Might not be JSON, treat as failed
    }
    const releaseCode = releaseData?.responseCode ?? releaseData?.code ?? null;
    const releaseOk = String(releaseCode) === '0';
    console.log('PayPortReturn RELEASE_RESULT', { releaseOk, releaseCode, tk });

    if (!releaseOk) {
      console.error('PayPortReturn RELEASE_FAILED', { tk, releaseCode, releaseText });
      const redirectUrl = `/mein-profil?payment=failed&step=release&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Database update - STRICT: must find and update EXACTLY 1 row
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let profileId: string | null = null;
    let matchedBy: string = 'none';

    // Try 1: Find by payment_reference = id (set during checkout)
    if (id) {
      const { data: byId, error: byIdErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('payment_reference', id)
        .limit(2);

      if (byIdErr) {
        console.error('PayPortReturn DB_LOOKUP_ERROR (by id)', byIdErr);
      } else if (byId && byId.length === 1) {
        profileId = byId[0].id;
        matchedBy = 'payment_reference=id';
      } else if (byId && byId.length > 1) {
        console.error('PayPortReturn DB_LOOKUP_AMBIGUOUS (by id)', { id, count: byId.length });
      }
    }

    // Try 2: Fallback to payment_reference = tk
    if (!profileId) {
      const { data: byTk, error: byTkErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('payment_reference', tk)
        .limit(2);

      if (byTkErr) {
        console.error('PayPortReturn DB_LOOKUP_ERROR (by tk)', byTkErr);
      } else if (byTk && byTk.length === 1) {
        profileId = byTk[0].id;
        matchedBy = 'payment_reference=tk';
      } else if (byTk && byTk.length > 1) {
        console.error('PayPortReturn DB_LOOKUP_AMBIGUOUS (by tk)', { tk, count: byTk.length });
      }
    }

    console.log('PayPortReturn DB_LOOKUP_RESULT', { matchedBy, profileId, payportIdShort: id, tk, paymentStatus, lookupCount: profileId ? 1 : 0 });

    // HARD RULE: must find exactly 1 profile
    if (!profileId) {
      console.error('PayPortReturn DB_LOOKUP_FAILED', { matchedBy, payportIdShort: id, tk, paymentStatus });
      const redirectUrl = `/mein-profil?payment=failed&step=db_lookup&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile - only payment_status and payment_reference (NO premium_until change)
    const now = new Date().toISOString();
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({
        payment_status: 'paid',
        payment_reference: tk,
        updated_at: now
      })
      .eq('id', profileId)
      .select('id');

    const updateRowcount = updateData?.length || 0;
    console.log('PayPortReturn DB_UPDATE_RESULT', { matchedBy, profileId, payportIdShort: id, tk, paymentStatus, updateRowcount });

    // HARD RULE: must update exactly 1 row
    if (updateError || updateRowcount !== 1) {
      console.error('PayPortReturn DB_UPDATE_FAILED', { updateError, updateRowcount, profileId, matchedBy, payportIdShort: id, tk, paymentStatus });
      const redirectUrl = `/mein-profil?payment=failed&step=db_update&ts=${Date.now()}`;
      if (isGet) {
        return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
      }
      return new Response(
        JSON.stringify({ success: false, redirect: redirectUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SUCCESS
    console.log('PayPortReturn SUCCESS', { profileId, tk, paymentStatus });
    const redirectUrl = `/mein-profil?payment=success&ts=${Date.now()}`;
    if (isGet) {
      return new Response(null, { status: 302, headers: { ...corsHeaders, 'Location': redirectUrl } });
    }
    return new Response(
      JSON.stringify({ success: true, redirect: redirectUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PayPortReturn EXCEPTION', error);
    const redirectUrl = `/mein-profil?payment=error&ts=${Date.now()}`;
    return new Response(
      JSON.stringify({ success: false, redirect: redirectUrl, error: String(error) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
