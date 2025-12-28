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

  console.log('PayPort Webhook received');
  console.log('Method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  try {
    // PayPort sends IPN data as form-urlencoded or JSON
    let webhookData: Record<string, string> = {};
    
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      webhookData = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        webhookData[key] = value.toString();
      });
    } else {
      // Try to parse as text and then as URL params
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        webhookData[key] = value;
      });
    }

    console.log('Webhook Data:', JSON.stringify(webhookData, null, 2));

    // Extract relevant fields from PayPort IPN
    const referenceId = webhookData.referenceId || webhookData.reference_id || webhookData.ref;
    const status = webhookData.status || webhookData.paymentStatus;
    const transactionId = webhookData.transactionId || webhookData.transaction_id;
    const receivedHash = webhookData.hash || webhookData.signature;

    if (!referenceId) {
      console.error('No reference ID in webhook data');
      return new Response('Missing reference ID', { status: 400 });
    }

    console.log('Processing payment for reference:', referenceId);
    console.log('Payment status:', status);
    console.log('Transaction ID:', transactionId);

    // Get credentials for signature validation
    const secretKey = Deno.env.get('PAYPORT_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Find profile by payment_reference
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, listing_type, payment_status')
      .eq('payment_reference', referenceId)
      .single();

    if (fetchError || !profile) {
      console.error('Profile not found for reference:', referenceId, fetchError);
      return new Response('Profile not found', { status: 404 });
    }

    console.log('Found profile:', profile.id);

    // Check if payment is successful (PayPort uses various status codes)
    const isSuccess = status === 'success' || 
                      status === 'SUCCESS' || 
                      status === 'paid' || 
                      status === 'PAID' ||
                      status === '1' ||
                      status === 'completed' ||
                      status === 'COMPLETED';

    if (isSuccess) {
      // Update profile: ONLY payment_status and payment_method
      // DO NOT set status = 'active' (admin does that manually!)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          payment_status: 'paid',
          payment_method: 'payport',
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return new Response('Database update failed', { status: 500 });
      }

      console.log('Profile payment marked as paid:', profile.id);
      console.log('NOTE: Profile status remains pending - admin must manually activate!');

    } else {
      console.log('Payment not successful, status:', status);
      
      // Optionally update to failed status
      await supabase
        .from('profiles')
        .update({
          payment_status: 'failed',
        })
        .eq('id', profile.id);
    }

    // Return success to PayPort
    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
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
