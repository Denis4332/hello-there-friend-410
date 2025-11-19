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

    // Premium expired: Set to INACTIVE
    const { data: expiredPremium, error: premiumError } = await supabase
      .from('profiles')
      .update({ 
        status: 'inactive',
        premium_until: null 
      })
      .eq('listing_type', 'premium')
      .eq('status', 'active')
      .lt('premium_until', now)
      .select('id, display_name, premium_until');

    if (premiumError) throw premiumError;

    // TOP AD expired: Set to INACTIVE
    const { data: expiredTop, error: topError } = await supabase
      .from('profiles')
      .update({ 
        status: 'inactive',
        top_ad_until: null 
      })
      .eq('listing_type', 'top')
      .eq('status', 'active')
      .lt('top_ad_until', now)
      .select('id, display_name, top_ad_until');

    if (topError) throw topError;

    // Basic expired: Set to INACTIVE
    const { data: expiredBasic, error: basicError } = await supabase
      .from('profiles')
      .update({ 
        status: 'inactive',
        premium_until: null 
      })
      .eq('listing_type', 'basic')
      .eq('status', 'active')
      .lt('premium_until', now)
      .select('id, display_name, premium_until');

    if (basicError) throw basicError;

    console.log(`✅ Deactivated ${expiredPremium?.length || 0} Premium profiles`);
    console.log(`✅ Deactivated ${expiredTop?.length || 0} TOP AD profiles`);
    console.log(`✅ Deactivated ${expiredBasic?.length || 0} Basic profiles`);

    if (expiredPremium && expiredPremium.length > 0) {
      console.log('Premium profiles deactivated:', expiredPremium.map(p => p.display_name).join(', '));
    }
    if (expiredTop && expiredTop.length > 0) {
      console.log('TOP AD profiles deactivated:', expiredTop.map(p => p.display_name).join(', '));
    }
    if (expiredBasic && expiredBasic.length > 0) {
      console.log('Basic profiles deactivated:', expiredBasic.map(p => p.display_name).join(', '));
    }

    return new Response(
      JSON.stringify({
        success: true,
        deactivated: {
          premium: expiredPremium?.length || 0,
          top: expiredTop?.length || 0,
          basic: expiredBasic?.length || 0
        },
        profiles: [...(expiredPremium || []), ...(expiredTop || []), ...(expiredBasic || [])]
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
