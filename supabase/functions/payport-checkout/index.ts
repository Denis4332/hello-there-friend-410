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
    const paymentType = Deno.env.get('PAYPORT_PT');
    const paymentSource = Deno.env.get('PAYPORT_PS'); // optional

    if (!accessKey || !secret || !currency || !paymentType) {
      console.error('Missing required PayPort config (AK, SECRET, C, or PT)');
      return new Response(
        JSON.stringify({ error: 'PayPort not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse input
    const { orderId, amountCents, returnUrl } = await req.json();

    if (!orderId || !amountCents || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: orderId, amountCents, returnUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build params (alphabetically sorted keys)
    const ts = Math.floor(Date.now() / 1000).toString(); // SECONDS!
    
    // ID auf max 20 Zeichen kürzen (PayPort Limit)
    const id = String(orderId).replace(/-/g, '').slice(0, 20);
    
    const params: Record<string, string> = {
      a: amountCents.toString(),
      ak: accessKey,
      c: currency,
      cc: countryCode,
      id: id,
      pt: paymentType,
      r: returnUrl,
      ts: ts
    };

    // ps nur hinzufügen wenn vorhanden und nicht leer
    if (paymentSource && paymentSource.trim() !== '') {
      params.ps = paymentSource;
    }

    // Build prehash: alphabetically sorted "key=value" joined with ";" + secret appended
    // h is NOT in prehash
    const sortedKeys = Object.keys(params).sort();
    const prehash = sortedKeys.map(k => `${k}=${params[k]}`).join(';') + ';' + secret;

    // Calculate SHA1 hash
    const h = await sha1(prehash);

    // Build redirect URL with all params including h
    const urlParams = new URLSearchParams();
    sortedKeys.forEach(k => urlParams.append(k, params[k]));
    urlParams.append('h', h);

    const redirectUrl = `${checkoutUrl}?${urlParams.toString()}`;

    // Log for debugging
    console.log('=== PayPort Checkout Debug ===');
    console.log('Input:', { orderId, amountCents, returnUrl });
    console.log('Params:', params);
    console.log('Prehash:', prehash);
    console.log('Hash (h):', h);
    console.log('Redirect URL:', redirectUrl);
    console.log('==============================');

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
    console.error('PayPort checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
