/**
 * ============================================================
 * PAYPORT ZAHLUNGSINTEGRATION - CHECKOUT ERSTELLEN
 * ============================================================
 * 
 * MINIMAL VERSION - Exakt wie in PayPort Mail spezifiziert
 * URL Format: https://test-pip3.payport.ch/prepare/checkout?ak=XXX&cc=YY&r=ZZZ&h=HHH
 * 
 * ============================================================
 * HASH-MODI (gesteuert durch PAYPORT_HASH_MODE Secret):
 * ============================================================
 * 
 * - AK_CC_SECRET: sha256(ak + cc + secret)
 * - AK_SECRET: sha256(ak + secret)
 * - AK_R_SECRET: sha256(ak + returnUrl + secret)
 * - FULL: sha256(ak + amount + currency + cc + secret) [default]
 * 
 * ============================================================
 * WICHTIGE SECRETS:
 * ============================================================
 * 
 * PAYPORT_ACCESS_KEY - Der Access Key
 * PAYPORT_SECRET_KEY - Der Secret Key für Hash
 * PAYPORT_COUNTRY_CODE - TE (Test) oder CH (Produktion)
 * PAYPORT_CHECKOUT_URL_HOST - test-pip3.payport.ch oder pip3.payport.ch
 * PAYPORT_FORCE_RETURN_ORIGIN - z.B. "https://test.web"
 * PAYPORT_HASH_MODE - AK_CC_SECRET, AK_SECRET, AK_R_SECRET, oder FULL
 * 
 * ============================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile_id, listing_type, amount } = await req.json();
    
    console.log('[PAYPORT] ========== CHECKOUT REQUEST (MINIMAL) ==========');
    console.log('[PAYPORT] Input:', { profile_id, listing_type, amount });

    if (!profile_id || !listing_type || !amount) {
      throw new Error('Missing required parameters: profile_id, listing_type, amount');
    }

    /**
     * PAYPORT SECRETS
     */
    const accessKey = (Deno.env.get('PAYPORT_ACCESS_KEY') || '').trim();
    const secretKey = (Deno.env.get('PAYPORT_SECRET_KEY') || '').trim();
    const countryCode = (Deno.env.get('PAYPORT_COUNTRY_CODE') || 'TE').trim().toUpperCase();
    const checkoutUrlHost = (Deno.env.get('PAYPORT_CHECKOUT_URL_HOST') || 'test-pip3.payport.ch').trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    /**
     * DEBUG OPTIONS
     */
    const forceReturnOrigin = (Deno.env.get('PAYPORT_FORCE_RETURN_ORIGIN') || '').trim();
    const hashMode = (Deno.env.get('PAYPORT_HASH_MODE') || 'FULL').trim().toUpperCase();

    if (!accessKey) {
      console.error('[PAYPORT] PAYPORT_ACCESS_KEY nicht konfiguriert!');
      throw new Error('PAYPORT_ACCESS_KEY not configured');
    }
    if (!secretKey) {
      console.error('[PAYPORT] PAYPORT_SECRET_KEY nicht konfiguriert!');
      throw new Error('PAYPORT_SECRET_KEY not configured');
    }

    console.log('[PAYPORT] Config:', {
      accessKeyPrefix: accessKey.substring(0, 8) + '...',
      accessKeyLength: accessKey.length,
      secretKeyLength: secretKey.length,
      countryCode,
      checkoutUrlHost,
      hashMode,
      forceReturnOrigin: forceReturnOrigin || '(request origin)',
    });

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Generate unique reference ID
    const timestamp = Date.now();
    const referenceId = `ESC-${timestamp}-${listing_type.toUpperCase()}`;
    
    console.log('[PAYPORT] Reference ID:', referenceId);

    /**
     * RETURN URL - NUR DIE DOMAIN (wie in PayPort Mail)
     */
    const requestOrigin = req.headers.get('origin') || 'https://escoria.ch';
    const returnUrl = forceReturnOrigin || requestOrigin;
    
    console.log('[PAYPORT] Return URL (domain only):', returnUrl);

    /**
     * HASH BERECHNUNG - Multiple Modi für Testing
     */
    const currency = 'CHF';
    const amountStr = String(amount);
    
    let hashString: string;
    let hashDescription: string;
    
    switch (hashMode) {
      case 'AK_CC_SECRET':
        hashString = accessKey + countryCode + secretKey;
        hashDescription = 'ak + cc + secret';
        break;
      case 'AK_SECRET':
        hashString = accessKey + secretKey;
        hashDescription = 'ak + secret';
        break;
      case 'AK_R_SECRET':
        hashString = accessKey + returnUrl + secretKey;
        hashDescription = 'ak + returnUrl + secret';
        break;
      case 'FULL':
      default:
        hashString = accessKey + amountStr + currency + countryCode + secretKey;
        hashDescription = 'ak + amount + currency + cc + secret';
        break;
    }

    console.log('[PAYPORT] Hash calculation:', {
      mode: hashMode,
      description: hashDescription,
      inputLength: hashString.length,
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(hashString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('[PAYPORT] Hash generated:', hash.substring(0, 20) + '...');

    /**
     * PROFIL UPDATE
     */
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        payment_reference: referenceId,
        payment_status: 'pending',
        payment_method: 'payport',
        listing_type: listing_type,
        status: 'pending'
      })
      .eq('id', profile_id);

    if (updateError) {
      console.error('[PAYPORT] Error updating profile:', updateError);
      throw new Error('Failed to update profile with payment reference');
    }

    console.log('[PAYPORT] Profile updated');

    /**
     * CHECKOUT URL - MINIMAL (nur ak, cc, r, h)
     * Exakt wie in PayPort Mail beschrieben!
     */
    const params = new URLSearchParams({
      ak: accessKey,
      cc: countryCode,
      r: returnUrl,
      h: hash,
    });

    const fullCheckoutUrl = `https://${checkoutUrlHost}/prepare/checkout?${params.toString()}`;
    
    // Maskierte URL für Logs
    const maskedUrl = fullCheckoutUrl
      .replace(accessKey, '[AK]')
      .replace(hash, '[HASH]');
    
    console.log('[PAYPORT] ========== FINAL URL (MINIMAL) ==========');
    console.log('[PAYPORT] Params: ak, cc, r, h ONLY');
    console.log('[PAYPORT] Masked:', maskedUrl);
    console.log('[PAYPORT] Length:', fullCheckoutUrl.length);
    console.log('[PAYPORT] ==========================================');

    return new Response(
      JSON.stringify({ 
        checkout_url: fullCheckoutUrl,
        reference_id: referenceId,
        debug: {
          hashMode,
          hashDescription,
          returnUrl,
          params: 'ak, cc, r, h (MINIMAL)',
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error('[PAYPORT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
