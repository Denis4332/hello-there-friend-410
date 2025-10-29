-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to admin roles (needed for filtering admins from homepage)
CREATE POLICY "Allow public read access to admin roles"
ON public.user_roles
FOR SELECT
TO public
USING (role = 'admin');

-- Allow authenticated users to read their own role
CREATE POLICY "Users can read their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);