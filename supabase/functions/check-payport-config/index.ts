/**
 * PayPort Config Self-Check
 * 
 * Zeigt sichere Debug-Infos ohne Secrets zu leaken:
 * - accessKeyPrefix (erste 6 Zeichen)
 * - secretKeyLength
 * - countryCode
 * - checkoutUrlHost + Path
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessKey = (Deno.env.get('PAYPORT_ACCESS_KEY') || '').trim();
    const secretKey = (Deno.env.get('PAYPORT_SECRET_KEY') || '').trim();
    const countryCode = (Deno.env.get('PAYPORT_COUNTRY_CODE') || '').trim();
    const checkoutUrl = (Deno.env.get('PAYPORT_CHECKOUT_URL') || '').trim();

    // Parse checkout URL for safe display
    let checkoutUrlHost = '';
    let checkoutUrlPath = '';
    let checkoutUrlValid = false;
    
    try {
      if (checkoutUrl) {
        const url = new URL(checkoutUrl);
        checkoutUrlHost = url.host;
        checkoutUrlPath = url.pathname;
        checkoutUrlValid = true;
      }
    } catch {
      checkoutUrlValid = false;
    }

    const config = {
      accessKeyConfigured: accessKey.length > 0,
      accessKeyPrefix: accessKey.length >= 6 ? accessKey.substring(0, 6) + '...' : (accessKey.length > 0 ? accessKey.substring(0, accessKey.length) + '...' : 'NOT SET'),
      accessKeyLength: accessKey.length,
      
      secretKeyConfigured: secretKey.length > 0,
      secretKeyLength: secretKey.length,
      
      countryCode: countryCode || 'NOT SET',
      countryCodeValid: countryCode === 'TE' || countryCode === 'CH',
      
      checkoutUrlConfigured: checkoutUrl.length > 0,
      checkoutUrlHost,
      checkoutUrlPath,
      checkoutUrlValid,
      checkoutUrlIsTest: checkoutUrl.includes('test-'),
      checkoutUrlStartsWithHttps: checkoutUrl.startsWith('https://'),
      
      // Quick validation summary
      allSecretsConfigured: accessKey.length > 0 && secretKey.length > 0 && countryCode.length > 0 && checkoutUrl.length > 0,
      expectedAccessKeyLength: 16,
      expectedSecretKeyLength: 16,
    };

    console.log('[PAYPORT CONFIG CHECK]', JSON.stringify(config, null, 2));

    return new Response(
      JSON.stringify({
        status: config.allSecretsConfigured ? 'OK' : 'INCOMPLETE',
        config,
        message: config.allSecretsConfigured 
          ? 'Alle PayPort Secrets sind konfiguriert' 
          : 'Einige PayPort Secrets fehlen oder sind leer'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error('[PAYPORT CONFIG CHECK] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ status: 'ERROR', error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
