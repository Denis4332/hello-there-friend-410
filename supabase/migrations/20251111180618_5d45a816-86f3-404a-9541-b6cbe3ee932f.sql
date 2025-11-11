-- Create a public view that excludes sensitive fields (user_id, lat, lng)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  age,
  gender,
  city,
  canton,
  postal_code,
  about_me,
  languages,
  verified_at,
  status,
  slug,
  is_adult,
  listing_type,
  premium_until,
  top_ad_until,
  created_at,
  updated_at
FROM public.profiles;

-- Grant SELECT on the view to anon and authenticated users
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add RLS to the view (security_invoker means the view uses the calling user's permissions)
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Update the profiles table RLS policies
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public can view active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profiles with all fields" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles with all fields" ON public.profiles;

-- Create new policies with distinct names
CREATE POLICY "public_active_profiles_select"
ON public.profiles
FOR SELECT
USING (status = 'active');

CREATE POLICY "owner_full_profile_select"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "admin_full_profile_select"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
    AND user_roles.status = 'active'
  )
);