-- Create profile_contacts table for protected contact information
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text,
  phone text,
  whatsapp text,
  telegram text,
  instagram text,
  website text,
  street_address text,
  show_street boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Migrate existing contact data from profiles to profile_contacts
INSERT INTO public.profile_contacts (profile_id, email, phone, whatsapp, telegram, instagram, website, street_address, show_street)
SELECT id, email, phone, whatsapp, telegram, instagram, website, street_address, show_street
FROM public.profiles
WHERE id IS NOT NULL
ON CONFLICT (profile_id) DO NOTHING;

-- Remove contact columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS whatsapp,
  DROP COLUMN IF EXISTS telegram,
  DROP COLUMN IF EXISTS instagram,
  DROP COLUMN IF EXISTS website,
  DROP COLUMN IF EXISTS street_address,
  DROP COLUMN IF EXISTS show_street;

-- Enable RLS on profile_contacts
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own contact data
CREATE POLICY "Users can view own contact data"
  ON public.profile_contacts FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own contact data
CREATE POLICY "Users can update own contact data"
  ON public.profile_contacts FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own contact data
CREATE POLICY "Users can insert own contact data"
  ON public.profile_contacts FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own contact data
CREATE POLICY "Users can delete own contact data"
  ON public.profile_contacts FOR DELETE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all contact data
CREATE POLICY "Admins can view all contact data"
  ON public.profile_contacts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update all contact data
CREATE POLICY "Admins can update all contact data"
  ON public.profile_contacts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profile_contacts_profile_id ON public.profile_contacts(profile_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_profile_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_contacts_updated_at
  BEFORE UPDATE ON public.profile_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_contacts_updated_at();