-- Insert missing Impressum CMS settings
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
  ('impressum_title', 'Impressum', 'text', 'content', 'Impressum Seitentitel', 'Titel der Impressum-Seite'),
  ('impressum_company_name', 'ESCORIA GmbH', 'textarea', 'content', 'Firmenname/Betreiber', 'Vollständiger Firmenname und rechtliche Angaben'),
  ('impressum_address', 'Musterstrasse 123\n8000 Zürich\nSchweiz', 'textarea', 'content', 'Adresse', 'Vollständige Geschäftsadresse'),
  ('impressum_email', 'info@escoria.ch', 'text', 'content', 'Kontakt E-Mail', 'E-Mail-Adresse für rechtliche Anfragen'),
  ('impressum_phone', '+41 44 000 00 00', 'text', 'content', 'Telefon', 'Telefonnummer (optional)'),
  ('impressum_additional_info', '<p>UID: CHE-000.000.000</p><p>Handelsregister: Zürich</p>', 'textarea', 'content', 'Weitere Informationen', 'Zusätzliche rechtliche Angaben (UID, Handelsregister, etc.) - HTML erlaubt'),
  ('seo_impressum_title', 'Impressum | ESCORIA', 'text', 'seo', 'Impressum SEO Titel', 'SEO-Titel für die Impressum-Seite'),
  ('seo_impressum_description', 'Impressum und rechtliche Informationen von ESCORIA - Schweizer Dating-Plattform', 'textarea', 'seo', 'Impressum SEO Beschreibung', 'SEO-Beschreibung für die Impressum-Seite')
ON CONFLICT (key) DO NOTHING;