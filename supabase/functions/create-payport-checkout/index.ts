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
    
    console.log('PayPort Checkout Request:', { profile_id, listing_type, amount });

    if (!profile_id || !listing_type || !amount) {
      throw new Error('Missing required parameters: profile_id, listing_type, amount');
    }

    // Get PayPort credentials from secrets
    const accessKey = Deno.env.get('PAYPORT_ACCESS_KEY');
    const secretKey = Deno.env.get('PAYPORT_SECRET_KEY');
    const countryCode = Deno.env.get('PAYPORT_COUNTRY_CODE') || 'TE';
    const checkoutUrl = Deno.env.get('PAYPORT_CHECKOUT_URL') || 'https://test-pip3.payport.ch/prepare/checkout';
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!accessKey || !secretKey) {
      throw new Error('PayPort credentials not configured');
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Generate unique reference ID
    const timestamp = Date.now();
    const referenceId = `ESC-${timestamp}-${listing_type.toUpperCase()}`;
    
    console.log('Generated Reference ID:', referenceId);

    // Prepare PayPort parameters
    const currency = 'CHF';
    const successUrl = `${req.headers.get('origin') || 'https://escoria.ch'}/zahlung/erfolg?ref=${referenceId}`;
    const cancelUrl = `${req.headers.get('origin') || 'https://escoria.ch'}/zahlung/abgebrochen`;
    const notifyUrl = `${supabaseUrl}/functions/v1/payport-webhook`;
    
    // Build hash string according to PayPort documentation
    // Format: accessKey + referenceId + amount + currency + successUrl + cancelUrl + notifyUrl + secretKey
    const hashString = accessKey + referenceId + amount + currency + successUrl + cancelUrl + notifyUrl + secretKey;
    
    // Calculate HMAC-SHA256 hash
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretKey);
    const data = encoder.encode(hashString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const hash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log('Generated Hash for PayPort');

    // Update profile with payment_reference and pending status
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
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to update profile with payment reference');
    }

    console.log('Profile updated with payment reference');

    // Build checkout URL with parameters
    const params = new URLSearchParams({
      accessKey: accessKey,
      referenceId: referenceId,
      amount: amount.toString(),
      currency: currency,
      country: countryCode,
      successUrl: successUrl,
      cancelUrl: cancelUrl,
      notifyUrl: notifyUrl,
      hash: hash,
    });

    const fullCheckoutUrl = `${checkoutUrl}?${params.toString()}`;
    
    console.log('PayPort Checkout URL generated');

    return new Response(
      JSON.stringify({ 
        checkout_url: fullCheckoutUrl,
        reference_id: referenceId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error('Error creating PayPort checkout:', error);
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
