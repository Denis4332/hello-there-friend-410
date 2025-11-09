-- Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);

-- Profile Views Table
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile ON public.profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created ON public.profile_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_session ON public.profile_views(session_id);

-- Search Queries Table
CREATE TABLE IF NOT EXISTS public.search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT,
  canton TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  radius INT,
  user_lat DECIMAL,
  user_lng DECIMAL,
  results_count INT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_created ON public.search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_category ON public.search_queries(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_search_queries_canton ON public.search_queries(canton) WHERE canton IS NOT NULL;

-- View for Profile View Counts
CREATE OR REPLACE VIEW public.profile_view_counts AS
SELECT 
  profile_id,
  COUNT(*) as total_views,
  COUNT(DISTINCT session_id) as unique_views,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as views_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as views_7d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as views_30d
FROM public.profile_views
GROUP BY profile_id;

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Admin read policies
CREATE POLICY "Admins can view analytics_events"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view profile_views"
  ON public.profile_views FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view search_queries"
  ON public.search_queries FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public insert policies for tracking
CREATE POLICY "Anyone can insert analytics_events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert profile_views"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert search_queries"
  ON public.search_queries FOR INSERT
  WITH CHECK (true);

-- Function to clean old analytics data (90 days retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.profile_views WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.search_queries WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;