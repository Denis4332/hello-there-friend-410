-- Create site_settings table for content management
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'color', 'image', 'url', 'boolean')),
  category TEXT NOT NULL CHECK (category IN ('content', 'design', 'seo', 'navigation')),
  label TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (for frontend)
CREATE POLICY "Public can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Admins can manage settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert default settings
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
  ('site_title', 'Verifizierte Anbieter in der Schweiz', 'text', 'content', 'Haupttitel Startseite', 'Der Haupttitel auf der Startseite'),
  ('hero_subtitle', 'Finde verifizierte Begleitservice-Anbieter in deiner Nähe', 'textarea', 'content', 'Untertitel Hero', 'Untertitel unter dem Haupttitel'),
  ('search_location_placeholder', 'PLZ oder Ort', 'text', 'content', 'Suchfeld PLZ Platzhalter', 'Platzhalter-Text für Ortssuche'),
  ('search_keyword_placeholder', 'Stichwort (optional)', 'text', 'content', 'Suchfeld Stichwort Platzhalter', 'Platzhalter-Text für Stichwortsuche'),
  ('search_button_text', 'Suchen', 'text', 'content', 'Such-Button Text', 'Text auf dem Such-Button'),
  ('footer_description', 'Die führende Plattform für verifizierte Begleitservice-Anbieter in der Schweiz', 'textarea', 'content', 'Footer Beschreibung', 'Beschreibungstext im Footer'),
  ('meta_description', 'ESCORIA - Finde verifizierte Begleitservice-Anbieter in der Schweiz. Diskret, sicher und verifiziert.', 'textarea', 'seo', 'Meta Description', 'Standard Meta-Beschreibung für SEO'),
  ('meta_keywords', 'Begleitservice, Escort, Schweiz, verifiziert, diskret', 'text', 'seo', 'Meta Keywords', 'Standard Meta-Keywords für SEO')
ON CONFLICT (key) DO NOTHING;