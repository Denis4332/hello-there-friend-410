-- Create increment_ad_counter_v2 function with delta support for batching
CREATE OR REPLACE FUNCTION public.increment_ad_counter_v2(
  p_ad_id UUID,
  p_column TEXT,
  p_delta INT DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_column = 'impressions' THEN
    UPDATE advertisements 
    SET impressions = COALESCE(impressions, 0) + p_delta
    WHERE id = p_ad_id;
  ELSIF p_column = 'clicks' THEN
    UPDATE advertisements 
    SET clicks = COALESCE(clicks, 0) + p_delta
    WHERE id = p_ad_id;
  ELSE
    RAISE EXCEPTION 'Invalid column: %', p_column;
  END IF;
END;
$$;