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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Checking for expired subscriptions...');

    const now = new Date().toISOString();

    // Premium expired: Downgrade to basic
    const { data: expiredPremium, error: premiumError } = await supabase
      .from('profiles')
      .update({ 
        listing_type: 'basic',
        premium_until: null 
      })
      .eq('listing_type', 'premium')
      .lt('premium_until', now)
      .select('id, display_name, premium_until');

    if (premiumError) throw premiumError;

    // TOP AD expired: Downgrade to basic
    const { data: expiredTop, error: topError } = await supabase
      .from('profiles')
      .update({ 
        listing_type: 'basic',
        top_ad_until: null 
      })
      .eq('listing_type', 'top')
      .lt('top_ad_until', now)
      .select('id, display_name, top_ad_until');

    if (topError) throw topError;

    console.log(`✅ Downgraded ${expiredPremium?.length || 0} Premium profiles`);
    console.log(`✅ Downgraded ${expiredTop?.length || 0} TOP AD profiles`);

    if (expiredPremium && expiredPremium.length > 0) {
      console.log('Premium profiles downgraded:', expiredPremium.map(p => p.display_name).join(', '));
    }
    if (expiredTop && expiredTop.length > 0) {
      console.log('TOP AD profiles downgraded:', expiredTop.map(p => p.display_name).join(', '));
    }

    return new Response(
      JSON.stringify({
        success: true,
        downgraded: {
          premium: expiredPremium?.length || 0,
          top: expiredTop?.length || 0
        },
        profiles: [...(expiredPremium || []), ...(expiredTop || [])]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
