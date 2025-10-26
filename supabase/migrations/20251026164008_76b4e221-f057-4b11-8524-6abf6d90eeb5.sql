-- Insert design settings for logo, colors, and hero image
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
  ('design_logo_url', '', 'url', 'design', 'Logo URL', 'URL zum Logo (z.B. https://example.com/logo.png)'),
  ('design_logo_text', 'ESCORIA', 'text', 'design', 'Logo-Text', 'Text der angezeigt wird wenn kein Logo-URL gesetzt ist'),
  ('design_primary_color', '222.2 47.4% 11.2%', 'color', 'design', 'Primärfarbe', 'HSL-Wert für Primärfarbe (z.B. 222.2 47.4% 11.2%)'),
  ('design_secondary_color', '210 40% 96.1%', 'color', 'design', 'Sekundärfarbe', 'HSL-Wert für Sekundärfarbe (z.B. 210 40% 96.1%)'),
  ('design_accent_color', '210 40% 96.1%', 'color', 'design', 'Akzentfarbe', 'HSL-Wert für Akzentfarbe (z.B. 210 40% 96.1%)'),
  ('design_hero_image_url', '', 'url', 'design', 'Hero-Image URL', 'URL zum Hero-Hintergrundbild auf der Startseite'),
  ('design_hero_overlay_opacity', '0.7', 'text', 'design', 'Hero-Overlay Transparenz', 'Wert zwischen 0 und 1 (z.B. 0.7 für 70% Abdunklung)')
ON CONFLICT (key) DO NOTHING;