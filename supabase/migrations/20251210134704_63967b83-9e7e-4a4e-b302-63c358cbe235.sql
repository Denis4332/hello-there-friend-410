-- Add 7 missing SEO settings that code expects
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
-- Extended Meta Tags
('seo_author', 'ESCORIA', 'text', 'seo', 'Meta: Author', 'Author/Verfasser der Seite'),
('seo_publisher', 'ESCORIA', 'text', 'seo', 'Meta: Publisher', 'Publisher/Herausgeber'),
('seo_copyright', '© 2025 ESCORIA', 'text', 'seo', 'Meta: Copyright', 'Copyright Hinweis'),
('seo_content_language', 'de-CH', 'text', 'seo', 'Content-Language', 'Sprache der Inhalte (de-CH, en-CH, fr-CH)'),

-- Geo Meta Tags (wichtig für lokale SEO Schweiz!)
('seo_geo_region', 'CH', 'text', 'advanced_seo', 'Geo: Region Code', 'ISO Region Code (CH für Schweiz)'),
('seo_geo_placename', 'Schweiz', 'text', 'advanced_seo', 'Geo: Ortsname', 'Land oder Hauptstadt'),
('seo_geo_position', '46.8182;8.2275', 'text', 'advanced_seo', 'Geo: GPS Position', 'Zentrum der Schweiz (lat;lng)')
ON CONFLICT (key) DO NOTHING;