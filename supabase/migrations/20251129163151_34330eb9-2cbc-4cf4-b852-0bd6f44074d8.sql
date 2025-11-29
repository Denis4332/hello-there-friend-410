-- Create agb_acceptances table for legal compliance tracking
CREATE TABLE public.agb_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acceptance_type TEXT NOT NULL CHECK (acceptance_type IN ('registration', 'profile_creation', 'admin_created')),
  ip_address TEXT,
  user_agent TEXT,
  agb_version TEXT NOT NULL DEFAULT '1.0',
  created_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agb_acceptances ENABLE ROW LEVEL SECURITY;

-- Admins can read all acceptances
CREATE POLICY "Admins can read all agb_acceptances" 
ON public.agb_acceptances 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can read own acceptances
CREATE POLICY "Users can read own agb_acceptances" 
ON public.agb_acceptances 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can insert own acceptances (for registration and profile creation)
CREATE POLICY "Users can insert own agb_acceptances" 
ON public.agb_acceptances 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Admins can insert acceptances (for admin-created profiles)
CREATE POLICY "Admins can insert agb_acceptances" 
ON public.agb_acceptances 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_agb_acceptances_user_id ON public.agb_acceptances(user_id);
CREATE INDEX idx_agb_acceptances_profile_id ON public.agb_acceptances(profile_id);
CREATE INDEX idx_agb_acceptances_email ON public.agb_acceptances(email);