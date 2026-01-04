/**
 * PayPort Config Self-Check
 * Zeigt sichere Prüfdaten ohne Secrets zu leaken
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
    const accessKey = Deno.env.get('PAYPORT_ACCESS_KEY')?.trim() || '';
    const secretKey = Deno.env.get('PAYPORT_SECRET_KEY')?.trim() || '';
    const countryCode = Deno.env.get('PAYPORT_COUNTRY_CODE')?.trim() || '';
    const checkoutUrl = Deno.env.get('PAYPORT_CHECKOUT_URL')?.trim() || '';

    // Parse checkout URL safely
    let checkoutHost = '';
    let checkoutPath = '';
    let isHttps = false;
    
    try {
      const url = new URL(checkoutUrl);
      checkoutHost = url.host;
      checkoutPath = url.pathname;
      isHttps = url.protocol === 'https:';
    } catch {
      checkoutHost = 'INVALID_URL';
      checkoutPath = '';
    }

    const config = {
      accessKeyConfigured: accessKey.length > 0,
      accessKeyPrefix: accessKey.length >= 4 ? accessKey.substring(0, 4) + '...' : 'TOO_SHORT',
      accessKeyLength: accessKey.length,
      
      secretKeyConfigured: secretKey.length > 0,
      secretKeyLength: secretKey.length,
      
      countryCode: countryCode || 'NOT_SET',
      countryCodeValid: countryCode === 'TE' || countryCode === 'CH',
      
      checkoutUrl: checkoutUrl || 'NOT_SET',
      checkoutHost,
      checkoutPath,
      isHttps,
      isTestEnvironment: checkoutHost.includes('test-'),
      
      allSecretsConfigured: accessKey.length > 0 && secretKey.length > 0 && countryCode.length > 0 && checkoutUrl.length > 0,
    };

    console.log('[PAYPORT-CHECK] Config validation:', config);

    return new Response(
      JSON.stringify({
        status: config.allSecretsConfigured ? 'OK' : 'INCOMPLETE',
        config,
        timestamp: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error('[PAYPORT-CHECK] Error:', error);
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
