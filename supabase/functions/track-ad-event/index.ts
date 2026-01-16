import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reuse client across requests (performance optimization)
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Type for aggregated counter updates
type AggregatedEvent = {
  ad_id: string;
  column: 'impressions' | 'clicks';
  count: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Normalize input: support both single event and batch format
    // Single: { ad_id, event_type }
    // Batch: { events: [{ ad_id, event_type }, ...] }
    let events: Array<{ ad_id: string; event_type: string }>;

    if (Array.isArray(body.events)) {
      // Batch format
      events = body.events;
    } else if (body.ad_id && body.event_type) {
      // Single format (backward compatible)
      events = [{ ad_id: body.ad_id, event_type: body.event_type }];
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: expected { ad_id, event_type } or { events: [...] }' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and filter events
    const validEvents = events.filter(
      (e) => e.ad_id && ['impression', 'click'].includes(e.event_type)
    );

    if (validEvents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid events provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate events by ad_id + event_type to minimize DB calls
    const aggregated = new Map<string, AggregatedEvent>();

    for (const event of validEvents) {
      const column = event.event_type === 'impression' ? 'impressions' : 'clicks';
      const key = `${event.ad_id}:${column}`;

      const existing = aggregated.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        aggregated.set(key, {
          ad_id: event.ad_id,
          column,
          count: 1,
        });
      }
    }

    // Process updates SEQUENTIALLY to avoid DB lock contention
    // (NO Promise.all - this is intentional for performance)
    const errors: string[] = [];

    for (const agg of aggregated.values()) {
      try {
        // Use the new v2 function with delta support
        const { error } = await supabaseClient.rpc('increment_ad_counter_v2', {
          p_ad_id: agg.ad_id,
          p_column: agg.column,
          p_delta: agg.count,
        });

        if (error) {
          console.error(`RPC error for ${agg.ad_id}:`, error);
          errors.push(`${agg.ad_id}: ${error.message}`);
        }
      } catch (err) {
        console.error(`Exception for ${agg.ad_id}:`, err);
        errors.push(`${agg.ad_id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Return success even if some updates failed (fire-and-forget semantics)
    return new Response(
      JSON.stringify({
        success: true,
        processed: aggregated.size,
        events_count: validEvents.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
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
