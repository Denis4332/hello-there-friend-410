import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { email, type, success } = await req.json();

    if (!email || !type || typeof success !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'email, type, and success are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Anonymize IP (GDPR compliance)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0';
    const anonymizedIP = clientIP.split('.').slice(0, 3).join('.') + '.0';

    console.log(`Recording auth attempt for email: ${email}, type: ${type}, success: ${success}, ip: ${anonymizedIP}`);

    const { error } = await supabase.rpc('record_auth_attempt_with_ip', {
      _attempt_type: type,
      _email: email.toLowerCase().trim(),
      _ip_address: anonymizedIP,
      _success: success
    });

    if (error) {
      console.error('Failed to record auth attempt:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in record-auth-attempt:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
