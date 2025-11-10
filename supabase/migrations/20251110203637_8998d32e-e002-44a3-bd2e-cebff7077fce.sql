-- Phase 1: Security Fixes
-- Fix all critical security issues identified by Supabase Linter

-- ============================================
-- 1. FIX FUNCTION SEARCH PATHS
-- ============================================

-- Update all public functions to use immutable search_path
-- This prevents privilege escalation attacks

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND status = 'active'::user_status
  )
$$;

-- Fix check_contact_rate_limit function
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit(_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  message_count int;
BEGIN
  -- Count messages from this email in the last hour
  SELECT COUNT(*) INTO message_count
  FROM public.contact_messages
  WHERE email = _email
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Allow if less than 3 messages per hour
  RETURN message_count < 3;
END;
$$;

-- Fix check_error_rate_limit function
CREATE OR REPLACE FUNCTION public.check_error_rate_limit(_url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  error_count int;
BEGIN
  -- Count errors from this URL in the last 5 minutes
  SELECT COUNT(*) INTO error_count
  FROM public.error_logs
  WHERE url = _url
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  -- Allow if less than 10 errors per 5 minutes
  RETURN error_count < 10;
END;
$$;

-- Fix record_auth_attempt_with_ip function (if exists)
CREATE OR REPLACE FUNCTION public.record_auth_attempt_with_ip(
  _email text,
  _attempt_type text,
  _success boolean,
  _ip_address text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update rate limit record
  INSERT INTO public.auth_rate_limits (email, attempt_type, ip_address, failed_attempts, last_attempt_at)
  VALUES (_email, _attempt_type, _ip_address, CASE WHEN _success THEN 0 ELSE 1 END, NOW())
  ON CONFLICT (email, attempt_type)
  DO UPDATE SET
    failed_attempts = CASE 
      WHEN _success THEN 0 
      ELSE public.auth_rate_limits.failed_attempts + 1 
    END,
    last_attempt_at = NOW(),
    ip_address = _ip_address,
    locked_until = CASE
      WHEN NOT _success AND public.auth_rate_limits.failed_attempts + 1 >= 5 
      THEN NOW() + INTERVAL '30 minutes'
      ELSE public.auth_rate_limits.locked_until
    END;
END;
$$;

-- ============================================
-- 2. ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================

-- Enable RLS on all public tables that don't have it yet
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cantons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dropdown_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_moderation_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. FIX SECURITY DEFINER VIEW
-- ============================================

-- Drop and recreate profile_view_counts as a regular view (without SECURITY DEFINER)
-- This view aggregates profile view statistics
DROP VIEW IF EXISTS public.profile_view_counts;

CREATE VIEW public.profile_view_counts AS
SELECT 
  profile_id,
  COUNT(DISTINCT id) AS total_views,
  COUNT(DISTINCT session_id) AS unique_views,
  COUNT(DISTINCT id) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS views_24h,
  COUNT(DISTINCT id) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS views_7d,
  COUNT(DISTINCT id) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS views_30d
FROM public.profile_views
GROUP BY profile_id;

-- Grant appropriate permissions
GRANT SELECT ON public.profile_view_counts TO authenticated;
GRANT SELECT ON public.profile_view_counts TO anon;

-- ============================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION public.has_role IS 'Security definer function to check user roles. Uses immutable search_path to prevent privilege escalation.';
COMMENT ON FUNCTION public.check_contact_rate_limit IS 'Rate limiting for contact form submissions. Allows 3 messages per hour per email.';
COMMENT ON FUNCTION public.check_error_rate_limit IS 'Rate limiting for error log submissions. Allows 10 errors per 5 minutes per URL.';
COMMENT ON VIEW public.profile_view_counts IS 'Aggregates profile view statistics. Regular view without SECURITY DEFINER for better security.';