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

    const { email, type } = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: 'email and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Anonymize IP (GDPR compliance)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0';
    const anonymizedIP = clientIP.split('.').slice(0, 3).join('.') + '.0';

    console.log(`Checking rate limit for email: ${email}, type: ${type}, ip: ${anonymizedIP}`);

    const { data, error } = await supabase.rpc('check_auth_rate_limit_with_ip', {
      _email: email.toLowerCase().trim(),
      _type: type,
      _ip_address: anonymizedIP
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      return new Response(
        JSON.stringify({ allowed: true, remaining_attempts: 5 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-auth-rate-limit:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ allowed: true, remaining_attempts: 5 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
