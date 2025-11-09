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

    const { profile_id, session_id } = await req.json();

    if (!profile_id || !session_id) {
      return new Response(
        JSON.stringify({ error: 'profile_id and session_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate view (same session within 30 minutes)
    const { data: recentView } = await supabase
      .from('profile_views')
      .select('id')
      .eq('profile_id', profile_id)
      .eq('session_id', session_id)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .single();

    if (recentView) {
      return new Response(
        JSON.stringify({ success: true, duplicate: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Anonymize IP
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0';
    const anonymizedIP = clientIP.split('.').slice(0, 3).join('.') + '.0';

    const { error } = await supabase.from('profile_views').insert({
      profile_id,
      session_id,
      ip_address: anonymizedIP,
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