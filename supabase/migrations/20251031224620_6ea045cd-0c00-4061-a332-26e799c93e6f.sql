-- Create function for updating updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create advertisements table for banner management
CREATE TABLE IF NOT EXISTS public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text NOT NULL,
  position text NOT NULL CHECK (position IN ('popup', 'top', 'grid')),
  priority integer DEFAULT 0,
  active boolean DEFAULT true,
  start_date date,
  end_date date,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  
  -- Pop-up specific settings
  popup_delay_seconds integer DEFAULT 5,
  popup_frequency text DEFAULT 'once_per_session' CHECK (popup_frequency IN ('once_per_session', 'once_per_day', 'always')),
  
  -- Payment preparation
  stripe_payment_id text,
  payment_required boolean DEFAULT false,
  price_per_day numeric,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Public can view active ads within date range
CREATE POLICY "Public can view active ads"
  ON public.advertisements FOR SELECT
  USING (
    active = true 
    AND (start_date IS NULL OR start_date <= CURRENT_DATE) 
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  );

-- Admins can manage all ads
CREATE POLICY "Admins can manage ads"
  ON public.advertisements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();