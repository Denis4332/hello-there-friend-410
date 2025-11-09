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

    const { event_type, event_data, session_id } = await req.json();

    if (!event_type || !session_id) {
      return new Response(
        JSON.stringify({ error: 'event_type and session_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Anonymize IP (GDPR compliance)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0';
    const anonymizedIP = clientIP.split('.').slice(0, 3).join('.') + '.0';

    const { error } = await supabase.from('analytics_events').insert({
      event_type,
      event_data,
      session_id,
      ip_address: anonymizedIP,
      user_agent: req.headers.get('user-agent'),
      referrer: req.headers.get('referer'),
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});