-- Fix RLS policy for error_logs to allow anonymous and authenticated users to insert errors
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON public.error_logs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.error_logs;

-- Create a policy that allows anyone (anon and authenticated) to insert error logs
CREATE POLICY "Anyone can insert error logs" 
ON public.error_logs 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create a policy that allows admins to view error logs
DROP POLICY IF EXISTS "Admins can view error logs" ON public.error_logs;
CREATE POLICY "Admins can view error logs" 
ON public.error_logs 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);