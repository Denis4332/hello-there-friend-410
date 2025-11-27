import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { ad_id, event_type } = await req.json();

    if (!ad_id || !event_type || !['impression', 'click'].includes(event_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Increment the counter
    const column = event_type === 'impression' ? 'impressions' : 'clicks';
    
  // First get current value
  const { data: currentAd, error: fetchError } = await supabaseClient
    .from('advertisements')
    .select(column)
    .eq('id', ad_id)
    .single();

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    throw new Error('Advertisement not found or inactive');
  }

    if (fetchError) throw fetchError;
    if (!currentAd) throw new Error('Advertisement not found');
    
    // Then increment it
    const currentValue = (currentAd as any)[column] as number || 0;
    const newValue = currentValue + 1;
    
    const { error } = await supabaseClient
      .from('advertisements')
      .update({ [column]: newValue })
      .eq('id', ad_id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
