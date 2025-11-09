-- Add ip_address column to auth_rate_limits table
ALTER TABLE public.auth_rate_limits 
ADD COLUMN ip_address TEXT;

-- Create index on ip_address for faster lookups
CREATE INDEX idx_auth_rate_limits_ip 
ON public.auth_rate_limits(ip_address);

-- Create composite index on email and ip_address for combined lookups
CREATE INDEX idx_auth_rate_limits_email_ip 
ON public.auth_rate_limits(email, ip_address);