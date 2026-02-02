-- Neue Tabelle für Änderungsanfragen
CREATE TABLE public.profile_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('text', 'photos', 'contact', 'categories', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

-- User kann eigene Anfragen sehen
CREATE POLICY "Users can view own requests" 
ON public.profile_change_requests 
FOR SELECT 
USING (user_id = auth.uid());

-- User kann Anfragen für eigenes Profil erstellen
CREATE POLICY "Users can create requests for own profile" 
ON public.profile_change_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid())
);

-- Admin hat vollen Zugriff
CREATE POLICY "Admin full access" 
ON public.profile_change_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger für updated_at
CREATE TRIGGER update_profile_change_requests_updated_at
BEFORE UPDATE ON public.profile_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();