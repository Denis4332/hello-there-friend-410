-- Create user_status enum
CREATE TYPE public.user_status AS ENUM ('active', 'suspended');

-- Add status and display_name columns to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN status public.user_status NOT NULL DEFAULT 'active',
ADD COLUMN display_name TEXT;

-- Create a security definer function to get all users with their roles and profile counts
-- This is needed because we can't directly query auth.users from the client
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE (
  id uuid,
  email text,
  role app_role,
  status user_status,
  display_name text,
  profile_count bigint,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id,
    au.email,
    COALESCE(ur.role, 'user'::app_role) as role,
    COALESCE(ur.status, 'active'::user_status) as status,
    ur.display_name,
    COUNT(p.id) as profile_count,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  LEFT JOIN public.profiles p ON p.user_id = au.id
  GROUP BY au.id, au.email, ur.role, ur.status, ur.display_name, au.created_at
  ORDER BY au.created_at DESC;
$$;

-- Grant execute permission to authenticated users
-- (RLS on calling this will be handled in the application code via has_role check)
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO authenticated;