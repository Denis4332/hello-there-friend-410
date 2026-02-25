import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA1 hash function
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get secrets
    const accessKey = Deno.env.get('PAYPORT_AK');
    const secret = Deno.env.get('PAYPORT_SECRET');
    const countryCode = Deno.env.get('PAYPORT_CC') || 'TE';
    const checkoutUrl = Deno.env.get('PAYPORT_CHECKOUT_URL') || 'https://test-pip3.payport.ch/prepare/checkout';
    const currency = Deno.env.get('PAYPORT_C');
    const defaultPaymentType = Deno.env.get('PAYPORT_PT');
    const defaultPaymentSource = Deno.env.get('PAYPORT_PS');

    if (!accessKey || !secret || !currency) {
      console.error('PAYPORT_CHECKOUT CONFIG_ERROR - Missing AK, SECRET, or C');
      return new Response(
        JSON.stringify({ error: 'PayPort not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse input
    const { orderId, amountCents, returnUrl, method, listingType } = await req.json();

    if (!orderId || !amountCents || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId, amountCents, returnUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine pt and ps based on method parameter - PFLICHT!
    let pt: string;
    let ps: string | undefined;
    
    if (method === 'PHONE') {
      pt = 'PHONE';
      ps = 'TARIFF-CHANGE';
    } else if (method === 'SMS') {
      pt = 'SMS';
      ps = 'VERIFICATION';  // Geändert von VOUCHER
    } else {
      // Kein Fallback - method ist Pflicht
      console.error('PAYPORT_CHECKOUT ERROR - Missing method parameter');
      return new Response(
        JSON.stringify({ error: 'Missing required field: method (PHONE or SMS)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build params (alphabetically sorted keys)
    const ts = Math.floor(Date.now() / 1000).toString();
    
    // ID auf max 20 Zeichen kürzen (PayPort Limit)
    const id = String(orderId).replace(/-/g, '').slice(0, 20);
    
    const params: Record<string, string> = {
      a: amountCents.toString(),
      ak: accessKey,
      c: currency,
      cc: countryCode,
      id: id,
      lc: 'DE',
      ps: ps,
      pt: pt,
      r: returnUrl,
      ts: ts
    };

    const sortedKeys = Object.keys(params).sort();
    const prehash = sortedKeys.map(k => `${k}=${params[k]}`).join(';') + ';' + secret;
    const h = await sha1(prehash);

    const urlParams = new URLSearchParams();
    sortedKeys.forEach(k => urlParams.append(k, params[k]));
    urlParams.append('h', h);

    const redirectUrl = `${checkoutUrl}?${urlParams.toString()}`;

    // Erweitertes Logging (ohne Secrets)
    console.log('PAYPORT_CHECKOUT REQUEST', { 
      orderId, 
      amountCents, 
      method,       // Input-Parameter
      pt,           // Payment Type
      ps,           // Payment Source
      a: params.a,
      c: params.c,
      cc: params.cc,
      id: params.id
    });

    // CRITICAL: Save payment_reference for reliable matching on return
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Server-side media validation (Exploit-Schutz)
      if (listingType) {
        const mediaLimits: Record<string, number> = { basic: 5, premium: 10, top: 15 };
        const maxPhotos = mediaLimits[listingType];
        if (maxPhotos) {
          const { count, error: countError } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', orderId);
          if (!countError && (count || 0) > maxPhotos) {
            console.error('PAYPORT_CHECKOUT MEDIA_LIMIT_EXCEEDED', { profileId: orderId, listingType, count, maxPhotos });
            return new Response(
              JSON.stringify({ error: `Zu viele Medien für ${listingType}-Paket (${count}/${maxPhotos})` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          payment_reference: id,
          payment_status: 'pending',
          ...(listingType ? { listing_type: listingType } : {})
        })
        .eq('id', orderId)
        .select('id');

      const rowcount = updateData?.length || 0;
      console.log('PAYPORT_CHECKOUT MAPPING', { profileId: orderId, payportId: id, rowcount });

      // HARD RULE: must link exactly 1 profile, otherwise abort checkout
      if (updateError || rowcount !== 1) {
        console.error('PAYPORT_CHECKOUT MAPPING_FAILED', { profileId: orderId, payportId: id, rowcount, updateError });
        return new Response(
          JSON.stringify({ error: 'Could not link payment to profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.error('PAYPORT_CHECKOUT NO_SUPABASE - cannot save mapping');
      return new Response(
        JSON.stringify({ error: 'Database not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        redirectUrl,
        debug: {
          params,
          prehash,
          h
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PAYPORT_CHECKOUT EXCEPTION', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
