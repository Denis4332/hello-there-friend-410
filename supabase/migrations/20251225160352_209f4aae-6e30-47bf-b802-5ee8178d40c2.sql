-- Atomare Funktion für Ad-Counter-Increment (Performance-Optimierung)
-- Ersetzt 2 DB-Calls (SELECT + UPDATE) durch 1 atomaren Call
CREATE OR REPLACE FUNCTION public.increment_ad_counter(
  p_ad_id UUID,
  p_column TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_column = 'impressions' THEN
    UPDATE advertisements 
    SET impressions = COALESCE(impressions, 0) + 1
    WHERE id = p_ad_id;
  ELSIF p_column = 'clicks' THEN
    UPDATE advertisements 
    SET clicks = COALESCE(clicks, 0) + 1
    WHERE id = p_ad_id;
  ELSE
    RAISE EXCEPTION 'Invalid column: %', p_column;
  END IF;
END;
$$;

-- Index für schnellere Analytics-Queries im Admin-Dashboard
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created 
ON analytics_events(event_type, created_at DESC);